#!/bin/bash
# Wait for Kafka to be genuinely ready, not just sleeping
echo "Waiting for Kafka to be ready..."
RETRIES=30
while ! kafka-topics --bootstrap-server kafka:9092 --list > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "ERROR: Kafka not ready after 60 seconds. Exiting."
    exit 1
  fi
  echo "Kafka not ready yet, retrying in 2s... ($RETRIES retries left)"
  sleep 2
done
echo "Kafka is ready."

KAFKA_BIN=kafka-topics
BOOTSTRAP=kafka:9092

create_topic() {
  $KAFKA_BIN --create \
    --bootstrap-server $BOOTSTRAP \
    --topic $1 \
    --partitions 3 \
    --replication-factor 1 \
    --if-not-exists
  echo "Created topic: $1"
}

# ── Job events (produced by job-service) ──
create_topic "job.viewed"
create_topic "job.saved"
create_topic "job.applied"
create_topic "job.created"
create_topic "job.updated"
create_topic "job.closed"

# ── Application events (produced by application-service) ──
create_topic "application.submitted"
create_topic "application.status.updated"

# ── Messaging events (produced by messaging-service) ──
create_topic "message.sent"

# ── Connection events (produced by connection-service) ──
create_topic "connection.requested"
create_topic "connection.accepted"
create_topic "connection.rejected"

# ── AI orchestration (produced by ai-service) ──
create_topic "ai.requests"
create_topic "ai.results"

# ── Analytics ingestion (catch-all) ──
create_topic "analytics.events"

echo "All topics created successfully."
