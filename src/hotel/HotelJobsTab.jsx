// src/hotel/HotelJobsTab.jsx
import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";

function PostJobForm({ mode = "full", onClose, onDone }) {
  const uid = localStorage.getItem("uid") || "";
  const [form, setForm] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    department: "",
    salary: "",
    application_deadline: "",
    status: "open",
    job_type: "",
    urgency: "",
    shifts: [],
    benefits: [],
    hotel_star_rating: 0,
    amenities: [],
    required_certificates: [],
  });

  const post = async () => {
    const payload =
      mode === "quick"
        ? {
            user_id: uid,
            title: form.title.trim(),
            department: form.department.trim(),
            location: form.location.trim(),
            quick_post: true,
            shifts: form.shifts,
            job_type: form.job_type.trim(),
            urgency: form.urgency.trim(),
            salary: form.salary.trim(),
            application_deadline: form.application_deadline.trim(),
          }
        : {
            user_id: uid,
            title: form.title.trim(),
            description: form.description.trim(),
            company: form.company.trim(),
            location: form.location.trim(),
            department: form.department.trim(),
            salary: form.salary.trim(),
            job_type: form.job_type.trim(),
            urgency: form.urgency.trim(),
            shifts: form.shifts,
            benefits: form.benefits,
            hotel_star_rating: Number(form.hotel_star_rating || 0),
            amenities: form.amenities,
            required_certificates: form.required_certificates,
            application_deadline: form.application_deadline.trim(),
            status: form.status.trim(),
          };

    await hotelApi.createJob(payload);
    onDone();
    onClose();
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4>{mode === "quick" ? "Quick Job Post" : "Post Job"}</h4>
      <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
      <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <input placeholder="Salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
      <input placeholder="Application Deadline (YYYY-MM-DD)" value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} />
      {mode !== "quick" && (
        <>
          <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </>
      )}
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button onClick={post}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function HotelJobsTab() {
  const uid = localStorage.getItem("uid") || "";
  const [jobs, setJobs] = useState([]);
  const [mode, setMode] = useState("");

  const load = async () => {
    if (!uid) return;
    const data = await hotelApi.getJobs(uid);
    setJobs(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("quick")}>Quick Post</button>
        <button onClick={() => setMode("full")}>Post Job</button>
      </div>

      {mode ? <PostJobForm mode={mode} onClose={() => setMode("")} onDone={load} /> : null}

      <h3>Your Job Postings</h3>
      {jobs.length === 0 ? <p>No jobs posted yet.</p> : null}
      {jobs.map((j) => (
        <div key={String(j.id)} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <b>{j.title || "No Title"}</b>
          <div>{j.company || "-"}</div>
          <div>{j.location || "-"}</div>
        </div>
      ))}
    </div>
  );
}
