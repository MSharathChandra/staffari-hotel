// src/api/matchingProfilesApi.js
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

export async function fetchMatchingProfiles({ hotelOwnerId, jobId }) {
  const url = `${API_BASE}/hotel/match-jobseekers-to-job`;
  const payload = { hotel_owner_id: hotelOwnerId, job_id: jobId };

  const decoded = await request(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Flutter expects { data: [...] }
  if (decoded && typeof decoded === "object" && Array.isArray(decoded.data))
    return decoded.data;
  return [];
}
