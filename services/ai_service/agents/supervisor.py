# agents/supervisor.py — Hiring Assistant supervisor agent

import asyncio
import os
from openai import OpenAI
from pymongo import MongoClient
from models.schemas import (
    ResumeParserRequest, JobMatchRequest,
    SupervisorResult, ShortlistedCandidate
)
from agents.resume_parser import parse_resume
from agents.job_matcher import match_candidate
from db.mongo import update_task_status, log_trace

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

# Mock job store — in production this comes from Job Service (:8002)
MOCK_JOBS = {
    "job001": {
        "title":           "Senior Data Engineer",
        "skills_required": ["python", "kafka", "spark", "aws", "mongodb"],
        "seniority_level": "senior",
        "location":        "San Francisco, CA"
    },
    "job002": {
        "title":           "ML Engineer",
        "skills_required": ["python", "machine learning", "deep learning", "pytorch", "aws"],
        "seniority_level": "mid",
        "location":        "Remote"
    },
    "job003": {
        "title":           "Backend Engineer",
        "skills_required": ["python", "fastapi", "docker", "mongodb", "kafka"],
        "seniority_level": "mid",
        "location":        "New York, NY"
    }
}


def get_resume_text(candidate_id: str) -> str | None:
    """Fetch resume text from MongoDB linkedin.members collection."""
    member = _members_col.find_one({"member_id": candidate_id})
    if member:
        return member.get("resume_text")
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
    job = MOCK_JOBS.get(job_id)
    if not job:
        update_task_status(task_id=task_id, status="failed", step="job_not_found")
        raise ValueError(f"Job {job_id} not found")

    update_task_status(task_id=task_id, status="running", step="job_fetched")

    # ── Step 3: Process each candidate ───────────────────────────────────────
    shortlisted = []

    for candidate_id in candidate_ids:
        resume_text = get_resume_text(candidate_id)
        if not resume_text:
            log_trace(trace_id, "candidate_skipped", {
                "candidate_id": candidate_id,
                "reason": "no resume in MongoDB"
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