# main.py — FastAPI app entry point

from fastapi import FastAPI
from contextlib import asynccontextmanager
from routers import tasks, websocket
from messaging.consumer import consume_requests
from agents.supervisor import run_supervisor
from dotenv import load_dotenv
import threading
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)


def kafka_handler(message: dict):
    """Receives a Kafka message from ai.requests and runs the supervisor pipeline."""
    try:
        logger.info(f"[kafka_handler] Received task: {message.get('task_id')}")
        run_supervisor(message)
    except Exception as e:
        logger.error(f"[kafka_handler] Failed to process message: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Kafka consumer in a background daemon thread
    consumer_thread = threading.Thread(
        target=consume_requests,
        args=(kafka_handler,),
        daemon=True,
        name="kafka-consumer-thread"
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
    lifespan=lifespan
)

# Register routers
app.include_router(tasks.router,     prefix="/ai", tags=["AI Tasks"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service", "port": 8006}
