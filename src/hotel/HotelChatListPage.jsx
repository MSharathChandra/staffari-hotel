import React, { useEffect, useState } from "react";
import hotelApi from "./api";
import HotelChatPage from "./HotelChatPage";

export default function HotelChatListPage({ onClose }) {
  const uid = localStorage.getItem("uid");
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const data = await hotelApi.getConversations(uid, 50);
      setRows(data?.conversations || data?.data || []);
    })();
  }, [uid]);

  if (active)
    return (
      <HotelChatPage conversation={active} onBack={() => setActive(null)} />
    );
  if (!uid) return <p>User not logged in.</p>;

  return (
    <div>
      <button onClick={onClose}>Close</button>
      <h3>Hotel Chats</h3>
      {rows.length === 0 ? (
        <p>No conversations.</p>
      ) : (
        rows.map((c, i) => (
          <div
            key={c.conversation_id || c.id || i}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <b>{c.topic || "Conversation"}</b>
            </div>
            <button onClick={() => setActive(c)}>Open</button>
          </div>
        ))
      )}
    </div>
  );
}
