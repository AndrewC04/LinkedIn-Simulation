const CONNECTION_API = "http://localhost:8007";

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
  const res = await fetch(`${CONNECTION_API}${path}`, {
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

export function getConnectionStatus(memberA, memberB) {
  return request(`/connections/status?member_a=${encodeURIComponent(memberA)}&member_b=${encodeURIComponent(memberB)}`);
}

export function requestConnection(requesterId, receiverId) {
  return request("/connections/requests", {
    method: "POST",
    body: {
      requester_id: requesterId,
      receiver_id: receiverId,
    },
  });
}

export function listConnections(memberId, limit = 200, offset = 0) {
  return request(
    `/members/${encodeURIComponent(memberId)}/connections?limit=${limit}&offset=${offset}`
  );
}

export function listPendingReceived(memberId, limit = 200, offset = 0) {
  return request(
    `/members/${encodeURIComponent(memberId)}/connections/pending-received?limit=${limit}&offset=${offset}`
  );
}

export function listPendingSent(memberId, limit = 200, offset = 0) {
  return request(
    `/members/${encodeURIComponent(memberId)}/connections/pending-sent?limit=${limit}&offset=${offset}`
  );
}

export function acceptConnectionRequest(connectionId, actorId) {
  return request(`/connections/${encodeURIComponent(connectionId)}/accept`, {
    method: "POST",
    body: {
      actor_id: actorId,
    },
  });
}

export function rejectConnectionRequest(connectionId, actorId) {
  return request(`/connections/${encodeURIComponent(connectionId)}/reject`, {
    method: "POST",
    body: {
      actor_id: actorId,
    },
  });
}

export function withdrawConnectionRequest(connectionId, requesterId) {
  return request(
    `/connections/${encodeURIComponent(connectionId)}/withdraw?requester_id=${encodeURIComponent(requesterId)}`,
    {
      method: "DELETE",
    }
  );
}

export function getConnectionCount(memberId) {
  return request(`/members/${encodeURIComponent(memberId)}/connections/count`);
}

export function removeConnection(connectionId, actorId) {
  return request(
    `/connections/${encodeURIComponent(connectionId)}?actor_id=${encodeURIComponent(actorId)}`,
    {
      method: "DELETE",
    }
  );
}
