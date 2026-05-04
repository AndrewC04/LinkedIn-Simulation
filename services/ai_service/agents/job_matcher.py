# agents/job_matcher.py — Job-Candidate Matching skill (Embedding-powered)

import os
import numpy as np
from openai import OpenAI
from models.schemas import JobMatchRequest, JobMatchResult
from db.mongo import log_trace

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── Seniority Tables (unchanged) ──────────────────────────────────────────────

SENIORITY_YEARS = {
    "intern": 0, "junior": 1, "mid": 3, "senior": 5,
    "lead": 7, "principal": 10, "director": 12, "vp": 15,
}


# ── Embedding Helpers ─────────────────────────────────────────────────────────

def get_embedding(text: str) -> np.ndarray:
    """Get embedding vector from OpenAI. Fast + cheap at scale."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000]  # token safety cap
    )
    return np.array(response.data[0].embedding)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two embedding vectors."""
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(np.dot(a, b) / norm)


def semantic_skill_match(
    candidate_skills: list[str],
    required_skills: list[str]
) -> tuple[float, list[str], list[str]]:
    """
    For each required skill, find the best matching candidate skill
    using embeddings. A match is counted if similarity >= 0.75.
    Falls back to exact match if embeddings fail.
    """
    if not required_skills:
        return 1.0, [], []
    if not candidate_skills:
        return 0.0, [], required_skills

    try:
        # Batch embed all skills in two API calls
        req_embeddings = [get_embedding(s) for s in required_skills]
        cand_embeddings = [get_embedding(s) for s in candidate_skills]

        matched = []
        missing = []
        THRESHOLD = 0.75

        for i, req_skill in enumerate(required_skills):
            # Find best candidate skill match for this required skill
            best_sim = max(
                cosine_similarity(req_embeddings[i], cand_emb)
                for cand_emb in cand_embeddings
            )
            if best_sim >= THRESHOLD:
                matched.append(req_skill)
            else:
                missing.append(req_skill)

        score = round(len(matched) / len(required_skills), 3)
        return score, matched, missing

    except Exception:
        # Fallback to exact keyword match if embeddings fail
        candidate_set = {s.lower() for s in candidate_skills}
        required_set  = {s.lower() for s in required_skills}
        matched = list(candidate_set & required_set)
        missing = list(required_set - candidate_set)
        return round(len(matched) / len(required_set), 3), matched, missing


# ── Seniority Score (unchanged logic) ────────────────────────────────────────

def seniority_score(years_exp: float, seniority_level: str) -> float:
    expected = SENIORITY_YEARS.get(seniority_level.lower(), 3)
    if expected == 0:
        return 1.0
    ratio = years_exp / expected
    if ratio >= 1.0:   return 1.0
    elif ratio >= 0.75: return 0.8
    elif ratio >= 0.5:  return 0.6
    else:               return 0.3


def build_explanation(
    match_score: float,
    matched: list[str],
    missing: list[str],
    seniority_level: str,
    years_exp: float
) -> str:
    pct = int(match_score * 100)
    exp_str = f"{int(years_exp)} years" if years_exp > 0 else "experience not detected"
    strength = "Strong match" if match_score >= 0.8 else "Moderate match" if match_score >= 0.5 else "Weak match"
    return (
        f"{strength} ({pct}% semantic skill alignment). "
        f"Candidate has {exp_str} targeting a {seniority_level} role. "
        f"Matched skills: {', '.join(matched) or 'none'}. "
        f"Missing skills: {', '.join(missing) or 'none'}."
    )


# ── Main Entry Point ──────────────────────────────────────────────────────────

def match_candidate(request: JobMatchRequest, trace_id: str) -> JobMatchResult:
    """
    Score a candidate against a job posting using semantic embeddings.
    70% semantic skill match + 30% seniority fit.
    """
    s_score, matched, missing = semantic_skill_match(
        request.parsed_resume.skills,
        request.skills_required
    )

    sen_score = seniority_score(
        request.parsed_resume.years_of_experience,
        request.seniority_level
    )

    final_score = round((s_score * 0.7) + (sen_score * 0.3), 3)

    explanation = build_explanation(
        final_score, matched, missing,
        request.seniority_level,
        request.parsed_resume.years_of_experience
    )

    result = JobMatchResult(
        member_id=request.parsed_resume.member_id,
        job_id=request.job_id,
        match_score=final_score,
        matched_skills=matched,
        missing_skills=missing,
        explanation=explanation
    )

    log_trace(trace_id=trace_id, step="job_matched", data={
        "member_id":       request.parsed_resume.member_id,
        "job_id":          request.job_id,
        "match_score":     final_score,
        "skill_score":     s_score,
        "seniority_score": sen_score,
        "matched_count":   len(matched),
        "missing_count":   len(missing),
        "method":          "embedding"
    })

    return result