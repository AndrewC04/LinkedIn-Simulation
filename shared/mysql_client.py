"""
shared/mysql_client.py – MySQL / SQLAlchemy session helper (Surya P2)

Usage:
    from shared.mysql_client import get_db

    with get_db() as db:
        result = db.execute(text("SELECT * FROM members LIMIT 10"))
"""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from shared.service_config import MySQLConfig

engine = create_engine(
    MySQLConfig.url(),
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@contextmanager
def get_db():
    """Yield a SQLAlchemy session; auto-commit on success, rollback on error."""
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_dependency():
    """FastAPI dependency version (use with Depends)."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
