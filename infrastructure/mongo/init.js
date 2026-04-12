// MongoDB init — creates collections with indexes
// linkedin_events database is for logs, messages, agent traces

db = db.getSiblingDB('linkedin_events');

// Events/analytics log — high write volume
db.createCollection('events');
db.events.createIndex({ event_type: 1, timestamp: -1 });
db.events.createIndex({ actor_id: 1, timestamp: -1 });
db.events.createIndex({ "entity.entity_id": 1 });
db.events.createIndex({ trace_id: 1 });
db.events.createIndex({ idempotency_key: 1 }, { unique: true });

// Message threads
db.createCollection('threads');
db.threads.createIndex({ participants: 1 });
db.threads.createIndex({ last_message_at: -1 });

// Messages within threads
db.createCollection('messages');
db.messages.createIndex({ thread_id: 1, sent_at: 1 });
db.messages.createIndex({ sender_id: 1 });

// AI agent task traces
db.createCollection('agent_traces');
db.agent_traces.createIndex({ trace_id: 1 }, { unique: true });
db.agent_traces.createIndex({ status: 1, created_at: -1 });

print('MongoDB collections and indexes created.');