const PROFILE_API = "http://adfd79d807cdc4e96bb86f461a5bc2d0-4b9c3d7da87e2d61.elb.us-east-2.amazonaws.com:8001";
const AUTH_API = "http://adfd79d807cdc4e96bb86f461a5bc2d0-4b9c3d7da87e2d61.elb.us-east-2.amazonaws.com:8001";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getMemberProfile(memberId, viewerId = null) {
  return postJson(`${PROFILE_API}/members/get`, { member_id: memberId, viewer_id: viewerId });
}

export function updateMemberProfile(memberId, fields) {
  return postJson(`${PROFILE_API}/members/update`, { member_id: memberId, fields });
}

export function searchMembers(filters = {}, page = 1, pageSize = 6) {
  return postJson(`${PROFILE_API}/members/search`, {
    filters,
    pagination: { page, page_size: pageSize },
  });
}

// Experience
export function getExperience(memberId) {
  return postJson(`${PROFILE_API}/members/experience/get`, { member_id: memberId });
}
export function addExperience(data) {
  return postJson(`${PROFILE_API}/members/experience/add`, data);
}
export function deleteExperience(experienceId) {
  return postJson(`${PROFILE_API}/members/experience/delete`, { experience_id: experienceId });
}

// Photo upload
export async function uploadPhoto(memberId, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${PROFILE_API}/members/${memberId}/photo`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadBanner(memberId, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${PROFILE_API}/members/${memberId}/banner`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// Education
export function getEducation(memberId) {
  return postJson(`${PROFILE_API}/members/education/get`, { member_id: memberId });
}
export function addEducation(data) {
  return postJson(`${PROFILE_API}/members/education/add`, data);
}
export function deleteEducation(educationId) {
  return postJson(`${PROFILE_API}/members/education/delete`, { education_id: educationId });
}

export function getRecruiterProfile(recruiterId) {
  return postJson(`${AUTH_API}/auth/recruiters/get`, { recruiter_id: recruiterId });
}

export function searchRecruiters(name = "", limit = 8) {
  return postJson(`${AUTH_API}/auth/recruiters/search`, { name, limit });
}

