import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";
import PostJobFormPage from "./PostJobFormPage";
import MatchingProfilesPage from "./MatchingProfilesPage";
import { JOB_POST_MODE } from "./jobPostMode";

export default function HotelJobsPage() {
  const uid = localStorage.getItem("uid");
  const [jobs, setJobs] = useState([]);
  const [formMode, setFormMode] = useState("");
  const [matchingFor, setMatchingFor] = useState(null);

  const load = async () => {
    if (!uid) return;
    const data = await hotelApi.getJobs(uid);
    setJobs(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  if (!uid) return <p>User not logged in.</p>;
  if (matchingFor) return <MatchingProfilesPage job={matchingFor} onBack={() => setMatchingFor(null)} />;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setFormMode(JOB_POST_MODE.QUICK)}>Quick Post</button>
        <button onClick={() => setFormMode(JOB_POST_MODE.FULL)}>Post Job</button>
      </div>

      {formMode ? (
        <PostJobFormPage
          mode={formMode}
          onDone={load}
          onClose={() => setFormMode("")}
        />
      ) : null}

      <h3>Your Job Postings</h3>
      {jobs.length === 0 ? <p>No jobs posted yet.</p> : jobs.map((job) => (
        <div key={String(job.id)} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <b>{job.title || "No Title"}</b>
          <div>{job.company || "-"}</div>
          <div>{job.location || "-"}</div>
          <button onClick={() => setMatchingFor(job)}>See matching profiles</button>
        </div>
      ))}
    </div>
  );
}
