import React, { useEffect, useState } from "react";
// import { hotelApi } from "../api";
import hotelApi from "./api";

export default function HotelChatPage({ conversation, onBack }) {
  const uid = localStorage.getItem("uid");
  const cid = conversation?.conversation_id || conversation?.id;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const data = await hotelApi.getMessages({ uid, cid, limit: 20 });
    setMessages(data?.messages || data?.data || []);
  };

  useEffect(() => {
    if (uid && cid) load();
  }, [uid, cid]);

  const send = async () => {
    if (!text.trim()) return;
    await hotelApi.sendMessage({ uid, conversationId: cid, text: text.trim() });
    setText("");
    load();
  };

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h3>Chat</h3>

      <div
        style={{
          border: "1px solid #ddd",
          minHeight: 220,
          padding: 10,
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        {messages.map((m, i) => (
          <div key={m.id || i} style={{ marginBottom: 6 }}>
            <b>{m.sender_id === uid ? "You" : "Other"}:</b>{" "}
            {m.text || m.message || ""}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
