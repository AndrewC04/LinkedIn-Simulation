const MESSAGING_API = "http://localhost:8004";

function extractErrorMessage(data, status) {
  if (!data) return `Request failed: ${status}`;

  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item?.msg || "Invalid request").join(", ");
  }

  if (typeof data.message === "string") return data.message;

  return `Request failed: ${status}`;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${MESSAGING_API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, res.status));
  }

  return data;
}

export function listThreads(memberId, limit = 20) {
  return request(`/threads?member_id=${encodeURIComponent(memberId)}&limit=${limit}`);
}

export function listThreadMessages(threadId, limit = 50) {
  return request(`/threads/${threadId}/messages?limit=${limit}`);
}

export function sendThreadMessage(threadId, senderId, text, idempotencyKey = null) {
  return request(`/threads/${threadId}/messages`, {
    method: "POST",
    body: {
      sender_id: senderId,
      text,
      idempotency_key: idempotencyKey,
    },
  });
}

export function markThreadRead(threadId, memberId) {
  return request(`/threads/${threadId}/read`, {
    method: "PATCH",
    body: { member_id: memberId },
  });
}

export function createThread(participantIds) {
  return request(`/threads`, {
    method: "POST",
    body: { participant_ids: participantIds },
  });
}
