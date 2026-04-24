import sys
import sys
import os
from dotenv import load_dotenv

load_dotenv(override=True)

import logging
from pymongo import MongoClient, ASCENDING, DESCENDING

logger = logging.getLogger(__name__)

# Add shared folder and repo root to path
shared_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "shared")
)
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, shared_path)
sys.path.insert(0, repo_root)

_host = os.environ.get("MONGO_HOST", "localhost")
_port = os.environ.get("MONGO_PORT", "27017")
_user = os.environ.get("MONGO_USER", "")
_password = os.environ.get("MONGO_PASSWORD", "")
_database = os.environ.get("MONGO_DATABASE", "analytics")

if _user and _password:
    uri = f"mongodb://{_user}:{_password}@{_host}:{_port}"
else:
    uri = f"mongodb://{_host}:{_port}"

print("Connecting with URI:", uri)
client = MongoClient(uri)
db = client[_database]

events_col = db["events"]


def init_indexes():
    """Create indexes for fast analytics queries."""
    try:
        events_col.create_index([("event_type", ASCENDING), ("timestamp", DESCENDING)])
        events_col.create_index("actor_id")
        events_col.create_index(
            [("entity.entity_type", ASCENDING), ("entity.entity_id", ASCENDING)]
        )
        events_col.create_index("timestamp")
        logger.info("[db] Indexes created.")
    except Exception as exc:
        logger.error("Failed to create indexes: %s", exc)
