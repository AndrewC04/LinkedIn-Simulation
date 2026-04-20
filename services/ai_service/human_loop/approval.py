# human_loop/approval.py — Human-in-the-loop approval logic

from models.schemas import ApprovalRequest, ApprovalResponse, SupervisorResult
from db.mongo import get_task, update_task_status, log_trace
from datetime import datetime


# ── Approval Handler ──────────────────────────────────────────────────────────

def process_approval(request: ApprovalRequest) -> ApprovalResponse:
    """
    Processes a recruiter's decision on the AI output.

    Decisions:
    - approved  → accept AI output as-is, mark task completed
    - edited    → recruiter modified the output, save their version
    - rejected  → discard AI output, mark task as rejected
    """
    task = get_task(request.task_id)
    if not task:
        raise ValueError(f"Task {request.task_id} not found")

    if task["status"] != "awaiting_approval":
        raise ValueError(
            f"Task is not awaiting approval. Current status: {task['status']}"
        )

    decided_at = datetime.utcnow().isoformat() + "Z"
    trace_id   = task["trace_id"]

    # ── Approved ──────────────────────────────────────────────────────────────
    if request.decision == "approved":
        finalized = task.get("result")
        update_task_status(
            task_id=request.task_id,
            status="completed",
            step="human_approved",
            result=finalized
        )
        log_trace(trace_id, "human_approved", {
            "task_id":    request.task_id,
            "recruiter_id": request.recruiter_id,
            "decided_at": decided_at
        })

    # ── Edited ────────────────────────────────────────────────────────────────
    elif request.decision == "edited":
        finalized = {"edited_output": request.edited_output}
        update_task_status(
            task_id=request.task_id,
            status="completed",
            step="human_edited",
            result=finalized
        )
        log_trace(trace_id, "human_edited", {
            "task_id":      request.task_id,
            "recruiter_id": request.recruiter_id,
            "edited_output": request.edited_output,
            "decided_at":   decided_at
        })

    # ── Rejected ──────────────────────────────────────────────────────────────
    elif request.decision == "rejected":
        finalized = None
        update_task_status(
            task_id=request.task_id,
            status="rejected",
            step="human_rejected"
        )
        log_trace(trace_id, "human_rejected", {
            "task_id":      request.task_id,
            "recruiter_id": request.recruiter_id,
            "decided_at":   decided_at
        })

    else:
        raise ValueError(f"Invalid decision: {request.decision}. Must be approved, edited, or rejected.")

    return ApprovalResponse(
        task_id=request.task_id,
        decision=request.decision,
        finalized_output=str(finalized) if finalized else None,
        decided_at=decided_at
    )


# ── Metrics Helper ────────────────────────────────────────────────────────────

def get_approval_metrics(decisions: list[str]) -> dict:
    """
    Computes approval rate metrics from a list of decisions.
    Used for evaluation reporting.
    """
    total = len(decisions)
    if total == 0:
        return {"total": 0, "approval_rate": 0.0, "edit_rate": 0.0, "rejection_rate": 0.0}

    approved = decisions.count("approved")
    edited   = decisions.count("edited")
    rejected = decisions.count("rejected")

    return {
        "total":           total,
        "approved":        approved,
        "edited":          edited,
        "rejected":        rejected,
        "approval_rate":   round(approved / total, 3),
        "edit_rate":       round(edited   / total, 3),
        "rejection_rate":  round(rejected / total, 3)
    }