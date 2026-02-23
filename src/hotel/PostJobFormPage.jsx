import React, { useState } from "react";
import { hotelApi } from "./api";
import { JOB_POST_MODE } from "./jobPostMode";

export default function PostJobFormPage({ mode, onDone, onClose }) {
  const uid = localStorage.getItem("uid");
  const isQuick = mode === JOB_POST_MODE.QUICK;

  const [f, setF] = useState({
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
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!uid || !f.title || !f.department || !f.location) return alert("Fill required fields.");
    setBusy(true);
    try {
      const payload = isQuick ? {
        user_id: uid,
        title: f.title.trim(),
        department: f.department.trim(),
        location: f.location.trim(),
        quick_post: true,
        shifts: f.shifts,
        job_type: f.job_type.trim(),
        urgency: f.urgency.trim(),
        salary: f.salary.trim(),
        application_deadline: f.application_deadline.trim(),
      } : {
        user_id: uid,
        title: f.title.trim(),
        description: f.description.trim(),
        company: f.company.trim(),
        location: f.location.trim(),
        department: f.department.trim(),
        salary: f.salary.trim(),
        job_type: f.job_type.trim(),
        urgency: f.urgency.trim(),
        shifts: f.shifts,
        benefits: f.benefits,
        hotel_star_rating: Number(f.hotel_star_rating || 0),
        amenities: f.amenities,
        required_certificates: f.required_certificates,
        application_deadline: f.application_deadline.trim(),
        status: f.status.trim(),
      };
      await hotelApi.createJob(payload);
      onDone?.();
      onClose?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h4>{isQuick ? "Quick Job Post" : "Post a New Job"}</h4>

      <input placeholder="Title*" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <input placeholder="Department*" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
      <input placeholder="Location*" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      <input placeholder="Salary" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} />
      <input placeholder="Deadline YYYY-MM-DD" value={f.application_deadline} onChange={(e) => setF({ ...f, application_deadline: e.target.value })} />

      {!isQuick && (
        <>
          <input placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
          <textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </>
      )}

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button disabled={busy} onClick={submit}>{busy ? "Posting..." : "Submit"}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
