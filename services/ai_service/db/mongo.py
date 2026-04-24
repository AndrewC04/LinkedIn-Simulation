# db/mongo.py — MongoDB connection + trace persistence

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime
from dotenv import load_dotenv
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)

# Build URI from individual env vars to match docker-compose config
_host = os.getenv("MONGO_HOST", "localhost")
_port = os.getenv("MONGO_PORT", "27017")
_user = os.getenv("MONGO_USER", "")
_password = os.getenv("MONGO_PASSWORD", "")
_database = os.getenv("MONGO_DATABASE", os.getenv("MONGO_DB", "linkedin_ai"))

if _user and _password:
    MONGO_URI = f"mongodb://{_user}:{_password}@{_host}:{_port}"
else:
    MONGO_URI = f"mongodb://{_host}:{_port}"

client = MongoClient(MONGO_URI)
db = client[_database]

# Collections owned by this service
tasks_collection = db["ai_tasks"]
traces_collection = db["ai_traces"]


def init_indexes():
    """Create indexes — call this from startup, never at module level."""
    try:
        tasks_collection.create_index("task_id", unique=True)
        tasks_collection.create_index("trace_id")
        traces_collection.create_index("trace_id")
        logger.info("[db] AI service indexes created.")
    except Exception as exc:
        logger.error("Failed to create AI service indexes: %s", exc)


# ── Task Operations ───────────────────────────────────────────────────────────


def create_task(task_id: str, trace_id: str, job_id: str, recruiter_id: str):
    now = datetime.utcnow().isoformat() + "Z"
    doc = {
        "task_id": task_id,
        "trace_id": trace_id,
        "job_id": job_id,
        "recruiter_id": recruiter_id,
        "status": "pending",
        "steps_completed": [],
        "result": None,
        "created_at": now,
        "updated_at": now,
    }
    tasks_collection.insert_one(doc)
    return doc


def get_task(task_id: str):
    return tasks_collection.find_one({"task_id": task_id}, {"_id": 0})


def update_task_status(
    task_id: str, status: str, step: str = None, result: dict = None
):
    now = datetime.utcnow().isoformat() + "Z"
    update = {
        "$set": {
            "status": status,
            "updated_at": now,
        }
    }
    if step:
        update["$push"] = {"steps_completed": step}
    if result:
        update["$set"]["result"] = result
    tasks_collection.update_one({"task_id": task_id}, update)


# ── Trace Operations ──────────────────────────────────────────────────────────


def log_trace(trace_id: str, step: str, data: dict):
    doc = {
        "trace_id": trace_id,
        "step": step,
        "data": data,
        "logged_at": datetime.utcnow().isoformat() + "Z",
    }
    traces_collection.insert_one(doc)


def get_traces(trace_id: str):
    return list(traces_collection.find({"trace_id": trace_id}, {"_id": 0}))
