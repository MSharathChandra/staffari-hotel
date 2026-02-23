import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";

export default function SearchJobseekersPage() {
  const uid = localStorage.getItem("uid");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalMatching, setTotalMatching] = useState(0);
  const [profileId, setProfileId] = useState("");
  const [f, setF] = useState({
    location: "",
    availability: "",
    employmentStatus: "",
    department: "",
  });

  const load = async (reset = true) => {
    const target = reset ? 1 : page + 1;
    const data = await hotelApi.getJobseekers({
      hotelId: uid,
      page: target,
      limit: 20,
      location: f.location || undefined,
      availability: f.availability || undefined,
      employmentStatus: f.employmentStatus || undefined,
      department: f.department || undefined,
    });
    const incoming = data.jobseekers || [];
    setRows((prev) => (reset ? incoming : [...prev, ...incoming]));
    setPage(target);
    setHasMore(data.has_more === true);
    setTotalMatching(Number(data.total_matching || 0));
  };

  useEffect(() => { if (uid) load(true); }, []);

  if (!uid) return <p>Hotel ID missing.</p>;

  return (
    <div>
      <h3>Search Jobseekers</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <input placeholder="Availability" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} />
        <input placeholder="Employment Status" value={f.employmentStatus} onChange={(e) => setF({ ...f, employmentStatus: e.target.value })} />
        <input placeholder="Department" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        <button onClick={() => load(true)}>Apply</button>
      </div>

      <b>Total Matching: {totalMatching}</b>

      {rows.map((r, i) => (
        <div key={r.user_id || i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 8 }}>
          <b>{r.fullName || r.name || "N/A"}</b>
          <div>{r.headline || "-"}</div>
          <div>{r.location || "-"}</div>
          <button onClick={() => setProfileId(r.user_id)}>View Profile</button>
        </div>
      ))}

      {hasMore && <button style={{ marginTop: 12 }} onClick={() => load(false)}>Load More</button>}
      {profileId ? <ApplicantProfileDrawer applicantId={profileId} onClose={() => setProfileId("")} /> : null}
    </div>
  );
}
