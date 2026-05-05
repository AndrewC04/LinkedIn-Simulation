# LinkedIn Simulation - Group 10

Distributed Systems class project. LinkedIn-like platform with microservices, Kafka event streaming, and an Agentic AI layer.

## Team

| Person | Role |
|--------|------|
| Andrew (P1) | System Architect + Integration Lead |
| Surya (P2) | Database + Data Modeling |
| Raniel (P3) | Profile Service |
| Keon (P4) | Job Service |
| Rish (P5) | Application Service |
| Timmy (P6) | Messaging + Connections Service |
| Utkarsh (P7) | Kafka + Analytics |
| Saketh (P8) | Agentic AI + FastAPI |

---

## Live Deployment (AWS EKS)

The system is deployed on **AWS EKS** (`linkedin-simulation`, `us-east-2`). Every push to `integration-local` triggers a GitHub Actions pipeline that builds images, pushes to ECR, and rolls out only the app services — Kafka, Zookeeper, MySQL, MongoDB, and Redis are **not** restarted on deploy.

### Live Service Endpoints

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | `http://a0e551d6d62d8433295ab8492e927b92-8e4ecf4291084a62.elb.us-east-2.amazonaws.com` | 80 |
| **Profile API** | `http://adfd79d807cdc4e96bb86f461a5bc2d0-4b9c3d7da87e2d61.elb.us-east-2.amazonaws.com` | 8001 |
| **Job API** | `http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com` | 8002 |
| **Application API** | `http://aa7329fda3c2240879e987dc91a0e9d8-726efa2d8f64fd49.elb.us-east-2.amazonaws.com` | 8003 |
| **Messaging API** | `http://ad756f07478d4478cb717ae8c9ad9f1e-afc6ae71ca5b65e2.elb.us-east-2.amazonaws.com` | 8004 |
| **Analytics API** | `http://a55cb80cd2cbd486ca4773ae0be96669-49a6f0b64a9c73f6.elb.us-east-2.amazonaws.com` | 8005 |
| **AI API** | `http://ae75bd49118534be2a684f0f71f0564c-fd714fd6cdd0db22.elb.us-east-2.amazonaws.com` | 8006 |
| **Connection API** | `http://a35d09762551d4c84a449e5e8372ef9c-cfb918ea0cf7f007.elb.us-east-2.amazonaws.com` | 8007 |

Each service also exposes a `/docs` endpoint (FastAPI Swagger UI), e.g.:
```
http://adfd79d807cdc4e96bb86f461a5bc2d0-4b9c3d7da87e2d61.elb.us-east-2.amazonaws.com:8001/docs
```

### CI/CD Pipeline

Push to `integration-local` → GitHub Actions automatically:
1. Builds Docker images for all 7 services + frontend (linux/amd64)
2. Pushes images to ECR (`425449348496.dkr.ecr.us-east-2.amazonaws.com/linkedin/`)
3. Restarts only app deployments in the `linkedin` namespace
4. Ensures all Kafka topics exist (idempotent — skips existing topics)

**Infra services that survive every deploy:** `kafka`, `zookeeper`, `mysql`, `mongodb`, `redis`

### Cluster Access (for team members with AWS credentials)

```bash
aws eks update-kubeconfig --region us-east-2 --name linkedin-simulation

# Check pod status
kubectl get pods -n linkedin

# Check a specific service's logs
kubectl logs -n linkedin deployment/analytics-api --tail=100 -f

# Restart a single service manually
kubectl rollout restart deployment/<service-name> -n linkedin
```

### Kafka Topics

Topics are created automatically on deploy. Full list:

```
job.viewed, job.saved, job.applied, job.created, job.updated, job.closed
application.submitted, application.status.updated
message.sent
connection.requested, connection.accepted, connection.rejected
profile.viewed
ai.requests, ai.results
analytics.events
```

To produce/consume manually from inside the cluster:
```bash
KAFKA_POD=$(kubectl get pod -n linkedin -l app=kafka -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n linkedin $KAFKA_POD -- kafka-topics.sh --bootstrap-server kafka-broker:9092 --list
```

---

## Local Development

### Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd LinkedIn-Simulation

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

### Re-seeding / Starting Fresh

The MySQL `init.sql` and MongoDB `init.js` scripts only run on **first** container creation. If you change the schema, wipe the volumes:

```bash
docker compose -f infrastructure/docker-compose.yml down -v
docker compose -f infrastructure/docker-compose.yml up -d
python scripts/seed_data.py
```

---

## Key Docs

- `docs/kafka-topics.md` — topic list, producers, consumers
- `docs/service-ports.md` — port assignments
- `docs/DATABASE_DESIGN.md` — MySQL vs MongoDB split, indexing strategy, Redis caching policy (P2)
- `docs/schema_diagram.png` — MySQL ERD with FK relationships (P2)
- `docs/architecture_diagram.png` — full system architecture (P1)

---

## Shared Modules — import these, don't rewrite

| Module | Purpose | Owner |
|--------|---------|-------|
| `shared/kafka_envelope.py` | Build canonical Kafka event envelopes | P1 |
| `shared/kafka_topics.py` | Topic name constants | P1 |
| `shared/service_config.py` | DB / Redis / Kafka connection strings | P1 |
| `shared/mysql_client.py` | SQLAlchemy session + connection pool | P2 |
| `shared/mongo_client.py` | PyMongo client + `linkedin_events` DB handle | P2 |
| `shared/redis_cache.py` | `cache_get` / `cache_set` / `cache_delete` + key naming | P2 |

### Database Access Examples

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

---

## Database Overview

- **MySQL** (`linkedin_db` on `:3306`) — transactional entities: members, recruiters, jobs, applications, connections, saved_jobs, application_notes, member_experience, member_education, profile_views_daily, processed_events
- **MongoDB** (`linkedin_events` on `:27017`) — append-heavy / unstructured: events, threads, messages, agent_tasks, agent_traces
- **Redis** (`:6379`) — read-through cache for jobs and member profiles

Schema is created automatically on first `docker compose up` via `infrastructure/mysql/init.sql` and `infrastructure/mongo/init.js`.

---

## Service Dependencies

When the service code is added, keep each `requirements.txt` aligned with that service's imports. The starter files currently cover the repo's expected stack:

- FastAPI + Uvicorn for HTTP services
- SQLAlchemy + PyMySQL for MySQL-backed services
- `pymongo` for MongoDB-backed services
- `redis` for cache/session access
- `confluent-kafka` for event producers/consumers
- `httpx` for outbound HTTP calls where needed

`scripts/seed_data.py` additionally needs `faker`.
