"""
services/analytics-service/main.py
Entry point for the Analytics Service.
Runs on port 8005.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db import init_indexes
from consumer import start_consumer_thread
from routers.events import router as events_router
from routers.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[main] Initializing MongoDB indexes...")
    init_indexes()
    print("[main] Starting Kafka consumer thread...")
    start_consumer_thread()
    yield
    print("[main] Analytics service shutting down.")


app = FastAPI(
    title="Analytics Service",
    description="Kafka event ingestion and analytics dashboards for LinkedIn Simulation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(analytics_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics-service"}