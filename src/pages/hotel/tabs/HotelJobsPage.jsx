import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { fetchHotelJobs } from "../../../api/jobCrudApi";
import JobCard from "../shared/JobCard";
import JobDetailsSheet from "../shared/JobDetailsSheet";
import { JobPostMode } from "../jobs/jobPostMode";

export default function HotelJobsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // start true (no setState needed inside effect)
  const [error, setError] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchHotelJobs();
      setJobs(list);
    } catch (e) {
      setError(e);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetails = (job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const openMatchingProfiles = (job) => {
    const jobId = (job?.id ?? job?.job_id ?? job?.jobId ?? "").toString();
    if (!jobId.trim()) {
      alert("Job ID missing in job object");
      return;
    }

    navigate(`/hotel/jobs/${encodeURIComponent(jobId)}/matching`, {
      state: {
        jobId,
        jobTitle: (job?.title ?? job?.job_title ?? "").toString() || null,
      },
    });
  };

  const goToPostForm = (mode) => {
    navigate("/hotel/jobs/post", { state: { mode } });
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        background: staffari.cardBackground,
      }}
    >
      <div style={{ padding: "20px 20px 12px" }}>
        <div
          style={{
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 32,
            fontWeight: 800,
            color: staffari.deepJungleGreen,
          }}
        >
          Your Job Postings
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <button
          onClick={load}
          style={{
            border: "1px solid rgba(123,111,87,0.35)",
            background: "#fff",
            color: staffari.deepJungleGreen,
            borderRadius: 14,
            padding: "10px 14px",
            cursor: "pointer",
            fontFamily: "Poppins, system-ui",
            fontWeight: 800,
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ padding: 16, paddingBottom: 120 }}>
        {isLoading ? (
          <ShimmerList />
        ) : error ? (
          <ErrorWidget error={error} />
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {jobs.map((job, idx) => {
              const key = job?.id ?? job?._id ?? job?.job_id ?? idx;
              return (
                <div key={String(key)} style={{ marginBottom: 16 }}>
                  <JobCard
                    job={job}
                    onTap={() => openDetails(job)}
                    showLikeButton={false}
                  />

                  <div style={{ height: 10 }} />

                  <button
                    onClick={() => openMatchingProfiles(job)}
                    style={{
                      width: "100%",
                      height: 46,
                      borderRadius: 14,
                      border: "none",
                      background: staffari.deepJungleGreen,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "Poppins, system-ui",
                      fontWeight: 700,
                    }}
                  >
                    See matching profiles
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <JobDetailsSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        job={selectedJob ? { ...selectedJob, hideApplyButton: true } : null}
        onSaved={() => load()}
      />

      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 78,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 50,
        }}
      >
        <FabExtended
          bg={staffari.deepJungleGreen}
          label="Quick Post"
          onClick={() => goToPostForm(JobPostMode.quick)}
        />
        <FabExtended
          bg={staffari.emeraldGreen}
          label="Post Job"
          onClick={() => goToPostForm(JobPostMode.full)}
        />
      </div>
    </div>
  );
}

function FabExtended({ bg, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: bg,
        color: "#fff",
        borderRadius: 999,
        padding: "12px 16px",
        cursor: "pointer",
        fontFamily: "Poppins, system-ui",
        fontWeight: 900,
        boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
      }}
    >
      {label}
    </button>
  );
}

function ShimmerList() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 150,
            marginBottom: 16,
            borderRadius: 16,
            background:
              "linear-gradient(90deg, rgba(240,240,240,1) 25%, rgba(255,255,255,1) 50%, rgba(240,240,240,1) 75%)",
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
    <div style={{ textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 64, color: staffari.mutedOlive }}>📝</div>
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
        Tap the "Post Job" button to find your next great hire!
      </div>
    </div>
  );
}

function ErrorWidget({ error }) {
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
    </div>
  );
}
