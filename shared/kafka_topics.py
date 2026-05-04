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
    JOB_CREATED             = "job.created"
    JOB_UPDATED             = "job.updated"
    JOB_CLOSED              = "job.closed"

    # Application events (produced by Application Service)
    APPLICATION_SUBMITTED   = "application.submitted"
    APPLICATION_STATUS      = "application.status.updated"

    # Messaging (produced by Messaging Service)
    MESSAGE_SENT            = "message.sent"

    # Connections (produced by Connections Service)
    CONNECTION_REQUESTED    = "connection.requested"
    CONNECTION_ACCEPTED     = "connection.accepted"
    CONNECTION_REJECTED     = "connection.rejected"
    PROFILE_VIEWED          = "profile.viewed"

    # AI orchestration (produced by FastAPI AI Service / Hiring Agent)
    AI_REQUESTS             = "ai.requests"
    AI_RESULTS              = "ai.results"

    # Analytics ingestion (catch-all)
    ANALYTICS_EVENTS        = "analytics.events"
