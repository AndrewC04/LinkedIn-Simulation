# LinkedIn Simulation - Group 10

Distributed Systems class project. LinkedIn-like platform with microservices, Kafka event streaming, and an Agentic AI layer.

## Team

* Andrew (P1) | System Architect + Integration Lead
* Surya (P2) | Database + Data Modeling
* Raniel (P3) | Profile Service
* Keon (P4) | Job Service
* Rish (P5) | Application Service
* Timmy (P6) | Messaging + Connections Service
* Nishu (P7) | Kafka + Analytics
* Saketh (P8) | Agentic AI + FastAPI

## Quick Start (everyone runs this)

```bash
# 1. Clone
git clone <repo-url>
cd linkedin-sim

# 2. Start all infrastructure (MySQL, MongoDB, Redis, Kafka, Zookeeper)
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Verify everything is running
docker compose -f infrastructure/docker-compose.yml ps

# 4. Seed the databases with 10k+ realistic test data (one-time)
pip install faker pymysql pymongo sqlalchemy --break-system-packages
python scripts/seed_data.py

# 5. Start your service (example: job service)
cd services/job-service
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

Each Python service has its own `requirements.txt` in its service folder. Install dependencies from the service you are running, not from the repo root.

### Re-seeding / starting fresh

The MySQL `init.sql` and MongoDB `init.js` scripts only run on **first** container creation. If you change the schema, wipe the volumes:

```bash
docker compose -f infrastructure/docker-compose.yml down -v
docker compose -f infrastructure/docker-compose.yml up -d
python scripts/seed_data.py
```

## Key Docs

* `docs/kafka-topics.md` — topic list, producers, consumers
* `docs/service-ports.md` — port assignments
* `docs/DATABASE_DESIGN.md` — MySQL vs MongoDB split, indexing strategy, Redis caching policy (P2)
* `docs/schema_diagram.png` — MySQL ERD with FK relationships (P2)
* `docs/architecture_diagram.png` — full system architecture (P1)

## Shared Modules — import these, don't rewrite

| Module | Purpose | Owner |
|---|---|---|
| `shared/kafka_envelope.py` | Build canonical Kafka event envelopes | P1 |
| `shared/kafka_topics.py` | Topic name constants | P1 |
| `shared/service_config.py` | DB / Redis / Kafka connection strings | P1 |
| `shared/mysql_client.py` | SQLAlchemy session + connection pool | P2 |
| `shared/mongo_client.py` | PyMongo client + `linkedin_events` DB handle | P2 |
| `shared/redis_cache.py` | `cache_get` / `cache_set` / `cache_delete` + key naming | P2 |

### Database access — examples

**MySQL** (Profile, Job, Application, Connections services):
```python
from sqlalchemy import text
from shared.mysql_client import get_db

with get_db() as db:
    result = db.execute(text("SELECT * FROM members WHERE member_id = :id"),
                        {"id": member_id}).fetchone()
```

**MongoDB** (Messaging, Analytics, AI services):
```python
from shared.mongo_client import get_mongo_db

mdb = get_mongo_db()
mdb.events.insert_one(event_envelope)
```

**Redis cache** (any service that reads hot data):
```python
from shared.redis_cache import cache_get, cache_set, cache_delete, job_key

# Read-through pattern
cached = cache_get(job_key(job_id))
if cached:
    return cached

job = fetch_from_mysql(job_id)
cache_set(job_key(job_id), job, ttl_seconds=300)
return job

# Write-invalidate on update
cache_delete(job_key(job_id))
```

See `docs/DATABASE_DESIGN.md` for the full caching policy (what to cache, what NOT to cache, TTL guidance).

## Database Overview

* **MySQL** (`linkedin_db` on `:3306`) — transactional entities: members, recruiters, jobs, applications, connections, saved_jobs, application_notes, member_experience, member_education, profile_views_daily, processed_events
* **MongoDB** (`linkedin_events` on `:27017`) — append-heavy / unstructured: events, threads, messages, agent_tasks, agent_traces
* **Redis** (`:6379`) — read-through cache for jobs and member profiles

Schema is created automatically on first `docker compose up` via `infrastructure/mysql/init.sql` and `infrastructure/mongo/init.js`.

## Service Dependencies

When the service code is added, keep each `requirements.txt` aligned with that service's imports. The starter files currently cover the repo's expected stack:

* FastAPI + Uvicorn for HTTP services
* SQLAlchemy + PyMySQL for MySQL-backed services
* `pymongo` for MongoDB-backed services
* `redis` for cache/session access
* `confluent-kafka` for event producers/consumers
* `httpx` for outbound HTTP calls where needed

`scripts/seed_data.py` additionally needs `faker`.
