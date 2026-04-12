# Kafka Topics Reference

All topics use the shared envelope defined in `shared/kafka_envelope.py`.

## Topic List

| Topic | Producer | Consumer(s) | Description |
|---|---|---|---|
| `job.viewed` | Job Service (P4) | Analytics (P7) | Member viewed a job detail page |
| `job.saved` | Job Service (P4) | Analytics (P7) | Member saved a job |
| `job.applied` | Application Service (P5) | Analytics (P7) | Member started an application |
| `application.submitted` | Application Service (P5) | App Worker, Analytics (P7) | Full application submitted |
| `application.status.updated` | Application Service (P5) | Analytics (P7) | Recruiter changed app status |
| `message.sent` | Messaging Service (P6) | Messaging Worker | New message in a thread |
| `connection.requested` | Connections Service (P6) | Connections Worker | Connection request sent |
| `connection.accepted` | Connections Service (P6) | Connections Worker, Analytics | Request accepted |
| `ai.requests` | AI Service (P8) | Hiring Assistant Agent | New AI task requested |
| `ai.results` | Hiring Assistant Agent (P8) | AI Service → UI via WebSocket | AI task completed |
| `analytics.events` | All services | Analytics Service (P7) | Generic analytics ingestion |

## Partitioning

- All topics have **3 partitions** (set in `infrastructure/kafka/topics-init.sh`)
- Partition key convention: use `entity_id` as the Kafka message key so all events for the same entity go to the same partition (ordering guarantee)

## Consumer Groups

| Group ID | Topics Consumed | Owner |
|---|---|---|
| `profile-worker-group` | `analytics.events` (profile events) | P3 |
| `job-worker-group` | `analytics.events` (job events) | P4 |
| `application-worker-group` | `application.submitted`, `application.status.updated` | P5 |
| `messaging-worker-group` | `message.sent` | P6 |
| `connections-worker-group` | `connection.requested`, `connection.accepted` | P6 |
| `analytics-group` | all topics | P7 |
| `ai-agent-group` | `ai.requests` | P8 |

## Idempotency Rule

Every consumer MUST check `idempotency_key` before writing to the DB:

```python
# Before any INSERT, check:
existing = db.query("SELECT 1 FROM processed_events WHERE idempotency_key = %s", key)
if existing:
    return  # already processed, skip
```