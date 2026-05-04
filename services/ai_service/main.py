# main.py — FastAPI app entry point

from fastapi import FastAPI
from contextlib import asynccontextmanager
from routers import tasks, websocket
from messaging.consumer import consume_requests
from agents.supervisor import run_supervisor
from dotenv import load_dotenv
from db.mongo import init_indexes
import threading
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)


def kafka_handler(message: dict):
    """Receives a Kafka message from ai.requests and runs the supervisor pipeline."""
    import asyncio
    try:
        payload = message.get("payload", message)
        task_id = payload.get("task_id")
        trace_id = payload.get("trace_id")
        job_id = payload.get("job_id")
        candidate_ids = payload.get("candidate_ids", [])
        resumes = payload.get("resumes", {})

        logger.info(f"[kafka_handler] Received task: {task_id}")
        asyncio.run(run_supervisor(task_id, trace_id, job_id, candidate_ids, resumes))
    except Exception as e:
        logger.error(f"[kafka_handler] Failed to process message: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Kafka consumer in a background daemon thread
    init_indexes()
    consumer_thread = threading.Thread(
        target=consume_requests,
        args=(kafka_handler,),
        daemon=True,
        name="kafka-consumer-thread",
    )
    consumer_thread.start()
    logger.info("Kafka consumer thread started.")

    print("AI Service starting up...")
    yield
    print("AI Service shutting down...")


app = FastAPI(
    title="LinkedIn AI Service",
    description="Agentic AI recruiter copilot — Resume Parser, Job Matcher, Hiring Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# Register routers
app.include_router(tasks.router, prefix="/ai", tags=["AI Tasks"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service", "port": 8006}
