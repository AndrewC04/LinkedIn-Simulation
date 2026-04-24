"""
Profile Service – Main Application (Raniel P3)
FastAPI service for member profile management.
Runs on port 8001.

Usage:
    cd LinkedIn-Simulation (repo root)
    PYTHONPATH=. python3 -m uvicorn services.profile-service.main:app --port 8001 --reload
"""
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from services.profile_service.routers import profiles
from services.profile_service.kafka.producer import init_producer

# Global Kafka producer
kafka_producer = None



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, clean up on shutdown."""
    global kafka_producer
    kafka_producer = init_producer()
    print("✓ Profile Service started. Kafka producer initialized.")
    yield
    if kafka_producer:
        kafka_producer.close()
        print("✓ Kafka producer closed.")


app = FastAPI(
    title="Profile Service",
    version="1.0.0",
    description="Member profile management with Redis caching",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Routes
app.include_router(profiles.router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "profile-service",
        "port": 8001
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)