const APIBASE = "https://hhs-backend-1fmx.onrender.com";
const CHATBASE = "https://hhs-chat.onrender.com"; // kept for other pages

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

const hotelApi = {
  // Flutter uses: /getjobs?userid=<uid> [file:75]
  getJobs(uid) {
    return request(`${APIBASE}/getjobs?user_id=${encodeURIComponent(uid)}`);
  },

  createJob(payload) {
    return request(`${APIBASE}/createjob`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  editJob(jobId, payload) {
    return request(`${APIBASE}/editjob/${encodeURIComponent(jobId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Flutter uses POST /hotel/match-jobseekers-to-job with:
  // { hotel_owner_id, job_id } [your snippet]
  matchProfiles({ hotelOwnerId, jobId }) {
    return request(`${APIBASE}/hotel/match-jobseekers-to-job`, {
      method: "POST",
      body: JSON.stringify({
        hotel_owner_id: hotelOwnerId,
        job_id: jobId,
      }),
    });
  },

  // NOTE: confirm your backend route.
  // If you paste your Flutter applicant profile API call, I will set it exactly.
  getJobSeekerProfile(applicantId) {
    return request(
      `${APIBASE}/jobseeker/profile?user_id=${encodeURIComponent(applicantId)}`,
    );
  },

  // kept (Applications page)
  async getActiveJobsSummary({
    hotelId,
    page = 1,
    limit = 20,
    includeExpired = true,
    department,
    location,
  }) {
    if (!hotelId) throw new Error("hotelId is required");

    const qp = new URLSearchParams({
      hotel_id: hotelId,
      hotelid: hotelId, // backward compat
      page: String(page),
      limit: String(limit),
      include_expired: String(includeExpired),
      includeexpired: String(includeExpired),
    });

    if (department) qp.set("department", String(department));
    if (location) qp.set("location", String(location));

    const json = await request(
      `${APIBASE}/hotel/active-jobs-summary?${qp.toString()}`,
    );

    const jobs = Array.isArray(json?.jobs) ? json.jobs : [];
    return {
      items: jobs.map((j) => ({
        jobData: j,
        applicantCount: Number(j?.applicantscount ?? 0) || 0,
      })),
      hasMore: json?.hasmore ?? true,
      totalApplicants: Number(json?.totalapplicants ?? 0) || 0,
      totalAccepted: Number(json?.totalaccepted ?? 0) || 0,
      totalPendingOrRejected: Number(json?.totalpendingorrejected ?? 0) || 0,
    };
  },
};

export default hotelApi;
