"""
shared/kafka_topics.py
Canonical Kafka topic names.
Import these constants instead of hardcoding strings.

Usage:
    from shared.kafka_topics import Topics
    producer.send(Topics.APPLICATION_SUBMITTED, value=envelope)
"""


class Topics:
    # Job events (produced by Job Service, consumed by Analytics)
    JOB_VIEWED              = "job.viewed"
    JOB_SAVED               = "job.saved"
    JOB_APPLIED             = "job.applied"

    # Application events (produced by Application Service)
    APPLICATION_SUBMITTED   = "application.submitted"
    APPLICATION_STATUS      = "application.status.updated"

    # Messaging (produced by Messaging Service)
    MESSAGE_SENT            = "message.sent"

    # Connections (produced by Connections Service)
    CONNECTION_REQUESTED    = "connection.requested"
    CONNECTION_ACCEPTED     = "connection.accepted"

    # AI orchestration (produced by FastAPI AI Service / Hiring Agent)
    AI_REQUESTS             = "ai.requests"
    AI_RESULTS              = "ai.results"

    # Analytics ingestion (consumed by Analytics Service)
    ANALYTICS_EVENTS        = "analytics.events"