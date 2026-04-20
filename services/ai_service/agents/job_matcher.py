# agents/job_matcher.py — Job-Candidate Matching skill

from models.schemas import JobMatchRequest, JobMatchResult
from db.mongo import log_trace


# ── Scoring Weights ───────────────────────────────────────────────────────────

SENIORITY_MAP = {
    "intern":     0,
    "junior":     1,
    "mid":        2,
    "senior":     3,
    "lead":       4,
    "principal":  5,
    "director":   6,
    "vp":         7,
}

SENIORITY_YEARS = {
    "intern":    0,
    "junior":    1,
    "mid":       3,
    "senior":    5,
    "lead":      7,
    "principal": 10,
    "director":  12,
    "vp":        15,
}


# ── Scoring Logic ─────────────────────────────────────────────────────────────

def skill_score(candidate_skills: list[str], required_skills: list[str]) -> tuple[float, list[str], list[str]]:
    """Returns (score 0-1, matched skills, missing skills)."""
    if not required_skills:
        return 1.0, [], []

    candidate_set = {s.lower() for s in candidate_skills}
    required_set  = {s.lower() for s in required_skills}

    matched = list(candidate_set & required_set)
    missing = list(required_set - candidate_set)

    score = len(matched) / len(required_set)
    return round(score, 3), matched, missing


def seniority_score(years_exp: float, seniority_level: str) -> float:
    """Returns 0-1 based on how well years of experience matches seniority."""
    level = seniority_level.lower()
    expected_years = SENIORITY_YEARS.get(level, 3)

    if expected_years == 0:
        return 1.0

    ratio = years_exp / expected_years
    if ratio >= 1.0:
        return 1.0
    elif ratio >= 0.75:
        return 0.8
    elif ratio >= 0.5:
        return 0.6
    else:
        return 0.3


def build_explanation(
    match_score: float,
    matched: list[str],
    missing: list[str],
    seniority_level: str,
    years_exp: float
) -> str:
    pct = int(match_score * 100)
    exp_str = f"{int(years_exp)} years" if years_exp > 0 else "experience not detected"

    if match_score >= 0.8:
        strength = "Strong match"
    elif match_score >= 0.5:
        strength = "Moderate match"
    else:
        strength = "Weak match"

    matched_str = ", ".join(matched) if matched else "none"
    missing_str = ", ".join(missing) if missing else "none"

    return (
        f"{strength} ({pct}% skill alignment). "
        f"Candidate has {exp_str} targeting a {seniority_level} role. "
        f"Matched skills: {matched_str}. "
        f"Missing skills: {missing_str}."
    )


# ── Main Entry Point ──────────────────────────────────────────────────────────

def match_candidate(request: JobMatchRequest, trace_id: str) -> JobMatchResult:
    """
    Score a candidate against a job posting.
    Returns match score (0.0-1.0), matched/missing skills, and explanation.
    """
    s_score, matched, missing = skill_score(
        request.parsed_resume.skills,
        request.skills_required
    )

    sen_score = seniority_score(
        request.parsed_resume.years_of_experience,
        request.seniority_level
    )

    # Weighted final score: 70% skills, 30% seniority
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

    # Log trace step to MongoDB
    log_trace(trace_id=trace_id, step="job_matched", data={
        "member_id":    request.parsed_resume.member_id,
        "job_id":       request.job_id,
        "match_score":  final_score,
        "skill_score":  s_score,
        "seniority_score": sen_score,
        "matched_count": len(matched),
        "missing_count": len(missing)
    })

    return result