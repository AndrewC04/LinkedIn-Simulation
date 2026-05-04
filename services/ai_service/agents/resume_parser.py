# agents/resume_parser.py — Resume Parser skill (LLM-powered)

import json
import os
from openai import OpenAI
from models.schemas import ResumeParserRequest, ParsedResume
from db.mongo import log_trace

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_resume(request: ResumeParserRequest, trace_id: str) -> ParsedResume:
    """
    Parse raw resume text using GPT-4o-mini for structured extraction.
    Falls back to keyword matching if OpenAI is unavailable.
    """
    text = request.resume_text

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[{
                "role": "system",
                "content": "You are a resume parser. Extract structured data from resumes and return only valid JSON."
            }, {
                "role": "user",
                "content": f"""Parse this resume and return JSON with these exact keys:
- skills: list of technical skills (normalize to lowercase, expand abbreviations e.g. "ML" → "machine learning")
- years_of_experience: float (calculate from date ranges, 0.0 if unclear)
- education: list of strings (degree + institution)
- previous_roles: list of strings (job title + company)

Resume:
{text}"""
            }]
        )

        parsed = json.loads(response.choices[0].message.content)

        result = ParsedResume(
            member_id=request.member_id,
            skills=parsed.get("skills", []),
            years_of_experience=float(parsed.get("years_of_experience", 0.0)),
            education=parsed.get("education", []),
            previous_roles=parsed.get("previous_roles", [])
        )

    except Exception as e:
        # Fallback to basic keyword extraction if OpenAI fails
        log_trace(trace_id, "resume_parser_fallback", {"error": str(e)})
        result = _fallback_parse(request)

    log_trace(trace_id=trace_id, step="resume_parsed", data={
        "member_id":           request.member_id,
        "skills_found":        result.skills,
        "years_of_experience": result.years_of_experience,
        "education_entries":   len(result.education),
        "roles_found":         len(result.previous_roles)
    })

    return result


def _fallback_parse(request: ResumeParserRequest) -> ParsedResume:
    """Basic keyword fallback if LLM is unavailable."""
    import re
    KNOWN_SKILLS = [
        "python", "java", "javascript", "typescript", "go", "rust", "scala",
        "sql", "bash", "fastapi", "django", "flask", "react", "kafka", "spark",
        "pytorch", "tensorflow", "scikit-learn", "docker", "kubernetes", "aws",
        "gcp", "azure", "mongodb", "postgresql", "redis", "machine learning",
        "deep learning", "nlp", "microservices"
    ]
    text = request.resume_text
    text_lower = text.lower()
    skills = [s for s in KNOWN_SKILLS if s in text_lower]
    years = [int(y) for y in re.findall(r'\b(19|20)\d{2}\b', text)]
    yoe = float(max(years) - min(years)) if len(years) >= 2 else 0.0

    return ParsedResume(
        member_id=request.member_id,
        skills=skills,
        years_of_experience=yoe,
        education=[],
        previous_roles=[]
    )