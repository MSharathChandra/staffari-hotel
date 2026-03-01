// src/pages/hotel/HotelDashboard.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffari } from "../theme/staffariTheme";
import { lsGet } from "../utils/storage";

import JobApplicantsDashboardPage from "./hotel/tabs/JobApplicantsDashboardPage";
import HotelJobsPage from "./hotel/tabs/HotelJobsPage";
import HotelProfilePage from "./hotel/tabs/HotelProfilePage";
import SearchJobseekersPage from "./hotel/tabs/SearchJobseekersPage";

export default function HotelDashboard() {
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Read once on first render (no useEffect => no lint error)
  const [hotelName] = useState(() => lsGet("fullName", "Hotel") || "Hotel");
  const [email] = useState(
    () => lsGet("email", "No email found") || "No email found",
  );
  const [hotelId] = useState(() => lsGet("uid", null));

  const tabs = useMemo(() => {
    return [
      {
        key: "applications",
        label: "Applications",
        icon: "📥",
        node: <JobApplicantsDashboardPage hotelId={hotelId} email={email} />,
      },
      {
        key: "jobs",
        label: "Jobs",
        icon: "📚",
        node: <HotelJobsPage hotelId={hotelId} email={email} />,
      },
      {
        key: "profile",
        label: "Profile",
        icon: "🏨",
        node: <HotelProfilePage hotelId={hotelId} email={email} />,
      },
      {
        key: "search",
        label: "Search Talent",
        icon: "🔎",
        node: <SearchJobseekersPage hotelId={hotelId} email={email} />,
      },
    ];
  }, [hotelId, email]);

  // Optional: if somehow uid is missing, show a simple loader (or redirect)
  if (!hotelId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: staffari.earthyBeige,
          display: "grid",
          placeItems: "center",
          fontFamily: "Poppins, system-ui",
        }}
      >
        <div style={{ color: staffari.emeraldGreen, fontWeight: 800 }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      {/* Top AppBar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: staffari.deepJungleGreen,
          color: "#fff",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "Poppins, system-ui",
            fontWeight: 800,
            fontSize: 16,
            lineHeight: 1.2,
          }}
        >
          Welcome, {hotelName}
        </div>

        <button
          type="button"
          title="Messages"
          onClick={() =>
            navigate("/hotel/chats", {
              state: { hotelId, email },
            })
          }
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
            padding: 8,
            borderRadius: 10,
          }}
        >
          💬
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          padding: 16,
          paddingBottom: 84,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {tabs[selectedIndex]?.node}
      </div>

      {/* Bottom Navigation (fixed) */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: staffari.cardBackground,
          borderTop: "1px solid rgba(123,111,87,0.25)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.08)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "8px 6px",
          zIndex: 20,
        }}
      >
        {tabs.map((t, idx) => {
          const active = idx === selectedIndex;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "8px 6px",
                borderRadius: 12,
                color: active ? staffari.emeraldGreen : staffari.mutedOlive,
                fontFamily: "Poppins, system-ui",
              }}
            >
              <div style={{ fontSize: 18, lineHeight: "18px" }}>{t.icon}</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: active ? 800 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
