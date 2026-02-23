// src/auth/AuthApi.js
const API_BASE = "https://hhs-backend.onrender.com";

async function req(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

// Adjust endpoints if your backend uses different paths
export const authApi = {
  signUpHotel: (payload) =>
    req(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  signIn: (payload) =>
    req(`${API_BASE}/auth/signin`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
