import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { fetchJobseekers } from "../../../api/jobseekersApi";

const LIMIT = 20;

const availabilityOptions = [
  "Any",
  "Available Immediately",
  "Available Within 1 Week",
  "Available Within 2 Weeks",
  "Available Within 1 Month",
  "Available After 1 Month",
  "Currently Employed – Open to Offers",
  "Only Available on Weekends",
  "Only Part-Time Available",
  "Not Currently Available",
  "Available Upon Notice Period (e.g., 2 weeks, 1 month)",
  "Others/Specify",
];

const employmentStatusOptions = [
  "Any",
  "Employed",
  "Unemployed",
  "Open to Opportunities",
];

const departmentOptions = [
  "Any",
  "Front Office",
  "Housekeeping",
  "Food & Beverage Service",
  "Bar/Beverage",
  "Culinary/Kitchen",
  "Bakery & Pastry",
  "Banquets/Events",
  "Reservations & Revenue",
  "Sales & Marketing",
  "Spa & Wellness",
  "Security/Loss Prevention",
  "Engineering/Maintenance",
  "IT/Systems",
  "Finance & Accounts",
  "Procurement/Stores",
  "HR/Training",
  "Laundry",
  "Transport/Logistics",
];

function s(v) {
  if (v == null) return null;
  const t = String(v).trim();
  return t ? t : null;
}

function listStr(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}

function openExternal(url) {
  const u = s(url);
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

export default function SearchJobseekersPage() {
  const navigate = useNavigate();
  const listRef = useRef(null);

  const [hotelId, setHotelId] = useState(null);

  const [jobseekers, setJobseekers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);

  // Filters
  const [location, setLocation] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [selectedEmploymentStatus, setSelectedEmploymentStatus] =
    useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const uid = lsGet("uid", null);
    if (!uid) {
      setIsFirstLoad(false);
      alert("Hotel ID not found. Please login again.");
      navigate("/signin", { replace: true });
      return;
    }
    setHotelId(uid);
  }, [navigate]);

  const queryArgs = useMemo(() => {
    if (!hotelId) return null;
    return {
      hotelId,
      page: 1,
      limit: LIMIT,
      location,
      availability: selectedAvailability,
      employmentStatus: selectedEmploymentStatus,
      department: selectedDepartment,
    };
  }, [
    hotelId,
    location,
    selectedAvailability,
    selectedEmploymentStatus,
    selectedDepartment,
  ]);

  const loadFirstPage = async () => {
    if (!hotelId) return;

    setIsFirstLoad(true);
    setIsLoadingMore(false);
    setError(null);
    setJobseekers([]);
    setPage(1);
    setHasMore(true);
    setTotalMatching(0);

    try {
      const data = await fetchJobseekers({
        hotelId,
        page: 1,
        limit: LIMIT,
        location,
        availability: selectedAvailability,
        employmentStatus: selectedEmploymentStatus,
        department: selectedDepartment,
      });

      setJobseekers(Array.isArray(data?.jobseekers) ? data.jobseekers : []);
      setHasMore(data?.has_more === true);
      setTotalMatching(Number(data?.total_matching ?? 0) || 0);
    } catch (e) {
      setError(e);
    } finally {
      setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    if (!queryArgs) return;
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryArgs]);

  const loadNextPageIfNeeded = async () => {
    if (isFirstLoad || isLoadingMore || !hasMore || error || !hotelId) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchJobseekers({
        hotelId,
        page: nextPage,
        limit: LIMIT,
        location,
        availability: selectedAvailability,
        employmentStatus: selectedEmploymentStatus,
        department: selectedDepartment,
      });

      setJobseekers((prev) =>
        prev.concat(Array.isArray(data?.jobseekers) ? data.jobseekers : []),
      );
      setHasMore(data?.has_more === true);
      setPage(nextPage);
      setTotalMatching((prev) => Number(data?.total_matching ?? prev) || prev);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    const threshold = 250;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      loadNextPageIfNeeded();
    }
  };

  const clearFilters = () => {
    setLocation("");
    setSelectedAvailability(null);
    setSelectedEmploymentStatus(null);
    setSelectedDepartment(null);
  };

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        background: staffari.cardBackground,
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.18)",
        overflow: "hidden",
        fontFamily: "Poppins, system-ui",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px 12px",
          borderBottom: "1px solid rgba(123,111,87,0.14)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: staffari.cardBackground,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 28,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
            }}
          >
            Search Talent
          </div>
          {!isFirstLoad && totalMatching > 0 ? (
            <div
              style={{
                marginTop: 4,
                color: staffari.mutedOlive,
                fontWeight: 700,
              }}
            >
              {totalMatching} found
            </div>
          ) : null}
        </div>

        <button
          onClick={() => setFilterOpen(true)}
          style={iconBtn()}
          title="Filters"
        >
          ⛭
        </button>

        <button onClick={loadFirstPage} style={iconBtn()} title="Refresh">
          ↻
        </button>
      </div>

      {/* List */}
      <div
        ref={listRef}
        onScroll={onScroll}
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          background: staffari.cardBackground,
        }}
      >
        {isFirstLoad ? (
          <ShimmerList />
        ) : error && jobseekers.length === 0 ? (
          <ErrorState error={error} onRetry={loadFirstPage} />
        ) : jobseekers.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {jobseekers.map((seeker, idx) => (
              <JobseekerCard
                key={(seeker?.id ?? seeker?.uid ?? idx) + ""}
                seeker={seeker}
                onOpenProfile={(id) => navigate(`/applicant/${id}`)} // change route if needed
              />
            ))}

            {isLoadingMore ? (
              <div
                style={{
                  padding: "12px 0",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2.5px solid rgba(25,95,78,0.25)",
                    borderTopColor: staffari.emeraldGreen,
                    animation: "spin 1s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg);} }`}</style>
              </div>
            ) : (
              <div style={{ height: 24 }} />
            )}
          </>
        )}
      </div>

      {/* Filter sheet */}
      {filterOpen ? (
        <FilterSheet
          initial={{
            location,
            availability: selectedAvailability,
            employmentStatus: selectedEmploymentStatus,
            department: selectedDepartment,
          }}
          onClose={() => setFilterOpen(false)}
          onClear={() => {
            setFilterOpen(false);
            clearFilters();
          }}
          onApply={(v) => {
            setFilterOpen(false);
            setLocation(v.location);
            setSelectedAvailability(v.availability);
            setSelectedEmploymentStatus(v.employmentStatus);
            setSelectedDepartment(v.department);
          }}
        />
      ) : null}
    </div>
  );
}

function JobseekerCard({ seeker, onOpenProfile }) {
  const id = s(seeker?.id);
  const name = s(seeker?.fullName) || "Unknown";
  const headline = s(seeker?.headline) || "No headline";
  const department = s(seeker?.department) || "N/A";
  const expYears = seeker?.experience_years ?? 0;

  const location = s(seeker?.location) || "N/A";
  const availability = s(seeker?.availability) || "N/A";
  const status = s(seeker?.employment_status) || "N/A";

  const profilePic = s(seeker?.profile_pic_url);
  const resumeUrl = s(seeker?.resume_url);
  const email = s(seeker?.contact_email);
  const phone = s(seeker?.phone_number) || s(seeker?.phone);
  const state = s(seeker?.state);
  const updatedAt = s(seeker?.updated_at);
  const verified = seeker?.isEmailVerified === true;

  const skills = listStr(seeker?.skills);
  const languages = listStr(seeker?.languages);

  // “Future fields” from your Flutter UI
  const banner = s(seeker?.banner_image_url);
  const videoCvUrl = s(seeker?.video_cv_url);
  const pitScore = seeker?.["PIT-Medium-score"];
  const linkedin = s(seeker?.linkedin_profile);
  const portfolio = s(seeker?.portfolio);
  const qualifications = s(seeker?.qualifications);
  const college = s(seeker?.college_name);
  const passout =
    seeker?.year_of_passout != null ? String(seeker.year_of_passout) : null;
  const grade = s(seeker?.grade);
  const preferredCategories = listStr(seeker?.preferred_categories);
  const certifications = listStr(seeker?.certifications);

  const [open, setOpen] = useState(false);

  const infoRow = (label, value) => {
    if (!value) return null;
    return (
      <div style={{ marginBottom: 8, lineHeight: 1.35 }}>
        <span style={{ color: staffari.mutedOlive, fontWeight: 800 }}>
          {label}:{" "}
        </span>
        <span style={{ color: staffari.charcoalBlack, fontWeight: 700 }}>
          {value}
        </span>
      </div>
    );
  };

  const chips = (title, items) => {
    if (!items?.length) return null;
    return (
      <div style={{ marginTop: 10 }}>
        <div
          style={{ fontSize: 13, color: staffari.mutedOlive, fontWeight: 800 }}
        >
          {title}
        </div>
        <div
          style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {items.map((x) => (
            <span key={x} style={chipStyle()}>
              {x}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        marginBottom: 16,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.20)",
        overflow: "hidden",
      }}
    >
      {banner ? (
        <img
          src={banner}
          alt=""
          style={{
            height: 120,
            width: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : null}

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(25,95,78,0.15)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
            }}
          >
            {profilePic ? (
              <img
                src={profilePic}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ color: staffari.deepJungleGreen, fontWeight: 900 }}
              >
                👤
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "Space Grotesk, system-ui",
                fontSize: 20,
                fontWeight: 900,
                color: staffari.deepJungleGreen,
              }}
            >
              {name}
            </div>
            <div
              style={{
                marginTop: 4,
                color: staffari.mutedOlive,
                fontWeight: 700,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                marginTop: 6,
                color: staffari.charcoalBlack,
                fontWeight: 700,
              }}
            >
              {department} • {expYears} years
            </div>
          </div>

          {verified ? (
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(22,163,74,0.12)",
                color: "rgb(20,83,45)",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              Verified
            </div>
          ) : null}
        </div>

        <div style={{ height: 14 }} />
        {infoRow("Location", location)}
        {infoRow("Availability", availability)}
        {infoRow("Status", status)}
        {pitScore != null ? infoRow("PIT Score", String(pitScore)) : null}

        {chips("Skills", skills)}
        {chips("Languages", languages)}

        <div style={{ height: 10 }} />

        <button onClick={() => setOpen((v) => !v)} style={moreBtn()}>
          {open ? "Hide details" : "More details"}
        </button>

        {open ? (
          <div style={{ marginTop: 12 }}>
            {email ? infoRow("Email", email) : null}
            {phone ? infoRow("Phone", phone) : null}
            {state ? infoRow("State", state) : null}
            {updatedAt ? infoRow("Updated", updatedAt) : null}

            {qualifications ? infoRow("Qualifications", qualifications) : null}
            {college ? infoRow("College", college) : null}
            {passout ? infoRow("Year of passout", passout) : null}
            {grade ? infoRow("Grade", grade) : null}
            {linkedin ? infoRow("LinkedIn", linkedin) : null}
            {portfolio ? infoRow("Portfolio", portfolio) : null}

            {chips("Preferred categories", preferredCategories)}
            {chips("Certifications", certifications)}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {resumeUrl ? (
                <button
                  onClick={() => openExternal(resumeUrl)}
                  style={outlineActionBtn()}
                >
                  Resume
                </button>
              ) : null}

              {videoCvUrl ? (
                <button
                  onClick={() => openExternal(videoCvUrl)}
                  style={outlineActionBtn()}
                >
                  Video CV
                </button>
              ) : null}

              {id ? (
                <button
                  onClick={() => onOpenProfile(id)}
                  style={primaryActionBtn()}
                >
                  Open Profile
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterSheet({ initial, onClose, onClear, onApply }) {
  const [tempLocation, setTempLocation] = useState(initial.location ?? "");
  const [tempAvailability, setTempAvailability] = useState(
    initial.availability ?? null,
  );
  const [tempEmployment, setTempEmployment] = useState(
    initial.employmentStatus ?? null,
  );
  const [tempDepartment, setTempDepartment] = useState(
    initial.department ?? null,
  );

  return (
    <div onClick={onClose} style={sheetBackdrop()}>
      <div onClick={(e) => e.stopPropagation()} style={sheet()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 18,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
            }}
          >
            Search Filters
          </div>
          <div style={{ marginLeft: "auto" }} />
          <button onClick={onClose} style={iconBtn()} title="Close">
            ✕
          </button>
        </div>

        <div style={{ height: 12 }} />

        <div style={fieldWrap()}>
          <div style={label()}>Location (City/State)</div>
          <input
            value={tempLocation}
            onChange={(e) => setTempLocation(e.target.value)}
            style={input()}
            placeholder="Any"
          />
        </div>

        <div style={fieldWrap()}>
          <div style={label()}>Availability</div>
          <select
            value={tempAvailability ?? "Any"}
            onChange={(e) =>
              setTempAvailability(
                e.target.value === "Any" ? null : e.target.value,
              )
            }
            style={input()}
          >
            {availabilityOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldWrap()}>
          <div style={label()}>Employment Status</div>
          <select
            value={tempEmployment ?? "Any"}
            onChange={(e) =>
              setTempEmployment(
                e.target.value === "Any" ? null : e.target.value,
              )
            }
            style={input()}
          >
            {employmentStatusOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldWrap()}>
          <div style={label()}>Department</div>
          <select
            value={tempDepartment ?? "Any"}
            onChange={(e) =>
              setTempDepartment(
                e.target.value === "Any" ? null : e.target.value,
              )
            }
            style={input()}
          >
            {departmentOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <button onClick={onClear} style={outlineActionBtn()}>
            Clear
          </button>
          <button
            onClick={() =>
              onApply({
                location: tempLocation,
                availability: tempAvailability,
                employmentStatus: tempEmployment,
                department: tempDepartment,
              })
            }
            style={primaryActionBtn()}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- small UI helpers ---- */

function ShimmerList() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 180,
            marginBottom: 16,
            borderRadius: 16,
            background:
              "linear-gradient(90deg, rgba(230,230,230,1) 25%, rgba(250,250,250,1) 50%, rgba(230,230,230,1) 75%)",
            backgroundSize: "400% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:100% 0;} 100%{background-position:0 0;} }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ minHeight: "55vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, color: staffari.mutedOlive }}>⌕</div>
        <div
          style={{
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 22,
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          No Candidates Found
        </div>
        <div
          style={{ marginTop: 8, color: staffari.mutedOlive, fontWeight: 700 }}
        >
          Try adjusting your filters.
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ minHeight: "55vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 64, color: "rgb(220,38,38)" }}>!</div>
        <div
          style={{
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 22,
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          Something Went Wrong
        </div>
        <div
          style={{ marginTop: 8, color: staffari.mutedOlive, fontWeight: 700 }}
        >
          {String(error?.message || error || "Unknown error")}
        </div>
        <div style={{ marginTop: 14 }}>
          <button onClick={onRetry} style={primaryActionBtn()}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function iconBtn() {
  return {
    border: "1px solid rgba(123,111,87,0.25)",
    background: "#fff",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
    color: staffari.deepJungleGreen,
  };
}

function input() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(123,111,87,0.25)",
    outline: "none",
    background: "#fff",
    fontFamily: "Poppins, system-ui",
    fontWeight: 700,
    boxSizing: "border-box",
  };
}

function label() {
  return { color: staffari.mutedOlive, fontWeight: 900, marginBottom: 6 };
}

function fieldWrap() {
  return { marginTop: 12 };
}

function chipStyle() {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(25,95,78,0.10)",
    border: "1px solid rgba(25,95,78,0.25)",
    color: staffari.deepJungleGreen,
    fontWeight: 900,
    fontSize: 12,
  };
}

function moreBtn() {
  return {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: staffari.deepJungleGreen,
    fontWeight: 900,
    padding: 0,
    textDecoration: "underline",
  };
}

function primaryActionBtn() {
  return {
    background: staffari.emeraldGreen,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function outlineActionBtn() {
  return {
    background: "#fff",
    color: staffari.deepJungleGreen,
    border: "1px solid rgba(123,111,87,0.35)",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function sheetBackdrop() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 3000,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 12,
  };
}

function sheet() {
  return {
    width: "min(720px, 100%)",
    background: staffari.cardBackground,
    borderRadius: 18,
    border: "1px solid rgba(123,111,87,0.22)",
    padding: 16,
  };
}
