import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { createJob } from "../../../api/jobCrudApi";
import { JobPostMode } from "./jobPostMode";

const baseJobTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary/Seasonal",
  "Apprenticeship",
  "Freelance/Consultant",
  "Shift-based (Day/Night/Rotational)",
  "Remote/Hybrid",
  "Other",
];

const baseUrgencyOptions = [
  "Immediate",
  "Within 7 days",
  "Within 15 days",
  "Flexible",
  "Other",
];
const baseShiftOptions = [
  "Morning",
  "Evening",
  "Night",
  "Rotational",
  "Split",
  "Other",
];

const baseBenefitsOptions = [
  "Provident Fund (PF)",
  "Employee State Insurance (ESI)",
  "Gratuity",
  "Health Insurance / Group Mediclaim",
  "Paid Leave (CL/SL/EL)",
  "Meals on Duty",
  "Accommodation/Staff Housing",
  "Transport/Commute Allowance",
  "Service Charge Share",
  "Tips Sharing",
  "Performance Bonus",
  "Overtime Pay",
  "Uniform / Laundry",
  "Training/Certification Sponsorship",
  "Relocation Support",
  "Other",
];

const baseAmenitiesOptions = [
  "Free WiFi",
  "Parking/Valet",
  "Swimming Pool",
  "Gym/Fitness Center",
  "Spa/Salon",
  "Restaurant/Café",
  "Bar/Lounge",
  "Room Service",
  "Banquet Hall",
  "Conference/Meeting Rooms",
  "Airport Shuttle",
  "Laundry/Dry Cleaning",
  "Concierge/Travel Desk",
  "24x7 Front Desk",
  "Power Backup",
  "Accessible Rooms",
  "Non-Smoking Rooms",
  "CCTV/Security",
  "Other",
];

const baseCertificateOptions = [
  "FoSTaC / FSSAI Food Safety Supervisor",
  "HACCP (Food Safety)",
  "Basic Food Hygiene",
  "Fire Safety",
  "First Aid/CPR (IRCS)",
  "Bartending/Responsible Service of Alcohol",
  "Housekeeping/NOS (NSDC)",
  "PSARA (Security roles)",
  "Other",
];

export default function PostJobFormPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode =
    location.state?.mode === JobPostMode.quick
      ? JobPostMode.quick
      : JobPostMode.full;
  const isQuick = mode === JobPostMode.quick;

  const [isLoading, setIsLoading] = useState(false);

  // fields
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState(""); // YYYY-MM-DD

  const [jobTypeOptions, setJobTypeOptions] = useState(baseJobTypeOptions);
  const [urgencyOptions, setUrgencyOptions] = useState(baseUrgencyOptions);

  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("");

  const [selectedShifts, setSelectedShifts] = useState([]);

  // full-only
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");

  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [selectedHotelRating, setSelectedHotelRating] = useState(null); // 1..5

  // pickers
  const [picker, setPicker] = useState(null); // {title, options, selected, onChange}

  const pageTitle = isQuick ? "Quick Job Post" : "Post a New Job";

  const requiredDropdownValidator = (v, msg) => {
    if (!v || !String(v).trim()) return msg;
    return null;
  };

  const validate = () => {
    if (!title.trim()) return "Job Title is required";
    if (!department.trim()) return "Department is required";
    if (!jobLocation.trim()) return "Location is required";
    if (!salary.trim()) return "Salary is required";

    const errJobType = requiredDropdownValidator(
      selectedJobType,
      "Please choose a job type",
    );
    if (errJobType) return errJobType;

    if (isQuick) {
      if (selectedShifts.length === 0) return "Select at least one shift";
      const errUrg = requiredDropdownValidator(
        selectedUrgency,
        "Please choose urgency",
      );
      if (errUrg) return errUrg;
    }

    if (!applicationDeadline.trim()) return "Please pick a deadline";

    if (!isQuick) {
      if (!company.trim()) return "Company Name is required";
      if (!description.trim()) return "Job Description is required";
      if (selectedBenefits.length === 0) return "Select at least one benefit";
      if (selectedAmenities.length === 0) return "Select at least one amenity";
      if (selectedCertificates.length === 0)
        return "Select at least one certificate";
      if (!selectedHotelRating) return "Select a star rating";
    }

    return null;
  };

  const buildPayload = (userId) => {
    if (isQuick) {
      return {
        userid: userId,
        title: title.trim(),
        department: department.trim(),
        location: jobLocation.trim(),
        quickpost: true,
        shifts: selectedShifts,
        jobtype: selectedJobType.trim(),
        urgency: selectedUrgency.trim(),
        salary: salary.trim(),
        applicationdeadline: applicationDeadline.trim(),
      };
    }

    return {
      userid: userId,
      title: title.trim(),
      description: description.trim(),
      company: company.trim(),
      location: jobLocation.trim(),
      department: department.trim(),
      salary: salary.trim(),
      jobtype: selectedJobType.trim(),
      urgency: selectedUrgency.trim(),
      shifts: selectedShifts,
      benefits: selectedBenefits,
      hotelstarrating: selectedHotelRating ?? 0,
      amenities: selectedAmenities,
      requiredcertificates: selectedCertificates,
      applicationdeadline: applicationDeadline.trim(),
      status: status.trim(),
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const userId = lsGet("uid", null);
    if (!userId) {
      alert("Error: User ID not found.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildPayload(userId);
      await createJob(payload);

      alert(
        isQuick ? "Quick job posted successfully!" : "Job posted successfully!",
      );
      navigate("/hotel", {
        replace: true,
        state: { tab: "jobs", refreshJobs: true },
      });
    } catch (e2) {
      alert(`Failed to post job: ${String(e2?.message || e2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openMultiPicker = ({ title, options, selected, onChange }) => {
    setPicker({ title, options, selected, onChange });
  };

  const addOther = async (label) => {
    const v = window.prompt(`Add ${label}`, "");
    const text = (v || "").trim();
    return text || null;
  };

  const handleJobTypeChange = async (val) => {
    if (val === "Other") {
      const added = await addOther("Job Type");
      if (!added) return;
      setJobTypeOptions((prev) => {
        const list = prev.slice();
        const idx = Math.max(0, list.length - 1);
        list.splice(idx, 0, added);
        return list;
      });
      setSelectedJobType(added);
      return;
    }
    setSelectedJobType(val);
  };

  const handleUrgencyChange = async (val) => {
    if (val === "Other") {
      const added = await addOther("Urgency");
      if (!added) return;
      setUrgencyOptions((prev) => {
        const list = prev.slice();
        const idx = Math.max(0, list.length - 1);
        list.splice(idx, 0, added);
        return list;
      });
      setSelectedUrgency(added);
      return;
    }
    setSelectedUrgency(val);
  };

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: staffari.deepJungleGreen,
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate("/hotel")}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 16,
            padding: 8,
          }}
          title="Back"
        >
          ←
        </button>
        <div style={{ fontFamily: "Poppins, system-ui", fontWeight: 900 }}>
          {pageTitle}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}
      >
        {/* Common fields */}
        <TextField label="Job Title" value={title} onChange={setTitle} />
        <TextField
          label="Department"
          value={department}
          onChange={setDepartment}
        />
        <TextField
          label="Location (e.g., City, Country)"
          value={jobLocation}
          onChange={setJobLocation}
        />
        <TextField
          label="Salary (e.g., 50000 INR/month)"
          value={salary}
          onChange={setSalary}
        />

        <SelectField
          label="Job Type"
          value={selectedJobType}
          options={jobTypeOptions}
          onChange={handleJobTypeChange}
        />

        {/* Quick-only */}
        {isQuick && (
          <>
            <MultiSelectField
              label="Shifts"
              values={selectedShifts}
              onTap={() =>
                openMultiPicker({
                  title: "Select Shifts",
                  options: baseShiftOptions,
                  selected: selectedShifts,
                  onChange: setSelectedShifts,
                })
              }
              required
            />

            <SelectField
              label="Urgency"
              value={selectedUrgency}
              options={urgencyOptions}
              onChange={handleUrgencyChange}
            />
          </>
        )}

        {/* Full-only */}
        {!isQuick && (
          <>
            <TextField
              label="Company Name"
              value={company}
              onChange={setCompany}
            />
            <TextArea
              label="Job Description"
              value={description}
              onChange={setDescription}
            />

            <MultiSelectField
              label="Benefits"
              values={selectedBenefits}
              onTap={() =>
                openMultiPicker({
                  title: "Select Benefits",
                  options: baseBenefitsOptions,
                  selected: selectedBenefits,
                  onChange: setSelectedBenefits,
                })
              }
              required
            />

            <MultiSelectField
              label="Amenities"
              values={selectedAmenities}
              onTap={() =>
                openMultiPicker({
                  title: "Select Amenities",
                  options: baseAmenitiesOptions,
                  selected: selectedAmenities,
                  onChange: setSelectedAmenities,
                })
              }
              required
            />

            <MultiSelectField
              label="Required Certificates"
              values={selectedCertificates}
              onTap={() =>
                openMultiPicker({
                  title: "Required Certificates",
                  options: baseCertificateOptions,
                  selected: selectedCertificates,
                  onChange: setSelectedCertificates,
                })
              }
              required
            />

            <SelectField
              label="Hotel Star Rating"
              value={selectedHotelRating ? String(selectedHotelRating) : ""}
              options={["1", "2", "3", "4", "5"]}
              onChange={(v) => setSelectedHotelRating(v ? Number(v) : null)}
            />

            <TextField
              label="Status"
              value={status}
              onChange={setStatus}
              placeholder="open"
            />
          </>
        )}

        {/* Deadline */}
        <DateField
          label="Application Deadline (YYYY-MM-DD)"
          value={applicationDeadline}
          onChange={setApplicationDeadline}
        />

        <div style={{ height: 18 }} />

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            background: staffari.emeraldGreen,
            color: "#fff",
            border: "none",
            padding: "14px 16px",
            borderRadius: 16,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "Poppins, system-ui",
            fontWeight: 900,
            fontSize: 16,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Posting..." : isQuick ? "Quick Post" : "Post Job"}
        </button>
      </form>

      {picker ? (
        <MultiPickerModal
          title={picker.title}
          options={picker.options}
          selected={picker.selected}
          onChange={picker.onChange}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <label
      style={{
        display: "block",
        margin: "10px 0",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{ color: staffari.mutedOlive, fontWeight: 700, marginBottom: 6 }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle()}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label
      style={{
        display: "block",
        margin: "10px 0",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{ color: staffari.mutedOlive, fontWeight: 700, marginBottom: 6 }}
      >
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{ ...inputStyle(), resize: "vertical" }}
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label
      style={{
        display: "block",
        margin: "10px 0",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{ color: staffari.mutedOlive, fontWeight: 700, marginBottom: 6 }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle()}
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label
      style={{
        display: "block",
        margin: "10px 0",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{ color: staffari.mutedOlive, fontWeight: 700, marginBottom: 6 }}
      >
        {label}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle()}
      />
    </label>
  );
}

function MultiSelectField({ label, values, onTap, required }) {
  return (
    <div style={{ margin: "10px 0", fontFamily: "Poppins, system-ui" }}>
      <div
        style={{ color: staffari.mutedOlive, fontWeight: 700, marginBottom: 6 }}
      >
        {label}
        {required ? " *" : ""}
      </div>

      <div onClick={onTap} style={{ ...inputStyle(), cursor: "pointer" }}>
        {values.length ? values.join(", ") : `Select ${label}`}
      </div>

      {values.length ? (
        <div
          style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {values.map((v) => (
            <span
              key={v}
              style={{
                background: staffari.cardBackground,
                border: "1px solid rgba(123,111,87,0.35)",
                color: staffari.deepJungleGreen,
                padding: "6px 10px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MultiPickerModal({ title, options, selected, onChange, onClose }) {
  const [localSelected, setLocalSelected] = useState(() => new Set(selected));
  const [localOptions, setLocalOptions] = useState(() => options.slice());

  const toggle = (opt) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  const addOther = async () => {
    const v = window.prompt("Add New", "");
    const text = (v || "").trim();
    if (!text) return;

    setLocalOptions((prev) => {
      const list = prev.slice();
      const otherIdx = list.lastIndexOf("Other");
      const idx = otherIdx >= 0 ? otherIdx : list.length;
      list.splice(idx, 0, text);
      return list;
    });

    setLocalSelected((prev) => new Set(prev).add(text));
  };

  const clear = () => setLocalSelected(new Set());

  const done = () => {
    onChange(Array.from(localSelected));
    onClose();
  };

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 9999,
        display: "grid",
        placeItems: "end center",
        padding: 12,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: staffari.cardBackground,
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          maxHeight: "85vh",
          overflow: "auto",
          fontFamily: "Poppins, system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              flex: 1,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
              fontSize: 18,
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: staffari.mutedOlive,
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "grid", gap: 8 }}>
          {localOptions.map((opt) => {
            if (opt === "Other") {
              return (
                <button
                  key="__other__"
                  type="button"
                  onClick={addOther}
                  style={{
                    textAlign: "left",
                    borderRadius: 12,
                    border: "1px dashed rgba(123,111,87,0.55)",
                    background: "#fff",
                    padding: "10px 12px",
                    cursor: "pointer",
                    color: staffari.deepJungleGreen,
                    fontWeight: 800,
                  }}
                >
                  + Add Other
                </button>
              );
            }

            const checked = localSelected.has(opt);
            return (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#fff",
                  border: "1px solid rgba(123,111,87,0.25)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: staffari.emeraldGreen,
                  }}
                />
                <span
                  style={{ color: staffari.charcoalBlack, fontWeight: 700 }}
                >
                  {opt}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={clear}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: "12px 14px",
              cursor: "pointer",
              border: "1px solid rgba(123,111,87,0.35)",
              background: "transparent",
              color: staffari.mutedOlive,
              fontWeight: 900,
            }}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={done}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: "12px 14px",
              cursor: "pointer",
              border: "none",
              background: staffari.emeraldGreen,
              color: "#fff",
              fontWeight: 900,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(123,111,87,0.45)",
    outline: "none",
    background: staffari.cardBackground,
    color: staffari.charcoalBlack,
    fontFamily: "Poppins, system-ui",
    fontWeight: 600,
    boxSizing: "border-box",
  };
}
