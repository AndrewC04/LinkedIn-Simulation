# Database Design & Justification (Person 2 – Surya)

## 1. MySQL vs MongoDB Split

### MySQL (Transactional / Relational data)
| Table | Why MySQL |
|---|---|
| `members` | Strict uniqueness on email, FK refs from applications/connections. ACID needed for profile updates. |
| `member_experience` | 1:N child of members, needs JOIN for profile rendering. |
| `member_education` | Same reasoning as experience. |
| `recruiters` | Unique email, FK target for jobs/notes. |
| `jobs` | Central entity: referenced by applications, saved_jobs. Status transitions (open→closed) need transactions. FULLTEXT index powers keyword search. |
| `applications` | Unique constraint (job_id, member_id) prevents duplicate apps. Status ENUM with transactional updates for recruiter review flow. Idempotency key for Kafka de-dup. |
| `application_notes` | FK to applications + recruiters. Small structured rows. |
| `connections` | Unique pair constraint, status transitions, FK to members. |
| `saved_jobs` | Unique pair constraint, FK to members + jobs. |
| `profile_views_daily` | Aggregated counter — `ON DUPLICATE KEY UPDATE` for upsert. |
| `processed_events` | Idempotency table for Kafka consumers (fast PK lookup). |

### MongoDB (Unstructured / High-write / Append-heavy)
| Collection | Why MongoDB |
|---|---|
| `messages` | Flexible schema (attachments, reactions in future). High write volume. No complex JOINs needed — queries are by thread_id. |
| `threads` | Array field `participant_ids` maps naturally to document model. |
| `events` | Kafka analytics sink — append-only, schema varies by event_type. TTL index auto-purges old data. High ingestion rate. |
| `agent_traces` | Nested, variable-depth output from AI steps. Document model stores arbitrary JSON output per skill without schema migration. |
| `agent_tasks` | Top-level task status with embedded `steps_completed` array and flexible `result` object. |

**Summary**: MySQL handles entities with strict relationships, uniqueness constraints, and transactional integrity. MongoDB handles high-throughput append logs, flexible/nested documents, and data that doesn't need cross-entity JOINs.

---

## 2. Indexing Strategy

### MySQL Indexes
| Table | Index | Purpose |
|---|---|---|
| `members` | `idx_members_location` (city, state) | Job-seeker search by location |
| `members` | `ft_members_headline_summary` (FULLTEXT) | Keyword search on profiles |
| `members` | `idx_members_email` (email) | Login / duplicate check |
| `jobs` | `ft_jobs_title_desc` (FULLTEXT) | Job keyword search |
| `jobs` | `idx_jobs_status` | Filter open vs closed |
| `jobs` | `idx_jobs_location` | Location filter |
| `jobs` | `idx_jobs_posted` | Sort by recency |
| `jobs` | `idx_jobs_industry` | Industry filter |
| `jobs` | `idx_jobs_recruiter` | "My postings" query |
| `applications` | `uq_app_job_member` (UNIQUE) | Prevent duplicate applications |
| `applications` | `idx_app_member` | "My applications" query |
| `applications` | `idx_app_status` | Status breakdown dashboard |
| `connections` | `uq_connection` (UNIQUE) | Prevent duplicate requests |
| `connections` | `idx_conn_receiver` | "Pending requests for me" |
| `profile_views_daily` | `uq_pv` (member_id, view_date) | Upsert daily counts |

### MongoDB Indexes
| Collection | Index | Purpose |
|---|---|---|
| `events` | `{ event_type, timestamp }` | Analytics queries by type + window |
| `events` | `{ "entity.entity_id" }` | Per-job or per-application event lookup |
| `events` | `{ actor_id, timestamp }` | Per-user activity feed |
| `events` | `{ idempotency_key }` (unique) | Kafka de-dup on write |
| `events` | `{ timestamp }` (TTL 90d) | Auto-cleanup |
| `messages` | `{ thread_id, timestamp }` | Load conversation in order |
| `agent_traces` | `{ trace_id }` | Workflow observability |
| `agent_tasks` | `{ task_id }` (unique) | Task status lookup |

---

## 3. Redis Caching Policy

### What We Cache
| Key Pattern | Data | TTL | Invalidation |
|---|---|---|---|
| `job:{job_id}` | Full job detail JSON | 5 min | On `jobs` UPDATE/CLOSE |
| `member:{member_id}` | Profile JSON (without resume_text) | 5 min | On `members` UPDATE |
| `job_search:{hash}` | Search result IDs (first page) | 2 min | Time-based expiry |
| `recruiter_jobs:{recruiter_id}` | List of job_ids | 3 min | On job CREATE/CLOSE |

### Cache Strategy
- **Read-through**: Service checks Redis first → on miss, query MySQL → write to Redis.
- **Write-invalidate**: On any write (UPDATE, INSERT, DELETE), delete the relevant cache key. Next read repopulates.
- **No cache for**: applications (status changes frequently, must be fresh), connections (low read volume), messages (served from MongoDB, already fast).

### Performance Impact
- B (base) vs B+S (with SQL caching): expect 40-60% latency reduction on job search and profile view endpoints at 100 concurrent threads.
- Measured via Apache JMeter — charts in performance report.

---

## 4. Data Volume Summary

| Entity | Count (1x scale) |
|---|---|
| Members | 10,000 |
| Member experience | ~25,000 |
| Member education | ~15,000 |
| Recruiters | 10,000 |
| Jobs | 10,000 |
| Applications | ~35,000 |
| Connections | ~30,000 |
| Saved jobs | ~20,000 |
| Profile views (daily) | ~30,000 rows |
| Application notes | ~3,000 |
| Threads (Mongo) | ~5,000 |
| Messages (Mongo) | ~25,000 |
| Events (Mongo) | ~50,000 |
| Agent tasks (Mongo) | ~200 |
| Agent traces (Mongo) | ~500 |
