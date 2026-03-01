// src/api/applicantProfileApi.js
const API_BASE = "https://hhs-backend-1fmx.onrender.com";

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok)
    throw new Error(
      json?.message || json?.error || text || `HTTP ${res.status}`,
    );
  return json;
}

export async function fetchApplicantProfile(userId) {
  const url = `${API_BASE}/jobseeker/getprofile?user_id=${encodeURIComponent(String(userId))}`;
  const json = await request(url, { method: "GET" });
  return json?.data || {};
}

export async function shareJobseekerViaEmail(payload) {
  const url = `${API_BASE}/hotel/share-jobseeker-via-email`;
  return request(url, { method: "POST", body: JSON.stringify(payload) });
}
