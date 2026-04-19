# main.py — FastAPI app entry point

from fastapi import FastAPI
from contextlib import asynccontextmanager
from routers import tasks, websocket
from dotenv import load_dotenv
import os

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("AI Service starting up...")
    yield
    print("AI Service shutting down...")

app = FastAPI(
    title="LinkedIn AI Service",
    description="Agentic AI recruiter copilot — Resume Parser, Job Matcher, Hiring Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# Register routers
app.include_router(tasks.router,     prefix="/ai", tags=["AI Tasks"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service", "port": 8006}