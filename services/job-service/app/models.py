from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func

from app.db import Base

work_mode_enum = Enum("onsite", "remote", "hybrid", name="work_mode_enum")
job_status_enum = Enum("open", "closed", name="job_status_enum")


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(String(64), primary_key=True)
    recruiter_id = Column(String(64), ForeignKey("recruiters.recruiter_id"), nullable=False, index=True)
    company_id = Column(String(64), nullable=False, index=True)

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    seniority_level = Column(String(100), nullable=False)
    employment_type = Column(String(100), nullable=False, index=True)
    location = Column(String(255), nullable=False, index=True)
    work_mode = Column(work_mode_enum, nullable=False, index=True)
    industry = Column(String(255), nullable=False, index=True)

    skills_required = Column(JSON, nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)

    status = Column(job_status_enum, nullable=False, default="open", index=True)
    views_count = Column(Integer, nullable=False, default=0)
    applicants_count = Column(Integer, nullable=False, default=0)

    posted_datetime = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    closed_at = Column(DateTime, nullable=True)


class Recruiter(Base):
    __tablename__ = "recruiters"

    recruiter_id = Column(String(64), primary_key=True)