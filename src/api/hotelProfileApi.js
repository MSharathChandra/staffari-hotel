// src/api/hotelProfileApi.js
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

export async function getHotelProfile(userId) {
  const url = `${API_BASE}/hotel/get-profile?user_id=${encodeURIComponent(String(userId))}`;
  return request(url, { method: "GET" });
}

export async function saveBannerOnly({
  userId,
  bannerImageUrl,
  galleryImageUrls = [],
  profilePicUrl = null,
}) {
  const url = `${API_BASE}/hotel/create-or-update-profile`;
  const body = {
    user_id: userId,
    banner_image_url: bannerImageUrl,
    gallery_image_urls: galleryImageUrls,
    profile_pic_url: profilePicUrl,
  };
  return request(url, { method: "POST", body: JSON.stringify(body) });
}
