// src/pages/hotel/ChatListPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { staffari } from "../../theme/staffariTheme";

export default function ChatListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hotelId = location.state?.hotelId ?? null;
  const email = location.state?.email ?? null;

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: staffari.deepJungleGreen,
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate("/hotel")}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 16,
            padding: 8,
            borderRadius: 10,
          }}
          title="Back"
        >
          ←
        </button>

        <div style={{ fontFamily: "Poppins, system-ui", fontWeight: 800 }}>
          Messages
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: staffari.cardBackground,
            borderRadius: 16,
            border: "1px solid rgba(123,111,87,0.25)",
            padding: 16,
            fontFamily: "Poppins, system-ui",
            color: staffari.charcoalBlack,
          }}
        >
          <div style={{ fontWeight: 800, color: staffari.deepJungleGreen }}>
            ChatListScreen (Web)
          </div>
          <div style={{ marginTop: 8, color: staffari.mutedOlive }}>
            HotelId: {hotelId || "N/A"} | Email: {email || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
