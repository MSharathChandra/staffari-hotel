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
  } catch {}

  if (!res.ok)
    throw new Error(
      json?.message || json?.error || text || `HTTP ${res.status}`,
    );
  return json;
}

export async function fetchParentHotels() {
  const url = `${API_BASE}/hotel/get_all_hotels_list?parent_only=true`;
  const json = await request(url, { method: "GET" });
  const items = Array.isArray(json?.hotels) ? json.hotels : [];
  return items.map((e) => ({
    hotel_id: e?.hotel_id,
    hotel_name: e?.hotel_name,
    branch: (e?.branch ?? "").toString(),
  }));
}

export async function submitHotelProfileSetup(body) {
  const url = `${API_BASE}/hotel/create-or-update-profile`;
  return request(url, { method: "POST", body: JSON.stringify(body) });
}
