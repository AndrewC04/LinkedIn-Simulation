# agents/resume_parser.py — Resume Parser skill

import re
from models.schemas import ResumeParserRequest, ParsedResume
from db.mongo import log_trace

# ── Skill & Experience Keywords ───────────────────────────────────────────────

KNOWN_SKILLS = [
    # Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "scala", "kotlin", "swift", "r", "sql", "bash",
    # Frameworks & Libraries
    "fastapi", "django", "flask", "react", "node.js", "spring", "kafka",
    "spark", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    # Infrastructure & Tools
    "docker", "kubernetes", "aws", "gcp", "azure", "mongodb", "postgresql",
    "mysql", "redis", "git", "ci/cd", "linux",
    # Concepts
    "machine learning", "deep learning", "nlp", "data engineering",
    "distributed systems", "microservices", "restful apis", "agile"
]

EDUCATION_KEYWORDS = [
    "b.s.", "b.sc", "bachelor", "m.s.", "m.sc", "master", "phd", "ph.d",
    "mba", "associate", "degree", "university", "college", "institute",
    "computer science", "data science", "engineering", "mathematics"
]

ROLE_KEYWORDS = [
    "engineer", "developer", "scientist", "analyst", "architect", "manager",
    "lead", "intern", "consultant", "director", "vp", "head of"
]

YEAR_PATTERN = re.compile(r'\b(19|20)\d{2}\b')


# ── Parser Logic ──────────────────────────────────────────────────────────────

def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    return [skill for skill in KNOWN_SKILLS if skill in text_lower]


def extract_education(text: str) -> list[str]:
    lines = text.split("\n")
    results = []
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in EDUCATION_KEYWORDS):
            cleaned = line.strip()
            if cleaned and cleaned not in results:
                results.append(cleaned)
    return results[:5]  # cap at 5


def extract_roles(text: str) -> list[str]:
    lines = text.split("\n")
    results = []
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in ROLE_KEYWORDS):
            cleaned = line.strip()
            if cleaned and cleaned not in results:
                results.append(cleaned)
    return results[:8]  # cap at 8


def estimate_experience(text: str) -> float:
    years = [int(y) for y in YEAR_PATTERN.findall(text)]
    if len(years) < 2:
        return 0.0
    return float(max(years) - min(years))


# ── Main Entry Point ──────────────────────────────────────────────────────────

def parse_resume(request: ResumeParserRequest, trace_id: str) -> ParsedResume:
    """
    Parse raw resume text and return structured fields.
    Logs each step to MongoDB for observability.
    """
    text = request.resume_text

    skills      = extract_skills(text)
    education   = extract_education(text)
    roles       = extract_roles(text)
    years_exp   = estimate_experience(text)

    result = ParsedResume(
        member_id=request.member_id,
        skills=skills,
        years_of_experience=years_exp,
        education=education,
        previous_roles=roles
    )

    # Log trace step to MongoDB
    log_trace(trace_id=trace_id, step="resume_parsed", data={
        "member_id":          request.member_id,
        "skills_found":       skills,
        "years_of_experience": years_exp,
        "education_entries":  len(education),
        "roles_found":        len(roles)
    })

    return result