const API_BASE = "http://localhost:8000";

export const session = {
  token: "demo-token",
  memberId: "member-1001",
  recruiterId: "recruiter-2001",
  role: "member", // switch to recruiter to test recruiter pages
};

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${session.token}`,
    ...extra,
  };
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function applicationsByMember(memberId, page = 1, pageSize = 25) {
  return postJson("/applications/byMember", {
    member_id: memberId,
    page,
    page_size: pageSize,
  });
}

export async function applicationGet(applicationId) {
  return postJson("/applications/get", {
    application_id: applicationId,
  });
}

export async function applicationsByJob(jobId, statusFilter = null, page = 1, pageSize = 25) {
  return postJson("/applications/byJob", {
    job_id: jobId,
    status_filter: statusFilter,
    page,
    page_size: pageSize,
  });
}

export async function applicationUpdateStatus(applicationId, status, reason = "") {
  return postJson("/applications/updateStatus", {
    application_id: applicationId,
    status,
    reason,
  });
}

export async function applicationAddNote(applicationId, recruiterId, note) {
  return postJson("/applications/addNote", {
    application_id: applicationId,
    recruiter_id: recruiterId,
    note,
  });
}

export async function recruiterJobs() {
  return [
    { job_id: "job-101", title: "Frontend Engineer", company_name: "LinkedHire" },
    { job_id: "job-102", title: "Backend Engineer", company_name: "LinkedHire" },
    { job_id: "job-103", title: "Product Designer", company_name: "LinkedHire" },
  ];
}