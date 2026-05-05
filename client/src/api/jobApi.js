const JOBS_API = "http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com:8002";

function extractErrorMessage(data, status) {
  if (!data) return `Request failed: ${status}`;

  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item?.msg || "Invalid request").join(", ");
  }

  if (typeof data.message === "string") return data.message;

  return `Request failed: ${status}`;
}

async function postJson(path, body) {
  const res = await fetch(`${JOBS_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

export async function searchJobs(filters = {}, page = 1, pageSize = 20) {
  return postJson("/jobs/search", {
    filters,
    pagination: {
      page,
      page_size: pageSize,
    },
  });
}

export async function getJob(jobId, actorId = "mem_0001") {
  return postJson("/jobs/get", {
    job_id: jobId,
    actor_id: actorId,
  });
}

export async function createJob(payload) {
  return postJson("/jobs/create", payload);
}

export async function updateJob(jobId, fields) {
  return postJson("/jobs/update", {
    job_id: jobId,
    fields,
  });
}

export async function closeJob(jobId, recruiterId, reason) {
  return postJson("/jobs/close", {
    job_id: jobId,
    recruiter_id: recruiterId,
    reason,
  });
}

export async function jobsByRecruiter(recruiterId, statusFilter = "open", page = 1, pageSize = 20) {
  return postJson("/jobs/byRecruiter", {
    recruiter_id: recruiterId,
    status_filter: statusFilter,
    pagination: {
      page,
      page_size: pageSize,
    },
  });
}