from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import redis
import os

from app.config import settings

engine = create_engine(
    settings.sqlalchemy_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=40,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)

Base = declarative_base()


class _NullRedis:
    def get(self, key): return None
    def setex(self, key, ttl, value): pass
    def delete(self, *keys): pass
    def scan_iter(self, match=None): return iter([])


REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").lower() == "true"

if REDIS_ENABLED:
    redis_client = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=settings.redis_db,
        password=settings.redis_password or None,
        decode_responses=True,
    )
    print("[db] Redis enabled.")
else:
    redis_client = _NullRedis()
    print("[db] Redis disabled.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
