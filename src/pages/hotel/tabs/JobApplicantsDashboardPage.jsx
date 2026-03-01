import React, { useEffect, useMemo, useRef, useState } from "react";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { fetchActiveJobsSummary } from "../../../api/hotelApplicantsApi";
import { useNavigate } from "react-router-dom";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const departmentRoles = {
  "Front Office": [
    "Front Office Associate",
    "Guest Relations Executive",
    "Front Office Supervisor",
    "Front Office Manager",
    "Night Duty Manager",
    "Concierge",
  ],
  Housekeeping: [
    "Housekeeping Attendant",
    "Public Area Attendant",
    "Laundry Attendant",
    "Housekeeping Supervisor",
    "Executive Housekeeper",
  ],
  "Food & Beverage Service": [
    "Restaurant Server",
    "Host/Hostess",
    "Room Service Associate",
    "Restaurant Supervisor",
    "Restaurant Manager",
  ],
  "Bar/Beverage": [
    "Bar Back",
    "Bartender",
    "Bar Supervisor",
    "Beverage Manager",
  ],
  "Culinary/Kitchen": [
    "Commis",
    "Demi Chef de Partie",
    "Chef de Partie",
    "Sous Chef",
    "Executive Chef",
  ],
  "Bakery & Pastry": [
    "Bakery Commis",
    "Pastry Commis",
    "Pastry Chef de Partie",
    "Pastry Sous Chef",
    "Head Pastry Chef",
  ],
  "Banquets/Events": [
    "Banquet Server",
    "Banquet Captain",
    "Banquet Supervisor",
    "Banquet Manager",
  ],
  "Reservations & Revenue": [
    "Reservations Agent",
    "Reservations Supervisor",
    "Revenue Analyst",
    "Revenue Manager",
  ],
  "Sales & Marketing": [
    "Sales Coordinator",
    "Sales Executive",
    "Sales Manager",
    "Marketing Executive",
  ],
  "Spa & Wellness": [
    "Spa Receptionist",
    "Spa Therapist",
    "Spa Supervisor",
    "Spa Manager",
  ],
  "Security/Loss Prevention": [
    "Security Officer",
    "Security Supervisor",
    "Loss Prevention Manager",
  ],
  "Engineering/Maintenance": [
    "Maintenance Technician",
    "HVAC Technician",
    "Engineering Supervisor",
    "Chief Engineer",
  ],
  "IT/Systems": ["IT Support", "IT Executive", "Systems Administrator"],
  "Finance & Accounts": [
    "Accounts Payable Executive",
    "Accounts Receivable Executive",
    "Income Auditor",
    "Assistant Finance Manager",
  ],
  "Procurement/Stores": [
    "Storekeeper",
    "Purchasing Executive",
    "Purchasing Manager",
  ],
  "HR/Training": ["HR Executive", "Training Coordinator", "HR Manager"],
  Laundry: ["Laundry Attendant", "Laundry Supervisor"],
  "Transport/Logistics": ["Driver", "Transport Coordinator"],
};

export default function JobApplicantsDashboardPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [totalApplicants, setTotalApplicants] = useState(0);
  const [totalAccepted, setTotalAccepted] = useState(0);
  const [totalPendingOrRejected, setTotalPendingOrRejected] = useState(0);

  const [department, setDepartment] = useState(null);
  const [location, setLocation] = useState(null);
  const [includeExpired, setIncludeExpired] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterModalKey, setFilterModalKey] = useState(0);

  // Used to re-fetch on Retry even if filters are unchanged
  const [reloadTick, setReloadTick] = useState(0);

  const scrollRef = useRef(null);

  const deptItems = useMemo(
    () => Object.keys(departmentRoles).slice().sort(),
    [],
  );
  const stateItems = useMemo(() => indianStates.slice().sort(), []);

  const normalizeJobs = (jobs) => {
    const list = Array.isArray(jobs) ? jobs : [];
    return list.map((job) => {
      const applicantCount =
        Number(job?.applicants_count ?? 0) ||
        parseInt(String(job?.applicants_count ?? "0"), 10) ||
        0;
      return { jobData: job, applicantCount };
    });
  };

  // Effect does ONLY the async fetch + state updates AFTER await.
  // No synchronous "reset" setState calls here => no lint warning.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchActiveJobsSummary({
          page: 1,
          limit,
          includeExpired,
          department,
          location,
        });

        if (cancelled) return;

        setItems(normalizeJobs(result.jobs));
        setHasMore(!!result.hasMore);
        setPage(1);

        setTotalApplicants(result.totalApplicants);
        setTotalAccepted(result.totalAccepted);
        setTotalPendingOrRejected(result.totalPendingOrRejected);

        setError(null);
      } catch (e) {
        if (cancelled) return;

        setError(e);
        setItems([]);
        setHasMore(true);
        setPage(1);

        setTotalApplicants(0);
        setTotalAccepted(0);
        setTotalPendingOrRejected(0);
      } finally {
        if (cancelled);
        setIsFirstLoad(false);
        setIsLoadingMore(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, location, includeExpired, reloadTick]);

  const loadNextPageIfNeeded = async () => {
    if (isFirstLoad) return;
    if (isLoadingMore) return;
    if (!hasMore) return;
    if (error && items.length === 0) return;

    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await fetchActiveJobsSummary({
        page: nextPage,
        limit,
        includeExpired,
        department,
        location,
      });

      setPage(nextPage);
      setItems((prev) => prev.concat(normalizeJobs(result.jobs)));
      setHasMore(!!result.hasMore);

      setTotalApplicants(result.totalApplicants);
      setTotalAccepted(result.totalAccepted);
      setTotalPendingOrRejected(result.totalPendingOrRejected);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 250;
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - threshold) {
        loadNextPageIfNeeded();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLoad, isLoadingMore, hasMore, page, error, items.length]);

  const hotelId = lsGet("uid", null);

  const openJob = (item) => {
    const jobId =
      item?.jobData?.id ?? item?.jobData?.jobid ?? item?.jobData?._id;
    navigate(`/hotel/applications/${encodeURIComponent(String(jobId || ""))}`, {
      state: { selectedJobData: item },
    });
  };

  const openFilters = () => {
    setFilterModalKey((k) => k + 1); // remount modal so it initializes from latest "initial"
    setIsFilterOpen(true);
  };

  const clearFilters = () => {
    // Reset happens in handler (NOT in effect)
    setDepartment(null);
    setLocation(null);
    setIncludeExpired(true);

    setIsFilterOpen(false);

    setIsFirstLoad(true);
    setIsLoadingMore(false);
    setError(null);
    setItems([]);
    setHasMore(true);
    setPage(1);
    setTotalApplicants(0);
    setTotalAccepted(0);
    setTotalPendingOrRejected(0);

    setReloadTick((t) => t + 1);
  };

  const applyFilters = ({ department: d, location: l, includeExpired: ie }) => {
    setDepartment(d || null);
    setLocation(l || null);
    setIncludeExpired(!!ie);

    setIsFilterOpen(false);

    setIsFirstLoad(true);
    setIsLoadingMore(false);
    setError(null);
    setItems([]);
    setHasMore(true);
    setPage(1);
    setTotalApplicants(0);
    setTotalAccepted(0);
    setTotalPendingOrRejected(0);

    setReloadTick((t) => t + 1);
  };

  const retry = () => {
    setIsFirstLoad(true);
    setIsLoadingMore(false);
    setError(null);
    setItems([]);
    setHasMore(true);
    setPage(1);
    setTotalApplicants(0);
    setTotalAccepted(0);
    setTotalPendingOrRejected(0);

    setReloadTick((t) => t + 1);
  };

  return (
    <div style={{ background: staffari.cardBackground, minHeight: 520 }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 32,
              fontWeight: 800,
              color: staffari.deepJungleGreen,
              lineHeight: 1.1,
            }}
          >
            Job Postings
          </div>
        </div>

        <button
          type="button"
          title="Filters"
          onClick={openFilters}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: staffari.deepJungleGreen,
            fontSize: 18,
            padding: 10,
            borderRadius: 12,
          }}
        >
          🎛️
        </button>
      </div>

      {/* Totals */}
      {!isFirstLoad && (
        <div style={{ padding: "0 16px 12px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <StatCard
              title="Applicants"
              value={String(totalApplicants)}
              icon="👥"
            />
            <StatCard
              title="Accepted"
              value={String(totalAccepted)}
              icon="✅"
            />
            <StatCard
              title="Pending/Rejected"
              value={String(totalPendingOrRejected)}
              icon="⏳"
            />
          </div>
        </div>
      )}

      {/* List area */}
      <div
        ref={scrollRef}
        style={{ height: 560, overflow: "auto", padding: 16 }}
      >
        {isFirstLoad ? (
          <ShimmerList />
        ) : error && items.length === 0 ? (
          <ErrorWidget error={error} onRetry={retry} />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {items.map((it, idx) => (
              <JobCard
                key={it?.jobData?.id || it?.jobData?._id || idx}
                item={it}
                onOpen={() => openJob(it)}
              />
            ))}

            {isLoadingMore && (
              <div
                style={{
                  padding: "16px 0",
                  textAlign: "center",
                  color: staffari.emeraldGreen,
                  fontWeight: 800,
                }}
              >
                Loading more...
              </div>
            )}

            {!hasMore && <div style={{ height: 24 }} />}
          </>
        )}
      </div>

      {/* IMPORTANT: mount/unmount modal (no useEffect inside modal needed) */}
      {isFilterOpen ? (
        <FilterModal
          key={filterModalKey}
          onClose={() => setIsFilterOpen(false)}
          deptItems={deptItems}
          stateItems={stateItems}
          initial={{ department, location, includeExpired }}
          onClear={clearFilters}
          onApply={applyFilters}
          disabled={!hotelId}
        />
      ) : null}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgb(96,93,93)",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div style={{ height: 12 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 18 }}>{icon}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#111" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function JobCard({ item, onOpen }) {
  const job = item?.jobData || {};
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.2)",
        padding: 20,
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 20,
            fontWeight: 800,
            color: staffari.deepJungleGreen,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {job?.title ?? "No Title"}
        </div>
        <div style={{ height: 8 }} />
        <div
          style={{
            fontFamily: "Poppins, system-ui",
            fontSize: 16,
            color: staffari.charcoalBlack,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {job?.company ?? "No Company"}
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, color: staffari.emeraldGreen }}>👥</div>
        <div style={{ height: 4 }} />
        <div
          style={{
            fontFamily: "Poppins, system-ui",
            fontSize: 20,
            fontWeight: 900,
            color: staffari.emeraldGreen,
          }}
        >
          {String(item?.applicantCount ?? 0)}
        </div>
      </div>
    </div>
  );
}

function ShimmerList() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 100,
            marginBottom: 16,
            borderRadius: 16,
            background:
              "linear-gradient(90deg, rgba(240,240,240,1) 25%, rgba(255,255,255,1) 50%, rgba(240,240,240,1) 75%)",
            backgroundSize: "400% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 64, color: staffari.mutedOlive }}>🧰</div>
      <div style={{ height: 12 }} />
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 22,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        No Jobs Posted Yet
      </div>
      <div style={{ height: 8 }} />
      <div
        style={{
          fontFamily: "Poppins, system-ui",
          fontSize: 16,
          color: staffari.mutedOlive,
        }}
      >
        Post a job to start finding talent.
      </div>
    </div>
  );
}

function ErrorWidget({ error, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 64, color: "#E53935" }}>⚠️</div>
      <div style={{ height: 12 }} />
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
      <div style={{ height: 8 }} />
      <div
        style={{
          fontFamily: "Poppins, system-ui",
          fontSize: 14,
          color: staffari.mutedOlive,
        }}
      >
        {String(error?.message || error || "Unknown error")}
      </div>
      <div style={{ height: 14 }} />
      <button
        onClick={onRetry}
        style={{
          background: staffari.emeraldGreen,
          color: "#fff",
          border: "none",
          padding: "10px 14px",
          borderRadius: 14,
          cursor: "pointer",
          fontFamily: "Poppins, system-ui",
          fontWeight: 800,
        }}
      >
        Retry
      </button>
    </div>
  );
}

function FilterModal({
  onClose,
  deptItems,
  stateItems,
  initial,
  onClear,
  onApply,
  disabled,
}) {
  // No useEffect needed: this component mounts fresh each time you open it (key={filterModalKey})
  const [dept, setDept] = useState(initial.department || "");
  const [state, setState] = useState(initial.location || "");
  const [includeExpired, setIncludeExpired] = useState(
    !!initial.includeExpired,
  );

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
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              flex: 1,
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 20,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
            }}
          >
            Filters
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
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ height: 12 }} />

        <label
          style={{
            display: "block",
            fontFamily: "Poppins, system-ui",
            color: staffari.mutedOlive,
            fontWeight: 700,
          }}
        >
          Department
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            style={selectStyle()}
          >
            <option value="">Select department</option>
            {deptItems.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <div style={{ height: 12 }} />

        <label
          style={{
            display: "block",
            fontFamily: "Poppins, system-ui",
            color: staffari.mutedOlive,
            fontWeight: 700,
          }}
        >
          Location (State/UT)
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={selectStyle()}
          >
            <option value="">Select location</option>
            {stateItems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div style={{ height: 8 }} />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Poppins, system-ui",
            color: staffari.charcoalBlack,
            fontWeight: 700,
          }}
        >
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              accentColor: staffari.emeraldGreen,
            }}
          />
          Include expired
        </label>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            disabled={disabled}
            onClick={onClear}
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: disabled ? "not-allowed" : "pointer",
              border: "1px solid rgba(123,111,87,0.35)",
              background: "transparent",
              color: staffari.deepJungleGreen,
              fontFamily: "Poppins, system-ui",
              fontWeight: 800,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Clear
          </button>

          <button
            disabled={disabled}
            onClick={() =>
              onApply({
                department: dept || null,
                location: state || null,
                includeExpired,
              })
            }
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: disabled ? "not-allowed" : "pointer",
              border: "none",
              background: staffari.emeraldGreen,
              color: "#fff",
              fontFamily: "Poppins, system-ui",
              fontWeight: 900,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function selectStyle() {
  return {
    width: "100%",
    marginTop: 6,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(123,111,87,0.25)",
    outline: "none",
    background: "#fff",
    color: staffari.charcoalBlack,
    fontFamily: "Poppins, system-ui",
    fontWeight: 600,
  };
}
