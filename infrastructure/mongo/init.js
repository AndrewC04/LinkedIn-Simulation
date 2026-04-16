// LinkedIn Simulation – MongoDB Init (Surya)
// Database: linkedin_events  
// Run: mongosh < init.js
//   or: docker exec -i mongodb mongosh < init.js

db = db.getSiblingDB('linkedin_events');

// 1. EVENTS / ANALYTICS LOG  (all Kafka events land here)
db.createCollection('events');
db.events.createIndex({ event_type: 1, timestamp: -1 });
db.events.createIndex({ actor_id: 1, timestamp: -1 });
db.events.createIndex({ "entity.entity_id": 1 });
db.events.createIndex({ trace_id: 1 });
db.events.createIndex({ idempotency_key: 1 }, { unique: true });
// TTL – auto-delete raw events after 90 days
db.events.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Sample document (matches Kafka envelope):
// {
//   event_type: "job.viewed",
//   trace_id: "uuid",
//   timestamp: ISODate,
//   actor_id: "member_123",
//   entity: { entity_type: "job", entity_id: "job_456" },
//   payload: { referrer: "search" },
//   idempotency_key: "uuid"
// }

// 2. THREADS  (conversation metadata)
db.createCollection('threads');
db.threads.createIndex({ participants: 1 });
db.threads.createIndex({ last_message_at: -1 });

// Sample document:
// {
//   thread_id: "uuid",
//   participants: ["member_id_1", "member_id_2"],
//   created_at: ISODate,
//   last_message_at: ISODate,
//   last_message_preview: "Sure, let's connect!"
// }

// 3. MESSAGES  (chat messages inside threads)
db.createCollection('messages');
db.messages.createIndex({ thread_id: 1, sent_at: 1 });
db.messages.createIndex({ sender_id: 1 });

// Sample document:
// {
//   message_id: "uuid",
//   thread_id: "uuid",
//   sender_id: "member_id",
//   receiver_id: "member_id",
//   message_text: "Hello!",
//   sent_at: ISODate,
//   read: false
// }

// 4. AGENT TRACES  (per-step AI workflow results)
db.createCollection('agent_traces');
db.agent_traces.createIndex({ trace_id: 1 });
db.agent_traces.createIndex({ task_id: 1 });
db.agent_traces.createIndex({ status: 1, created_at: -1 });

// Sample document:
// {
//   trace_id: "uuid",        // shared across entire workflow
//   task_id: "uuid",         // unique per AI task request
//   step: "resume_parse",
//   status: "completed",     // pending | running | completed | failed
//   input: { member_id: "...", resume_text: "..." },
//   output: { skills: [...], experience_years: 5 },
//   started_at: ISODate,
//   completed_at: ISODate,
//   error: null
// }

// 5. AGENT TASKS  (top-level AI task status for UI / P8)
db.createCollection('agent_tasks');
db.agent_tasks.createIndex({ task_id: 1 }, { unique: true });
db.agent_tasks.createIndex({ recruiter_id: 1, created_at: -1 });
db.agent_tasks.createIndex({ status: 1 });

// Sample document:
// {
//   task_id: "uuid",
//   trace_id: "uuid",
//   recruiter_id: "recruiter_123",
//   job_id: "job_456",
//   task_type: "shortlist_candidates",
//   status: "completed",     // pending | running | completed | failed
//   steps_completed: ["resume_parse", "match_score", "outreach_draft"],
//   result: { shortlisted: [...], outreach_drafts: [...] },
//   created_at: ISODate,
//   updated_at: ISODate
// }

print('MongoDB linkedin_events initialized – 5 collections + indexes');
