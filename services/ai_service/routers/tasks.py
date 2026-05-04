# routers/tasks.py — REST endpoints (submit task, get status, approval)
from human_loop.approval import process_approval
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import (
    AITaskRequest, AITaskResponse,
    TaskStatusRequest, TaskStatusResponse,
    ApprovalRequest, ApprovalResponse
)
from db.mongo import create_task, get_task, update_task_status
from datetime import datetime
import uuid
import logging
from agents.supervisor import run_supervisor
from db.mongo import create_task, get_task, update_task_status, get_all_decisions
from human_loop.approval import process_approval, get_approval_metrics

logger = logging.getLogger(__name__)

router = APIRouter()



# ── POST /ai/submit ───────────────────────────────────────────────────────────


@router.post("/submit", response_model=AITaskResponse)
async def submit_task(request: AITaskRequest, background_tasks: BackgroundTasks):
    """
    Recruiter submits a job + list of candidate IDs.
    Creates a task record in MongoDB and kicks off the agent pipeline
    in the background.
    """
    task_id = str(uuid.uuid4())
    trace_id = request.trace_id

    # Save task to MongoDB
    create_task(
        task_id=task_id,
        trace_id=trace_id,
        job_id=request.job_id,
        recruiter_id=request.recruiter_id
    )

    # Kick off agent pipeline in background
    background_tasks.add_task(run_supervisor, task_id, trace_id, request.job_id, request.candidate_ids)

    # Publish to ai.requests Kafka topic
    try:
        from messaging.producer import publish_event
        publish_event(
            event_type="ai.requested",
            actor_id=request.recruiter_id,
            entity_type="ai_task",
            entity_id=task_id,
            payload={
                "task_id": task_id,
                "trace_id": trace_id,
                "job_id": request.job_id,
                "candidate_ids": request.candidate_ids,
                "resumes": request.resumes or {}
            },
            trace_id=trace_id
        )
    except Exception as e:
        logger.warning(f"Kafka publish failed (non-fatal): {e}")

    return AITaskResponse(
        task_id=task_id,
        trace_id=trace_id,
        status="pending",
        message="AI task submitted successfully. Pipeline starting."
    )



# ── POST /ai/status ───────────────────────────────────────────────────────────


@router.post("/status", response_model=TaskStatusResponse)
async def get_status(request: TaskStatusRequest):
    """
    Poll the status of a running or completed AI task by task_id.
    """
    task = get_task(request.task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskStatusResponse(
        task_id=task["task_id"],
        trace_id=task["trace_id"],
        status=task["status"],
        steps_completed=task["steps_completed"],
        result=task.get("result"),
        created_at=task["created_at"],
        updated_at=task["updated_at"]
    )



# ── POST /ai/approve ──────────────────────────────────────────────────────────

@router.post("/approve", response_model=ApprovalResponse)
async def approve_task(request: ApprovalRequest):
    """
    Recruiter approves, edits, or rejects the AI output.
    Human-in-the-loop checkpoint before any final action is taken.
    """
    try:
        return process_approval(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── GET /ai/metrics ───────────────────────────────────────────────────────────


@router.get("/metrics")
async def get_metrics():
    """
    Returns HITL approval rate metrics across all completed AI tasks.
    """
    decisions = get_all_decisions()
    return get_approval_metrics(decisions)



# ── Background placeholder (supervisor will replace this) ─────────────────────


async def run_pipeline_placeholder(task_id: str, trace_id: str):
    """Temporary placeholder — will be replaced by supervisor agent."""
    import asyncio
    await asyncio.sleep(2)
    update_task_status(
        task_id=task_id,
        status="awaiting_approval",
        step="pipeline_placeholder_complete"
    )