const AUTH_API = "http://localhost:8005";
const APPLICATIONS_API = "http://localhost:8005";
const JOBS_API = "http://localhost:8010";

const SESSION_KEY = "linkedin_sim_auth_session";

/* ---------------------------
   Session helpers
---------------------------- */

function getStoredSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function authHeaders(extra = {}) {
  const session = getStoredSession();

  return {
    ...(session?.token
      ? { Authorization: `Bearer ${session.token}` }
      : {}),
    ...extra,
  };
}

/* ---------------------------
   Error handling
---------------------------- */

function extractErrorMessage(data, status) {
  if (!data) return `Request failed: ${status}`;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item?.msg || "Invalid request").join(", ");
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  return `Request failed: ${status}`;
}

/* ---------------------------
   Core POST helper
---------------------------- */

async function postJson(baseUrl, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
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

/* ---------------------------
   APPLICATIONS
---------------------------- */

export async function applicationsByMember(
  memberId,
  page = 1,
  pageSize = 25
) {
  return postJson(APPLICATIONS_API, "/applications/byMember", {
    member_id: memberId,
    page,
    page_size: pageSize,
  });
}

export async function applicationGet(applicationId) {
  return postJson(APPLICATIONS_API, "/applications/get", {
    application_id: applicationId,
  });
}

export async function applicationsByJob(
  jobId,
  statusFilter = null,
  page = 1,
  pageSize = 25
) {
  return postJson(APPLICATIONS_API, "/applications/byJob", {
    job_id: jobId,
    status_filter: statusFilter,
    page,
    page_size: pageSize,
  });
}

export async function applicationUpdateStatus(
  applicationId,
  status,
  reason = ""
) {
  return postJson(APPLICATIONS_API, "/applications/updateStatus", {
    application_id: applicationId,
    status,
    reason,
  });
}

export async function applicationAddNote(
  applicationId,
  recruiterId,
  note
) {
  return postJson(APPLICATIONS_API, "/applications/addNote", {
    application_id: applicationId,
    recruiter_id: recruiterId,
    note,
  });
}

/* ---------------------------
   JOBS (Recruiter)
---------------------------- */

export async function recruiterJobs(
  recruiterId,
  statusFilter = null,
  page = 1,
  pageSize = 20
) {
  return postJson(JOBS_API, "/jobs/byRecruiter", {
    recruiter_id: recruiterId,
    status_filter: statusFilter,
    pagination: {
      page,
      page_size: pageSize,
    },
  });
}