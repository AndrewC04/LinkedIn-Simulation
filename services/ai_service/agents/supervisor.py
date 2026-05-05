# agents/supervisor.py — Hiring Assistant supervisor agent

import asyncio
import logging
import os

import pymysql
import requests
from openai import OpenAI
from pymongo import MongoClient
from models.schemas import (
    ResumeParserRequest, JobMatchRequest,
    SupervisorResult, ShortlistedCandidate
)
from agents.resume_parser import parse_resume
from agents.job_matcher import match_candidate
from db.mongo import update_task_status, log_trace

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Minimum match score to be shortlisted
SHORTLIST_THRESHOLD = 0.2

# MongoDB connection to the linkedin database (where member resumes live)
_mongo_host = os.getenv("MONGO_HOST", "localhost")
_mongo_user = os.getenv("MONGO_USER", "root")
_mongo_pass = os.getenv("MONGO_PASSWORD", "rootpassword")
_mongo_port = os.getenv("MONGO_PORT", "27017")
_profile_client = MongoClient(f"mongodb://{_mongo_user}:{_mongo_pass}@{_mongo_host}:{_mongo_port}")
_members_col = _profile_client["linkedin"]["members"]

# Job Service URL
JOB_SERVICE_URL = os.getenv("JOB_SERVICE_URL", "http://job-api:8002")


# ── MySQL connection helper ───────────────────────────────────────────────────
def get_mysql_conn():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "mysql"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", "rootpassword"),
        database="linkedin_db",
        cursorclass=pymysql.cursors.DictCursor
    )


def get_job(job_id: str) -> dict | None:
    """Fetch job details from the Job Service."""
    try:
        response = requests.post(
            f"{JOB_SERVICE_URL}/jobs/get",
            json={"job_id": job_id, "actor_id": "ai-service"},
            timeout=5
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Failed to fetch job {job_id}: {e}")
        return None


def get_resume_text(candidate_id: str) -> str | None:
    """Fetch resume text from MongoDB linkedin.members collection."""
    member = _members_col.find_one({"member_id": candidate_id})
    if member:
        return member.get("resume_text")
    return None


# ── Fetch candidate IDs from MySQL applications table ─────────────────────────
def get_candidates_for_job(job_id: str) -> list[str]:
    """Fetch applicant member_ids from MySQL applications table."""
    try:
        conn = get_mysql_conn()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT member_id FROM applications WHERE job_id = %s AND status != 'rejected'",
                (job_id,)
            )
            rows = cur.fetchall()
        conn.close()
        return [r["member_id"] for r in rows]
    except Exception as e:
        logger.error(f"MySQL candidates fetch error: {e}")
        return []


# ── Fallback: build resume text from MySQL member profile ─────────────────────
def get_resume_text_from_mysql(candidate_id: str) -> str | None:
    """Build resume text from MySQL member profile as fallback."""
    try:
        conn = get_mysql_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM members WHERE member_id = %s", (candidate_id,))
            member = cur.fetchone()
            cur.execute("SELECT * FROM member_experience WHERE member_id = %s", (candidate_id,))
            experiences = cur.fetchall()
        conn.close()
        if not member:
            return None
        lines = [
            f"Name: {member.get('first_name', '')} {member.get('last_name', '')}",
            f"Headline: {member.get('headline', '')}",
            f"Skills: {member.get('skills', '')}",
        ]
        for exp in experiences:
            lines.append(
                f"Experience: {exp.get('title', '')} at {exp.get('company', '')} "
                f"({exp.get('start_date', '')} - {exp.get('end_date', 'present')})"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"MySQL resume fetch error: {e}")
        return None


# ── Outreach Draft Generator (LLM-powered) ────────────────────────────────────
def generate_outreach(
    candidate_name: str,
    job_title: str,
    matched_skills: list[str],
    previous_roles: list[str]
) -> str:
    skills_str = ", ".join(matched_skills[:5]) if matched_skills else "your background"
    roles_str  = previous_roles[0] if previous_roles else "your recent role"
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": f"""Write a short, warm LinkedIn recruiter outreach message (under 100 words).
Candidate: {candidate_name}
Their most recent role: {roles_str}
Their key skills: {skills_str}
Role we're hiring for: {job_title}
Make it specific to their background, not generic."""
            }]
        )
        return response.choices[0].message.content.strip()
    except Exception:
        skills_str = ", ".join(matched_skills[:3]) if matched_skills else "your background"
        return (
            f"Hi {candidate_name}, I came across your profile and was impressed by your "
            f"experience with {skills_str}. We have an exciting {job_title} opportunity "
            f"that aligns well with your background. Would you be open to a quick chat?"
        )


# ── Supervisor Pipeline ───────────────────────────────────────────────────────
async def run_supervisor(
    task_id: str,
    trace_id: str,
    job_id: str,
    candidate_ids: list[str]
) -> SupervisorResult:
    """
    Orchestrates the full AI pipeline:
    1. Update task status to 'running'
    2. Fetch job details
    3. For each candidate: fetch resume from MongoDB → parse → match to job
    4. Shortlist candidates above threshold
    5. Generate outreach drafts (LLM)
    6. Update task status to 'awaiting_approval'
    """

    # ── Step 1: Mark task as running ──────────────────────────────────────────
    update_task_status(task_id=task_id, status="running", step="supervisor_started")
    log_trace(trace_id, "supervisor_started", {
        "job_id": job_id,
        "candidate_count": len(candidate_ids)
    })

    # ── Step 2: Fetch job details ─────────────────────────────────────────────
    job = get_job(job_id)
    if not job:
        update_task_status(task_id=task_id, status="failed", step="job_not_found")
        raise ValueError(f"Job {job_id} not found")

    update_task_status(task_id=task_id, status="running", step="job_fetched")

    # ✅ Step 2b: Auto-fetch candidates from MySQL if none provided
    if not candidate_ids:
        candidate_ids = get_candidates_for_job(job_id)
        log_trace(trace_id, "candidates_fetched_from_db", {"count": len(candidate_ids)})

    # ── Step 3: Process each candidate ───────────────────────────────────────
    shortlisted = []

    for candidate_id in candidate_ids:
        # ✅ Try MongoDB first, fall back to MySQL profile
        resume_text = get_resume_text(candidate_id) or get_resume_text_from_mysql(candidate_id)
        if not resume_text:
            log_trace(trace_id, "candidate_skipped", {
                "candidate_id": candidate_id,
                "reason": "no resume found in MongoDB or MySQL"
            })
            continue

        # Parse resume (LLM-powered)
        parse_request = ResumeParserRequest(
            member_id=candidate_id,
            resume_text=resume_text
        )
        parsed = parse_resume(parse_request, trace_id)
        update_task_status(task_id=task_id, status="running", step=f"resume_parsed:{candidate_id}")

        await asyncio.sleep(0.3)

        # Match to job (embedding-powered)
        match_request = JobMatchRequest(
            parsed_resume=parsed,
            job_id=job_id,
            job_title=job["title"],
            skills_required=job["skills_required"],
            seniority_level=job["seniority_level"],
            location=job["location"]
        )
        match_result = match_candidate(match_request, trace_id)
        update_task_status(task_id=task_id, status="running", step=f"job_matched:{candidate_id}")

        # Shortlist if above threshold
        if match_result.match_score >= SHORTLIST_THRESHOLD:
            outreach = generate_outreach(
                candidate_name=candidate_id,
                job_title=job["title"],
                matched_skills=match_result.matched_skills,
                previous_roles=parsed.previous_roles
            )
            shortlisted.append(ShortlistedCandidate(
                member_id=candidate_id,
                match_score=match_result.match_score,
                matched_skills=match_result.matched_skills,
                missing_skills=match_result.missing_skills,
                explanation=match_result.explanation,
                outreach_draft=outreach
            ))

    # Sort by match score descending
    shortlisted.sort(key=lambda x: x.match_score, reverse=True)

    # ── Step 4: Build final result ────────────────────────────────────────────
    result = SupervisorResult(
        task_id=task_id,
        trace_id=trace_id,
        job_id=job_id,
        shortlisted=shortlisted,
        status="awaiting_approval"
    )

    log_trace(trace_id, "supervisor_completed", {
        "total_candidates": len(candidate_ids),
        "shortlisted_count": len(shortlisted),
        "top_score": shortlisted[0].match_score if shortlisted else 0
    })

    # ── Step 5: Update task to awaiting approval ──────────────────────────────
    update_task_status(
        task_id=task_id,
        status="awaiting_approval",
        step="supervisor_completed",
        result=result.model_dump()
    )

    return result