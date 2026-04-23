const AUTH_API = "http://localhost:8005";          // login + submit
const APPLICATIONS_API = "http://localhost:8003";  // queries
const JOBS_API = "http://localhost:8002";

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
   JSON POST helper
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
  } catch {}

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, res.status));
  }

  return data;
}

/* ---------------------------
   FORM POST helper (for file upload)
---------------------------- */

async function postForm(baseUrl, path, formData) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: authHeaders(), // ⚠️ no Content-Type
    body: formData,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {}

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
   SUBMIT APPLICATION (FIX 🔥)
---------------------------- */

export async function submitApplication({
  jobId,
  memberId,
  resumeFile,
  coverLetterFile,
}) {
  const formData = new FormData();

  formData.append("job_id", jobId);
  formData.append("member_id", memberId);
  formData.append(
    "idempotency_key",
    `${Date.now()}-${Math.random().toString(36).substring(2)}`
  );

  formData.append("resume_file", resumeFile);

  if (coverLetterFile) {
    formData.append("cover_letter_file", coverLetterFile);
  }

  return postForm(AUTH_API, "/applications/submit", formData);
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