from fastapi import FastAPI
from contextlib import asynccontextmanager
from db import init_indexes
from consumer import start_consumer_thread
from routers.events import router as events_router
from routers.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[main] Initializing MongoDB indexes...")
    init_indexes()
    print("[main] Starting Kafka consumer thread...")
    start_consumer_thread()
    yield
    # Shutdown
    print("[main] Analytics service shutting down.")


app = FastAPI(
    title="Analytics Service",
    description="Kafka event ingestion and analytics dashboards for LinkedIn Simulation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(events_router)
app.include_router(analytics_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics-service"}