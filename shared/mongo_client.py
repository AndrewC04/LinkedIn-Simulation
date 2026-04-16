"""
shared/mongo_client.py – MongoDB connection helper (Surya)

Usage:
    from shared.mongo_client import get_mongo_db

    db = get_mongo_db()
    db.events.insert_one({...})
"""

from pymongo import MongoClient
from shared.service_config import MongoConfig

_client = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MongoConfig.uri(), maxPoolSize=20)
    return _client


def get_mongo_db():
    """Return the linkedin_events database handle."""
    return get_mongo_client()[MongoConfig.DATABASE]
