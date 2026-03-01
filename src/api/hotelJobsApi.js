// src/api/hotelJobsApi.js
import { lsGet } from "../utils/storage";

const API_BASE = "https://hhs-backend-1fmx.onrender.com";

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || text || `HTTP ${res.status}`,
    );
  }
  return json;
}

export async function fetchHotelJobs() {
  const userId = lsGet("uid", null);
  if (!userId) throw new Error("User not logged in.");

  const url = `${API_BASE}/getjobs?user_id=${encodeURIComponent(String(userId))}`;
  const data = await request(url, { method: "GET" });

  if (!Array.isArray(data)) throw new Error("Unexpected response format.");
  return data;
}
