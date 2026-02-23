import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";

export default function HotelApplicationsSummaryPage({ onOpenApplicants }) {
  const uid = localStorage.getItem("uid");
  const [jobs, setJobs] = useState([]);
  const [totals, setTotals] = useState({ totalApplicants: 0, totalAccepted: 0, totalPendingOrRejected: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({ department: "", location: "", includeExpired: true });

  const load = async () => {
    if (!uid) return;
    setLoading(true);
    setErr("");
    try {
      const data = await hotelApi.getActiveJobsSummary({
        hotelId: uid,
        page: 1,
        limit: 20,
        includeExpired: filters.includeExpired,
        department: filters.department || undefined,
        location: filters.location || undefined,
      });
      setJobs((data.jobs || []).map((j) => ({ jobData: j, applicantCount: Number(j.applicants_count || 0) })));
      setTotals({
        totalApplicants: Number(data.total_applicants || 0),
        totalAccepted: Number(data.total_accepted || 0),
        totalPendingOrRejected: Number(data.total_pending_or_rejected || 0),
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!uid) return <p>Hotel user not logged in.</p>;
  if (loading) return <p>Loading...</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="Department" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} />
        <input placeholder="Location" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
        <label>
          <input type="checkbox" checked={filters.includeExpired} onChange={(e) => setFilters({ ...filters, includeExpired: e.target.checked })} />
          Include expired
        </label>
        <button onClick={load}>Apply</button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <strong>Applicants: {totals.totalApplicants}</strong>
        <strong>Accepted: {totals.totalAccepted}</strong>
        <strong>Pending/Rejected: {totals.totalPendingOrRejected}</strong>
      </div>

      {jobs.length === 0 ? <p>No jobs posted yet.</p> : jobs.map((item) => (
        <div key={String(item.jobData.id)} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div><b>{item.jobData.title || "No Title"}</b></div>
          <div>{item.jobData.company || "No Company"}</div>
          <div>Applicants: {item.applicantCount}</div>
          <button onClick={() => onOpenApplicants(item)}>View Applications</button>
        </div>
      ))}
    </div>
  );
}
