import React, { useEffect, useMemo, useState } from "react";
import { hotelApi } from "./api";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";

const STATUS = ["Interview Scheduled", "Viewed", "Accepted", "Rejected", "Pending"];

export default function HotelApplicantsPage({ job, onBack }) {
  const uid = localStorage.getItem("uid");
  const jobId = job?.jobData?.id;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [profileId, setProfileId] = useState("");

  const allSelected = useMemo(() => rows.length > 0 && selected.size === rows.length, [rows, selected]);

  const load = async () => {
    if (!uid || !jobId) return;
    setLoading(true);
    try {
      const res = await hotelApi.getApplicants({ hotelOwnerId: uid, jobId });
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jobId]);

  const updateOne = async (userId, status) => {
    await hotelApi.updateApplicantStatus({ hotel_owner_id: uid, job_id: jobId, user_id: userId, status });
    setRows((p) => p.map((x) => (x.user_id === userId ? { ...x, status } : x)));
  };

  const updateBulk = async (status) => {
    if (!selected.size) return;
    await hotelApi.updateApplicantStatus({
      hotel_owner_id: uid,
      job_id: jobId,
      updates: Array.from(selected).map((id) => ({ user_id: id, status })),
    });
    setRows((p) => p.map((x) => (selected.has(x.user_id) ? { ...x, status } : x)));
    setSelected(new Set());
    setSelectionMode(false);
  };

  const startChat = async (jobSeekerId) => {
    const out = await hotelApi.createConversation({ hotelOwnerId: uid, jobSeekerId });
    alert(`Conversation created: ${out.conversationId || "OK"}`);
  };

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h3>Job Applicants: {job?.jobData?.title || "Job"}</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setSelectionMode(!selectionMode); setSelected(new Set()); }}>
          {selectionMode ? "Cancel Selection" : "Select"}
        </button>
        {selectionMode && (
          <>
            <button onClick={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.user_id)))}>
              {allSelected ? "Unselect All" : "Select All"}
            </button>
            {STATUS.map((s) => <button key={s} onClick={() => updateBulk(s)}>{s}</button>)}
          </>
        )}
      </div>

      {loading ? <p>Loading...</p> : rows.length === 0 ? <p>No applicants yet.</p> : rows.map((a) => {
        const p = a.profile_snapshot || {};
        return (
          <div key={a.user_id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div><b>{p.fullName || "N/A"}</b></div>
            <div>{p.headline || "No headline"}</div>
            <div>{p.email || "N/A"} | {p.phone || "N/A"}</div>
            <div>Status: {a.status || "Pending"}</div>

            {selectionMode ? (
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(a.user_id)}
                  onChange={() => {
                    const n = new Set(selected);
                    n.has(a.user_id) ? n.delete(a.user_id) : n.add(a.user_id);
                    setSelected(n);
                  }}
                />
                Select
              </label>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setProfileId(a.user_id)}>View Profile</button>
                <select value={a.status || "Pending"} onChange={(e) => updateOne(a.user_id, e.target.value)}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => startChat(a.user_id)}>Chat</button>
              </div>
            )}
          </div>
        );
      })}

      {profileId ? <ApplicantProfileDrawer applicantId={profileId} onClose={() => setProfileId("")} /> : null}
    </div>
  );
}
