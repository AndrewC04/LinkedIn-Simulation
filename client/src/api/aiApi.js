const AI_BASE = "http://ae75bd49118534be2a684f0f71f0564c-fd714fd6cdd0db22.elb.us-east-2.amazonaws.com:8006";

export async function submitAITask({ job_id, recruiter_id, candidate_ids, resumes, trace_id }) {
  const res = await fetch(`${AI_BASE}/ai/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id, recruiter_id, candidate_ids, resumes, trace_id }),
  });
  if (!res.ok) throw new Error("Failed to submit AI task");
  return res.json();
}

export async function getTaskStatus(task_id) {
  const res = await fetch(`${AI_BASE}/ai/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
  if (!res.ok) throw new Error("Failed to get task status");
  return res.json();
}

export async function approveTask({ task_id, recruiter_id, action, edited_output }) {
  const res = await fetch(`${AI_BASE}/ai/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id, recruiter_id, action, edited_output }),
  });
  if (!res.ok) throw new Error("Failed to submit approval");
  return res.json();
}