// src/api/chatApi.js
const CHAT_BASE = "https://hhs-chat-ezev.onrender.com";

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

// Matches your Dart createConversation(): POST /conversations?userid={hotelOwnerId} with participants + topic. [file:84]
export async function createConversation({ hotelOwnerId, jobSeekerId }) {
  const url = `${CHAT_BASE}/conversations?userid=${encodeURIComponent(
    String(hotelOwnerId),
  )}`;

  const payload = {
    participants: [String(hotelOwnerId), String(jobSeekerId)],
    topic: "Hotel Job Opening",
  };

  const json = await request(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const cid = json?.conversationId?.toString();
  return cid && cid.length ? cid : null;
}
