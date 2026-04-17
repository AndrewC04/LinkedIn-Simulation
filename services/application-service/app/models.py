from datetime import datetime
from sqlalchemy import DateTime, Index, Text, UniqueConstraint
from sqlalchemy.dialects.mysql import ENUM, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "member_id", name="uq_app_job_member"),
        Index("idx_app_member", "member_id"),
        Index("idx_app_status", "status"),
        Index("idx_app_submitted", "submitted_at"),
    )

    application_id: Mapped[str] = mapped_column(VARCHAR(36), primary_key=True)
    job_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    member_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    resume_url: Mapped[str | None] = mapped_column(VARCHAR(500), nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        ENUM("submitted", "reviewing", "interview", "offer", "rejected"),
        nullable=False,
        default="submitted",
    )
    idempotency_key: Mapped[str | None] = mapped_column(VARCHAR(255), unique=True, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class ApplicationNote(Base):
    __tablename__ = "application_notes"
    __table_args__ = (
        Index("idx_note_app", "application_id"),
    )

    note_id: Mapped[str] = mapped_column(VARCHAR(36), primary_key=True)
    application_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    recruiter_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)