import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";

export default function MatchingProfilesPage({ job, onBack }) {
  const uid = localStorage.getItem("uid");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await hotelApi.matchProfiles({ hotelOwnerId: uid, jobId: String(job?.id || job?.job_id || "") });
      setRows(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h3>Matching Profiles{job?.title ? ` - ${job.title}` : ""}</h3>
      {loading ? <p>Loading...</p> : rows.length === 0 ? <p>No matches found.</p> : rows.map((r, i) => {
        const p = r.profile || {};
        return (
          <div key={r.user_id || i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <b>{p.fullName || "Unnamed candidate"}</b>
            <div>{p.headline || "-"}</div>
            <div>Location: {p.location || "-"}</div>
            <div>Score: {typeof r.final_score === "number" ? r.final_score.toFixed(1) : (r.final_score || "-")}</div>
            <button onClick={() => setProfileId(r.user_id)}>View Profile</button>
          </div>
        );
      })}
      {profileId ? <ApplicantProfileDrawer applicantId={profileId} onClose={() => setProfileId("")} /> : null}
    </div>
  );
}
