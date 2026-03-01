// src/api/hotelApplicantsApi.js
import { lsGet } from "../utils/storage";

const API_BASE = "https://hhs-backend-1fmx.onrender.com";

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

function getHotelIdFromLocalStorage() {
  const uid = lsGet("uid", null);
  if (!uid) throw new Error("Hotel owner not logged in.");
  return uid;
}

// Matches Flutter: /hotel/active-jobs-summary?hotel_id=...&page=...&limit=...&include_expired=...&department=...&location=... [file:84]
export async function fetchActiveJobsSummary({
  page,
  limit,
  includeExpired,
  department,
  location,
}) {
  const hotelId = getHotelIdFromLocalStorage();

  const qp = new URLSearchParams();
  qp.set("hotel_id", String(hotelId));
  qp.set("page", String(page));
  qp.set("limit", String(limit));
  qp.set("include_expired", String(!!includeExpired));

  if (department && department.trim()) qp.set("department", department.trim());
  if (location && location.trim()) qp.set("location", location.trim());

  const url = `${API_BASE}/hotel/active-jobs-summary?${qp.toString()}`;
  const json = await request(url, { method: "GET" });

  if (json?.success !== true) {
    throw new Error(json?.message || "Request failed.");
  }

  return {
    hasMore: json?.has_more === true,
    totalApplicants: Number(json?.total_applicants ?? 0) || 0,
    totalAccepted: Number(json?.total_accepted ?? 0) || 0,
    totalPendingOrRejected: Number(json?.total_pending_or_rejected ?? 0) || 0,
    jobs: Array.isArray(json?.jobs) ? json.jobs : [],
  };
}

// These endpoints appear in your Dart page in paste.txt (same backend host). [file:84]
export async function fetchJobApplicants({ hotelOwnerId, jobId }) {
  // NOTE: In your paste, query param names are shown concatenated; if your backend expects
  // hotel_owner_id/job_id instead of hotelownerid/jobid, tell me and I’ll switch to exact. [file:84]
  const qp = new URLSearchParams();
  qp.set("hotel_owner_id", String(hotelOwnerId));
  qp.set("job_id", String(jobId));

  const url = `${API_BASE}/hotel/job-applicants?${qp.toString()}`;
  const json = await request(url, { method: "GET" });

  // Dart treats response.body as { data: [...] } (from snippet) or a list; we handle both. [file:84]
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;

  return [];
}

export async function updateApplicationStatus({
  hotelOwnerId,
  jobId,
  userId,
  status,
}) {
  const url = `${API_BASE}/hotel/job-applicants/application-status`;

  // Matches your Dart payload keys shown in paste snippet. [file:84]
  const payload = {
    hotel_owner_id: String(hotelOwnerId),
    job_id: String(jobId),
    user_id: String(userId),
    status: String(status),
  };

  return request(url, { method: "POST", body: JSON.stringify(payload) });
}

export async function bulkUpdateApplicationStatus({
  hotelOwnerId,
  jobId,
  updates, // [{ userid, status }]
}) {
  const url = `${API_BASE}/hotel/job-applicants/application-status`;

  const payload = {
    hotelownerid: String(hotelOwnerId),
    jobid: String(jobId),
    updates: updates.map((u) => ({
      userid: String(u.userid),
      status: String(u.status),
    })),
  };

  return request(url, { method: "POST", body: JSON.stringify(payload) });
}
