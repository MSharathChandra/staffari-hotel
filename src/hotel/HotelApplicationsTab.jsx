// src/hotel/HotelApplicationsTab.jsx
import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";

export default function HotelApplicationsTab({ onOpenApplicants }) {
  const hotelId = localStorage.getItem("uid") || "";
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({ totalApplicants: 0, totalAccepted: 0, totalPendingOrRejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ department: "", location: "", includeExpired: true });

  const load = async () => {
    if (!hotelId) return;
    setLoading(true);
    setError("");
    try {
      const res = await hotelApi.getActiveJobsSummary({
        hotelId,
        page: 1,
        limit: 20,
        includeExpired: filter.includeExpired,
        department: filter.department || undefined,
        location: filter.location || undefined,
      });
      setItems((res.jobs || []).map((j) => ({ jobData: j, applicantCount: Number(j.applicants_count || 0) })));
      setTotals({
        totalApplicants: Number(res.total_applicants || 0),
        totalAccepted: Number(res.total_accepted || 0),
        totalPendingOrRejected: Number(res.total_pending_or_rejected || 0),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!hotelId) return <p>Hotel owner not logged in.</p>;
  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="Department" value={filter.department} onChange={(e) => setFilter({ ...filter, department: e.target.value })} />
        <input placeholder="Location" value={filter.location} onChange={(e) => setFilter({ ...filter, location: e.target.value })} />
        <label>
          <input type="checkbox" checked={filter.includeExpired} onChange={(e) => setFilter({ ...filter, includeExpired: e.target.checked })} />
          Include expired
        </label>
        <button onClick={load}>Apply</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <b>Applicants: {totals.totalApplicants}</b>
        <b>Accepted: {totals.totalAccepted}</b>
        <b>Pending/Rejected: {totals.totalPendingOrRejected}</b>
      </div>

      {items.length === 0 ? (
        <p>No jobs posted yet.</p>
      ) : (
        items.map((item) => (
          <div key={String(item.jobData.id)} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div><b>{item.jobData.title || "No Title"}</b></div>
            <div>{item.jobData.company || "No Company"}</div>
            <div>Applicants: {item.applicantCount}</div>
            <button onClick={() => onOpenApplicants(item)}>View Applications</button>
          </div>
        ))
      )}
    </div>
  );
}
