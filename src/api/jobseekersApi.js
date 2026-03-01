const API_HOST = "https://hhs-backend-1fmx.onrender.com";

async function request(url) {
  const res = await fetch(url);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok)
    throw new Error(
      json?.message || json?.error || text || `HTTP ${res.status}`,
    );
  return json;
}

export function buildJobseekersUrl({
  hotelId,
  page,
  limit,
  location,
  availability,
  employmentStatus,
  department,
}) {
  const params = new URLSearchParams();
  params.set("hotel_id", String(hotelId));
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (location?.trim()) params.set("location", location.trim());
  if (availability) params.set("availability", availability);
  if (employmentStatus) params.set("employment_status", employmentStatus);
  if (department) params.set("department", department);

  return `${API_HOST}/hotel/get-jobseekers?${params.toString()}`;
}

export async function fetchJobseekers(args) {
  const url = buildJobseekersUrl(args);
  return request(url);
}
