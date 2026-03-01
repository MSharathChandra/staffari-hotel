import React, { useMemo, useState } from "react";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { editJob } from "../../../api/jobCrudApi";

export default function JobDetailsPage({ job, onClose, onSaved }) {
  const isHotelView = !!job?.hideApplyButton;

  const jobId = useMemo(() => {
    return (job?.id ?? job?.job_id ?? job?.jobId ?? job?._id ?? "").toString();
  }, [job]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // controllers -> state
  const [title, setTitle] = useState((job?.title ?? "").toString());
  const [description, setDescription] = useState(
    (job?.description ?? "").toString(),
  );
  const [company, setCompany] = useState((job?.company ?? "").toString());
  const [location, setLocation] = useState((job?.location ?? "").toString());
  const [salary, setSalary] = useState((job?.salary ?? "").toString());
  const [jobType, setJobType] = useState(
    (job?.jobtype ?? job?.jobType ?? "").toString(),
  );
  const [status, setStatus] = useState((job?.status ?? "open").toString());
  const [deadline, setDeadline] = useState(
    (job?.applicationdeadline ?? "").toString(),
  );

  const listToComma = (v) =>
    Array.isArray(v) ? v.map(String).join(", ") : (v ?? "").toString();
  const [benefits, setBenefits] = useState(listToComma(job?.benefits));
  const [amenities, setAmenities] = useState(listToComma(job?.amenities));
  const [certs, setCerts] = useState(listToComma(job?.requiredcertificates));

  const stringToList = (text) => {
    const t = (text || "").trim();
    if (!t) return [];
    return t
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const saveChanges = async () => {
    if (!jobId) {
      alert("Job ID missing.");
      return;
    }

    const userId = lsGet("uid", null);
    if (!userId) {
      alert("User not logged in.");
      return;
    }

    if (
      !title.trim() ||
      !company.trim() ||
      !location.trim() ||
      !salary.trim() ||
      !jobType.trim() ||
      !status.trim() ||
      !deadline.trim()
    ) {
      alert("All fields are required.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        userid: userId,
        title: title,
        description: description,
        company: company,
        location: location,
        salary: salary,
        jobtype: jobType,
        status: status,
        applicationdeadline: deadline,
        benefits: stringToList(benefits),
        amenities: stringToList(amenities),
        requiredcertificates: stringToList(certs),
      };

      await editJob(jobId, payload);

      alert("Job updated successfully!");
      setIsEditing(false);

      if (typeof onSaved === "function") onSaved();
      if (typeof onClose === "function") onClose();
    } catch (e) {
      alert(`Failed to update: ${String(e?.message || e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: staffari.cardBackground }}>
      <div
        style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}
      >
        <div
          style={{
            flex: 1,
            fontFamily: "Space Grotesk, system-ui",
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          {isEditing ? "Edit Job" : "Job Details"}
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: staffari.deepJungleGreen,
            fontSize: 18,
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />

      <div style={{ padding: 16, overflow: "auto", maxHeight: "80vh" }}>
        <Card>
          <Field
            label="Job Title"
            value={title}
            onChange={setTitle}
            editing={isEditing}
            headline
          />
          <Field
            label="Company"
            value={company}
            onChange={setCompany}
            editing={isEditing}
          />
        </Card>

        <Card>
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            editing={isEditing}
            textarea
          />
        </Card>

        <Card>
          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            editing={isEditing}
          />
          <Field
            label="Job Type"
            value={jobType}
            onChange={setJobType}
            editing={isEditing}
          />
          <Field
            label="Salary"
            value={salary}
            onChange={setSalary}
            editing={isEditing}
          />
          <Field
            label="Status"
            value={status}
            onChange={setStatus}
            editing={isEditing}
          />
          <Field
            label="Application Deadline"
            value={deadline}
            onChange={setDeadline}
            editing={isEditing}
            placeholder="YYYY-MM-DD"
          />
        </Card>

        {isEditing ? (
          <>
            <Card>
              <Field
                label="Benefits (comma-separated)"
                value={benefits}
                onChange={setBenefits}
                editing
                textarea
              />
            </Card>
            <Card>
              <Field
                label="Amenities (comma-separated)"
                value={amenities}
                onChange={setAmenities}
                editing
                textarea
              />
            </Card>
            <Card>
              <Field
                label="Required Certificates (comma-separated)"
                value={certs}
                onChange={setCerts}
                editing
                textarea
              />
            </Card>
          </>
        ) : (
          <>
            {Array.isArray(job?.benefits) && job.benefits.length ? (
              <TagList title="Benefits" items={job.benefits} />
            ) : null}
            {Array.isArray(job?.amenities) && job.amenities.length ? (
              <TagList title="Amenities" items={job.amenities} />
            ) : null}
            {Array.isArray(job?.requiredcertificates) &&
            job.requiredcertificates.length ? (
              <TagList
                title="Required Certificates"
                items={job.requiredcertificates}
              />
            ) : null}
          </>
        )}

        <div style={{ height: 90 }} />
      </div>

      {/* Bottom action area */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: staffari.cardBackground,
          padding: 14,
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {isHotelView ? (
          isEditing ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                disabled={isLoading}
                onClick={saveChanges}
                style={{
                  flex: 1,
                  background: staffari.emeraldGreen,
                  color: "#fff",
                  border: "none",
                  padding: "12px 14px",
                  borderRadius: 16,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "Poppins, system-ui",
                  fontWeight: 900,
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>

              <button
                disabled={isLoading}
                onClick={() => setIsEditing(false)}
                style={{
                  background: "transparent",
                  color: staffari.mutedOlive,
                  border: "none",
                  padding: "12px 14px",
                  borderRadius: 16,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "Poppins, system-ui",
                  fontWeight: 900,
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: "100%",
                background: staffari.emeraldGreen,
                color: "#fff",
                border: "none",
                padding: "14px 16px",
                borderRadius: 16,
                cursor: "pointer",
                fontFamily: "Poppins, system-ui",
                fontWeight: 900,
              }}
            >
              Edit Job
            </button>
          )
        ) : (
          <button
            disabled
            style={{
              width: "100%",
              background: staffari.emeraldGreen,
              color: "#fff",
              border: "none",
              padding: "14px 16px",
              borderRadius: 16,
              fontFamily: "Poppins, system-ui",
              fontWeight: 900,
              opacity: 0.6,
            }}
          >
            Apply Now (Jobseeker flow later)
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.2)",
        padding: 16,
        marginBottom: 16,
        fontFamily: "Poppins, system-ui",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editing,
  headline,
  textarea,
  placeholder = "",
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: staffari.mutedOlive,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {editing ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            style={editStyle()}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={editStyle()}
          />
        )
      ) : (
        <div
          style={{
            fontFamily: headline
              ? "Space Grotesk, system-ui"
              : "Poppins, system-ui",
            fontWeight: headline ? 900 : 600,
            fontSize: headline ? 22 : 15,
            color: staffari.charcoalBlack,
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
          }}
        >
          {String(value || "Not provided")}
        </div>
      )}
    </div>
  );
}

function TagList({ title, items }) {
  return (
    <Card>
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: staffari.mutedOlive,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, idx) => (
          <span
            key={idx}
            style={{
              background: "rgba(25,95,78,0.10)",
              border: "1px solid rgba(25,95,78,0.25)",
              color: staffari.deepJungleGreen,
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {String(it)}
          </span>
        ))}
      </div>
    </Card>
  );
}

function editStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(123,111,87,0.25)",
    outline: "none",
    background: "#eee",
    fontFamily: "Poppins, system-ui",
    fontWeight: 700,
    color: staffari.charcoalBlack,
    boxSizing: "border-box",
  };
}
