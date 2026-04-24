import sys
import os
from dotenv import load_dotenv

# Load .env BEFORE importing shared clients so env vars are available
load_dotenv(override=True)

from pymongo import MongoClient
uri = f"mongodb://localhost:27017"
print("Connecting with URI:", uri)
client = MongoClient(uri)
db = client["analytics"]

# Add shared folder and repo root to path
shared_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'shared'))
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, shared_path)
sys.path.insert(0, repo_root)

from mongo_client import get_mongo_db
from pymongo import ASCENDING, DESCENDING

# Get the shared MongoDB database handle
#db = get_mongo_db()

# Collections
events_col = db["events"]


def init_indexes():
    """Create indexes for fast analytics queries."""
    events_col.create_index(
        [("event_type", ASCENDING), ("timestamp", DESCENDING)]
    )
    events_col.create_index("actor_id")
    events_col.create_index(
        [("entity.entity_type", ASCENDING), ("entity.entity_id", ASCENDING)]
    )
    events_col.create_index("timestamp")
    print("[db] Indexes created.")