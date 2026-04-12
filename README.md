# LinkedIn Simulation - Group 10

Distributed Systems class project. LinkedIn-like platform with microservices,
Kafka event streaming, and an Agentic AI layer.

## Team

Andrew (P1) | System Architect + Integration Lead 
Surya (P2) | Database + Data Modeling 
Raniel (P3) | Profile Service 
Keon (P4) | Job Service 
Rish (P5) | Application Service 
Timmy (P6) | Messaging + Connections Service 
Nishu (P7) | Kafka + Analytics 
Saketh (P8) | Agentic AI + FastAPI 

## Quick Start (everyone runs this)

```bash
# 1. Clone
git clone <repo-url>
cd linkedin-sim

# 2. Start all infrastructure
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Verify everything is running
docker compose -f infrastructure/docker-compose.yml ps

# 4. Start your service (example: job service)
cd services/job-service
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

Each Python service has its own `requirements.txt` in its service folder. Install dependencies from the service you are running, not from the repo root.

## Key Docs

- `docs/kafka-topics.md` — topic list, producers, consumers
- `docs/service-ports.md` — port assignments
- `shared/kafka_envelope.py` — **import this, don't rewrite it**
- `shared/kafka_topics.py` — topic name constants
- `shared/service_config.py` — DB/Redis/Kafka connection strings

## Service Dependencies

When the service code is added, keep each `requirements.txt` aligned with that service's imports. The starter files currently cover the repo's expected stack:

- FastAPI + Uvicorn for HTTP services
- SQLAlchemy + PyMySQL for MySQL-backed services
- `pymongo` for MongoDB-backed services
- `redis` for cache/session access
- `confluent-kafka` for event producers/consumers
- `httpx` for outbound HTTP calls where needed