const ANALYTICS_API = "http://127.0.0.1:8005";

async function postJson(path, body) {
  const res = await fetch(`${ANALYTICS_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.detail || `Request failed: ${res.status}`);
  return data;
}

export async function getTopJobs(metric = "applications", windowDays = 30, limit = 10) {
  return postJson("/analytics/jobs/top", { metric, window_days: windowDays, limit });
}

export async function getFunnel(jobId, windowDays = 30) {
  return postJson("/analytics/funnel", { job_id: jobId, window_days: windowDays });
}

export async function getGeo(jobId, windowDays = 30) {
  return postJson("/analytics/geo", { job_id: jobId, window_days: windowDays });
}

export async function getMemberDashboard(memberId) {
  return postJson("/analytics/member/dashboard", { member_id: memberId });
}

export async function getLowTractionJobs(windowDays = 30, limit = 5) {
  return postJson("/analytics/jobs/low-traction", { window_days: windowDays, limit });
}

export async function getClicksPerJob(windowDays = 30, limit = 10) {
  return postJson("/analytics/jobs/clicks", { window_days: windowDays, limit });
}

export async function getSavedJobsPerDay(windowDays = 30) {
  return postJson("/analytics/jobs/saved-per-day", { window_days: windowDays });
}

export async function getProfileViewsPerDay(memberId, windowDays = 30) {
  return postJson("/analytics/member/profile-views-per-day", { member_id: memberId, window_days: windowDays });
}