#!/bin/bash
# Wait for Kafka to be ready
echo "Waiting for Kafka to start..."
sleep 15

KAFKA_BIN=/usr/bin/kafka-topics
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

# Core domain events
create_topic "job.viewed"
create_topic "job.saved"
create_topic "job.applied"
create_topic "application.submitted"
create_topic "application.status.updated"
create_topic "message.sent"
create_topic "connection.requested"
create_topic "connection.accepted"

# AI orchestration topics
create_topic "ai.requests"
create_topic "ai.results"

# Analytics ingestion
create_topic "analytics.events"

echo "All topics created successfully."
