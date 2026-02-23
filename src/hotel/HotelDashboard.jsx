import React, { useState } from "react";
import HotelApplicationsSummaryPage from "./HotelApplicationsSummary";
import HotelApplicantsPage from "./HotelApplicantsPage";
import HotelJobsPage from "./HotelJobsPage";
import HotelProfilePage from "./HotelProfilePage";
import SearchJobseekersPage from "./SearchJobSeekersPage";
import HotelChatListPage from "./HotelChatListPage";

export default function HotelDashboard() {
  const [tab, setTab] = useState("applications");
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const name = localStorage.getItem("fullName") || "Hotel";

  return (
    <div style={{ padding: 16 }}>
      <h2>Welcome, {name}</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("applications")}>Applications</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
        <button onClick={() => setTab("profile")}>Profile</button>
        <button onClick={() => setTab("search")}>Search Talent</button>
        <button onClick={() => setChatOpen(true)}>Messages</button>
      </div>

      {chatOpen ? (
        <HotelChatListPage onClose={() => setChatOpen(false)} />
      ) : selectedJob ? (
        <HotelApplicantsPage job={selectedJob} onBack={() => setSelectedJob(null)} />
      ) : tab === "applications" ? (
        <HotelApplicationsSummaryPage onOpenApplicants={setSelectedJob} />
      ) : tab === "jobs" ? (
        <HotelJobsPage />
      ) : tab === "profile" ? (
        <HotelProfilePage />
      ) : (
        <SearchJobseekersPage />
      )}
    </div>
  );
}
