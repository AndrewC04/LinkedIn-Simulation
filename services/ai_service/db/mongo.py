# db/mongo.py — MongoDB connection + trace persistence

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.getenv("MONGO_DB", "linkedin_ai")

client = MongoClient(MONGO_URI)
db     = client[MONGO_DB]

# Collections owned by this service
tasks_collection  = db["ai_tasks"]
traces_collection = db["ai_traces"]

# ── Indexes ───────────────────────────────────────────────────────────────────
tasks_collection.create_index("task_id", unique=True)
tasks_collection.create_index("trace_id")
traces_collection.create_index("trace_id")


# ── Task Operations ───────────────────────────────────────────────────────────

def create_task(task_id: str, trace_id: str, job_id: str, recruiter_id: str):
    """Insert a new AI task record."""
    now = datetime.utcnow().isoformat() + "Z"
    doc = {
        "task_id":      task_id,
        "trace_id":     trace_id,
        "job_id":       job_id,
        "recruiter_id": recruiter_id,
        "status":       "pending",
        "steps_completed": [],
        "result":       None,
        "created_at":   now,
        "updated_at":   now,
    }
    tasks_collection.insert_one(doc)
    return doc


def get_task(task_id: str):
    """Fetch a task by task_id."""
    return tasks_collection.find_one({"task_id": task_id}, {"_id": 0})


def update_task_status(task_id: str, status: str, step: str = None, result: dict = None):
    """Update task status, optionally append a completed step and store result."""
    now = datetime.utcnow().isoformat() + "Z"
    update = {
        "$set": {
            "status":     status,
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
    """Log a single step in the agent pipeline for observability."""
    doc = {
        "trace_id":  trace_id,
        "step":      step,
        "data":      data,
        "logged_at": datetime.utcnow().isoformat() + "Z",
    }
    traces_collection.insert_one(doc)


def get_traces(trace_id: str):
    """Fetch all trace steps for a given trace_id."""
    return list(traces_collection.find({"trace_id": trace_id}, {"_id": 0}))