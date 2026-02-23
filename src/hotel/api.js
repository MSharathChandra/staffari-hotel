// src/hotel/api.js
const API_BASE = "https://hhs-backend.onrender.com";
const CHAT_BASE = "https://hhs-chat.onrender.com";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export const hotelApi = {
  getJobs: (uid) => request(`${API_BASE}/getjobs?user_id=${uid}`),

  getActiveJobsSummary: ({ hotelId, page = 1, limit = 20, includeExpired = true, department, location }) => {
    const qp = new URLSearchParams({
      hotel_id: hotelId,
      page: String(page),
      limit: String(limit),
      include_expired: String(includeExpired),
    });
    if (department) qp.set("department", department);
    if (location) qp.set("location", location);
    return request(`${API_BASE}/hotel/active-jobs-summary?${qp.toString()}`);
  },

  getApplicants: ({ hotelOwnerId, jobId }) =>
    request(`${API_BASE}/hotel/job-applicants?hotel_owner_id=${hotelOwnerId}&job_id=${jobId}`),

  updateApplicantStatus: (payload) =>
    request(`${API_BASE}/hotel/job-applicants/application-status`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createJob: (payload) =>
    request(`${API_BASE}/createjob`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createConversation: ({ hotelOwnerId, jobSeekerId }) =>
    request(`${CHAT_BASE}/conversations?user_id=${hotelOwnerId}`, {
      method: "POST",
      body: JSON.stringify({
        participants: [hotelOwnerId, jobSeekerId],
        topic: "Hotel Job Opening",
      }),
    }),
};
