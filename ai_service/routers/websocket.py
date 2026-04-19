# routers/websocket.py — WebSocket endpoint for real-time UI streaming

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from db.mongo import get_task
import asyncio
import json

router = APIRouter()

# In-memory store of active connections: task_id → list of WebSockets
active_connections: dict[str, list[WebSocket]] = {}


def register_connection(task_id: str, websocket: WebSocket):
    if task_id not in active_connections:
        active_connections[task_id] = []
    active_connections[task_id].append(websocket)


def remove_connection(task_id: str, websocket: WebSocket):
    if task_id in active_connections:
        active_connections[task_id].remove(websocket)
        if not active_connections[task_id]:
            del active_connections[task_id]


async def broadcast(task_id: str, message: dict):
    """Send a message to all clients watching a task."""
    if task_id in active_connections:
        dead = []
        for ws in active_connections[task_id]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            remove_connection(task_id, ws)


# ── WS /ws/task/{task_id} ─────────────────────────────────────────────────────

@router.websocket("/task/{task_id}")
async def task_progress(websocket: WebSocket, task_id: str):
    """
    Client connects here to receive real-time updates for a task.
    Polls MongoDB every second and pushes status changes to the UI.
    """
    await websocket.accept()
    register_connection(task_id, websocket)

    last_status = None
    last_steps  = []

    try:
        while True:
            task = get_task(task_id)

            if not task:
                await websocket.send_text(json.dumps({
                    "event": "error",
                    "message": f"Task {task_id} not found"
                }))
                break

            current_status = task["status"]
            current_steps  = task["steps_completed"]

            # Send update only when something changed
            if current_status != last_status or current_steps != last_steps:
                await websocket.send_text(json.dumps({
                    "event":           "task_update",
                    "task_id":         task_id,
                    "status":          current_status,
                    "steps_completed": current_steps,
                    "result":          task.get("result"),
                    "updated_at":      task["updated_at"]
                }))
                last_status = current_status
                last_steps  = current_steps

            # Stop polling once task reaches a terminal state
            if current_status in ("completed", "failed") or current_status.startswith("approved:"):
                await websocket.send_text(json.dumps({
                    "event":   "task_done",
                    "task_id": task_id,
                    "status":  current_status,
                    "result":  task.get("result")
                }))
                break

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass
    finally:
        remove_connection(task_id, websocket)
        try:
            await websocket.close()
        except Exception:
            pass