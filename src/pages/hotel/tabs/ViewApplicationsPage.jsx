// src/pages/hotel/ViewApplicationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import {
  bulkUpdateApplicationStatus,
  fetchJobApplicants,
  updateApplicationStatus,
} from "../../../api/hotelApplicantsApi";
import { createConversation } from "../../../api/chatApi";

const STATUS_MENU = [
  "Interview Scheduled",
  //   "Viewed",
  "Accepted",
  "Rejected",
  "Pending",
];

function statusInfo(statusRaw) {
  const s = String(statusRaw || "pending").toLowerCase();

  if (s.includes("accepted") || s.includes("hired")) {
    return { text: "Accepted", color: staffari.emeraldGreen, bg: "#E8F5E9" };
  }
  if (s.includes("interview")) {
    return { text: "Interview", color: "#1565C0", bg: "#E3F2FD" };
  }
  if (s.includes("rejected")) {
    return { text: "Rejected", color: "#C62828", bg: "#FFEBEE" };
  }
  //   if (s.includes("viewed")) {
  //     return { text: "Viewed", color: "#6A1B9A", bg: "#F3E5F5" };
  //   }
  return { text: "Pending", color: "#FF8F00", bg: "#FFF8E1" };
}

function shouldShowChatButton(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  return (
    s.includes("interview") ||
    s.includes("accepted") ||
    s.includes("pending") ||
    // s.includes("viewed") ||
    s.includes("hired")
  );
}

export default function ViewApplicationsPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const location = useLocation();

  const hotelOwnerId = lsGet("uid", null);

  const selectedJobData = location.state?.selectedJobData || null;
  const jobData = selectedJobData?.jobData || {};
  const title = jobData?.title || "Job";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [applicants, setApplicants] = useState([]);
  const [updatingStatusFor, setUpdatingStatusFor] = useState(() => new Set());
  const [isCreatingChatFor, setIsCreatingChatFor] = useState(() => new Set());

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState(
    () => new Set(),
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const allSelected = useMemo(() => {
    return (
      applicants.length > 0 && selectedApplicantIds.size === applicants.length
    );
  }, [applicants.length, selectedApplicantIds]);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!hotelOwnerId) throw new Error("Hotel owner not logged in.");
      const list = await fetchJobApplicants({ hotelOwnerId, jobId });
      setApplicants(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const toggleSelectionMode = () => {
    if (isBulkUpdating) return;
    setIsSelectionMode((v) => !v);
    setSelectedApplicantIds(new Set());
  };

  const toggleSelectAll = () => {
    if (isBulkUpdating) return;
    setSelectedApplicantIds(() => {
      if (allSelected) return new Set();
      const next = new Set();
      applicants.forEach((a) => {
        const id = String(a?.userid ?? a?.user_id ?? "");
        if (id) next.add(id);
      });
      return next;
    });
  };

  const toggleSelected = (applicantUserId) => {
    if (isBulkUpdating) return;
    setSelectedApplicantIds((prev) => {
      const next = new Set(prev);
      if (next.has(applicantUserId)) next.delete(applicantUserId);
      else next.add(applicantUserId);
      return next;
    });
  };

  const doUpdateStatus = async (applicantUserId, newStatus) => {
    setUpdatingStatusFor((prev) => new Set(prev).add(applicantUserId));

    try {
      await updateApplicationStatus({
        hotelOwnerId,
        jobId,
        userId: applicantUserId,
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((a) => {
          const id = String(a?.userid ?? a?.user_id ?? "");
          if (id !== applicantUserId) return a;
          return { ...a, status: newStatus };
        }),
      );
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setUpdatingStatusFor((prev) => {
        const next = new Set(prev);
        next.delete(applicantUserId);
        return next;
      });
    }
  };

  const doBulkUpdate = async (newStatus) => {
    if (selectedApplicantIds.size === 0) {
      alert("Select at least one applicant.");
      return;
    }

    setIsBulkUpdating(true);
    try {
      await bulkUpdateApplicationStatus({
        hotelOwnerId,
        jobId,
        updates: Array.from(selectedApplicantIds).map((id) => ({
          userid: id,
          status: newStatus,
        })),
      });

      setApplicants((prev) =>
        prev.map((a) => {
          const id = String(a?.userid ?? a?.user_id ?? "");
          if (!selectedApplicantIds.has(id)) return a;
          return { ...a, status: newStatus };
        }),
      );

      setSelectedApplicantIds(new Set());
      setIsSelectionMode(false);
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openChatForApplicant = async (applicant) => {
    if (isSelectionMode) return;

    try {
      if (!hotelOwnerId) throw new Error("Hotel owner not logged in.");
      const jobSeekerId = String(applicant?.userid ?? applicant?.user_id ?? "");
      if (!jobSeekerId) return;

      setIsCreatingChatFor((prev) => new Set(prev).add(jobSeekerId));

      const conversationId = await createConversation({
        hotelOwnerId,
        jobSeekerId,
      });
      if (!conversationId) throw new Error("Failed to start chat");

      // Route placeholder: implement your ChatScreen web later
      navigate("/hotel/chats", {
        state: {
          conversationId,
          hotelOwnerId,
          jobSeekerId,
          jobTitle: title,
          company: jobData?.company || "Company",
        },
      });
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      const jobSeekerId = String(applicant?.userid ?? applicant?.user_id ?? "");
      setIsCreatingChatFor((prev) => {
        const next = new Set(prev);
        next.delete(jobSeekerId);
        return next;
      });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      {/* AppBar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: staffari.deepJungleGreen,
          color: "#fff",
          padding: "10px 14px",
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
            padding: 8,
            borderRadius: 10,
            fontSize: 16,
          }}
          title="Back"
        >
          ←
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "Poppins, system-ui",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            Job Applicants
          </div>
          <div
            style={{
              fontFamily: "Poppins, system-ui",
              opacity: 0.8,
              fontSize: 13,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        </div>

        <button
          onClick={toggleSelectionMode}
          style={topBtnStyle()}
          title={isSelectionMode ? "Cancel selection" : "Select"}
          disabled={isBulkUpdating}
        >
          {isSelectionMode ? "✕" : "✓"}
        </button>

        {isSelectionMode && (
          <button
            onClick={toggleSelectAll}
            style={topBtnStyle()}
            title={allSelected ? "Unselect all" : "Select all"}
            disabled={isBulkUpdating}
          >
            {allSelected ? "◻" : "▣"}
          </button>
        )}

        {isSelectionMode && (
          <select
            disabled={isBulkUpdating}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              e.target.value = "";
              doBulkUpdate(v);
            }}
            style={{
              borderRadius: 10,
              padding: "8px 10px",
              border: "none",
              outline: "none",
              fontFamily: "Poppins, system-ui",
              fontWeight: 800,
              cursor: isBulkUpdating ? "not-allowed" : "pointer",
            }}
            title="Bulk edit status"
          >
            <option value="">Edit</option>
            {STATUS_MENU.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        {isLoading ? (
          <ShimmerApplicants />
        ) : error ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontFamily: "Poppins, system-ui",
              color: staffari.mutedOlive,
            }}
          >
            {String(error?.message || error)}
            <div style={{ height: 12 }} />
            <button onClick={load} style={primaryBtnStyle()}>
              Retry
            </button>
          </div>
        ) : applicants.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 64, color: staffari.mutedOlive }}>🕵️</div>
            <div style={{ height: 12 }} />
            <div
              style={{
                fontFamily: "Space Grotesk, system-ui",
                fontSize: 22,
                fontWeight: 900,
                color: staffari.deepJungleGreen,
              }}
            >
              No Applicants Yet
            </div>
            <div style={{ height: 8 }} />
            <div
              style={{
                fontFamily: "Poppins, system-ui",
                fontSize: 16,
                color: staffari.mutedOlive,
              }}
            >
              Check back later to see who has applied.
            </div>
          </div>
        ) : (
          <div>
            {applicants.map((a, idx) => {
              const profile = a?.profile_snapshot || a?.profileSnapshot || {};
              const status = a?.status ?? "Pending";
              const info = statusInfo(status);

              const userId = String(a?.userid ?? a?.user_id ?? "");
              const isUpdating = updatingStatusFor.has(userId);
              const isSelected = selectedApplicantIds.has(userId);
              const isChatLoading = isCreatingChatFor.has(userId);

              const fullName = String(
                profile?.fullName ?? profile?.fullname ?? "N/A",
              );
              const initial =
                fullName && fullName !== "N/A"
                  ? fullName[0].toUpperCase()
                  : "?";

              const email = String(profile?.email ?? "N/A");
              const phone = String(profile?.phone ?? "N/A");

              const appliedAtRaw =
                a?.appliedat ?? a?.applied_at ?? a?.appliedAt ?? null;
              const appliedAt = appliedAtRaw ? new Date(appliedAtRaw) : null;

              const showChat = !isSelectionMode && shouldShowChatButton(status);

              return (
                <div
                  key={userId || idx}
                  style={{
                    background: info.bg,
                    borderRadius: 16,
                    border: `1px solid ${hexWithAlpha(info.color, 0.3)}`,
                    padding: 16,
                    marginBottom: 16,
                    fontFamily: "Poppins, system-ui",
                  }}
                  onClick={() => {
                    if (isSelectionMode) toggleSelected(userId);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(userId)}
                        style={{
                          marginTop: 6,
                          width: 18,
                          height: 18,
                          accentColor: staffari.deepJungleGreen,
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: hexWithAlpha(info.color, 0.12),
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "Space Grotesk, system-ui",
                        fontWeight: 900,
                        fontSize: 22,
                        color: info.color,
                        flex: "0 0 auto",
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "Space Grotesk, system-ui",
                          fontSize: 20,
                          fontWeight: 900,
                          color: staffari.deepJungleGreen,
                        }}
                      >
                        {fullName}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          color: staffari.mutedOlive,
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(profile?.headline ?? "No headline")}
                      </div>
                    </div>

                    {!isSelectionMode && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {isUpdating ? (
                          <div style={{ color: info.color, fontWeight: 900 }}>
                            ...
                          </div>
                        ) : (
                          <select
                            value={String(status)}
                            onChange={(e) =>
                              doUpdateStatus(userId, e.target.value)
                            }
                            style={{
                              borderRadius: 999,
                              padding: "8px 10px",
                              border: `1px solid ${hexWithAlpha(info.color, 0.3)}`,
                              background: info.bg,
                              color: info.color,
                              fontWeight: 900,
                              cursor: "pointer",
                              outline: "none",
                            }}
                            title="Change status"
                          >
                            {STATUS_MENU.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ height: 14 }} />
                  <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />
                  <div style={{ height: 14 }} />

                  <Row icon="✉️" text={email} />
                  <div style={{ height: 8 }} />
                  <Row icon="📞" text={phone} />

                  {appliedAt && (
                    <>
                      <div style={{ height: 8 }} />
                      <Row
                        icon="📅"
                        text={`Applied on ${appliedAt.toLocaleDateString()}`}
                      />
                    </>
                  )}

                  {showChat && (
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openChatForApplicant(a);
                        }}
                        disabled={isChatLoading}
                        style={{
                          ...primaryBtnStyle(),
                          padding: "10px 14px",
                          borderRadius: 10,
                          opacity: isChatLoading ? 0.7 : 1,
                        }}
                      >
                        {isChatLoading ? "Starting..." : "Chat"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: staffari.charcoalBlack,
      }}
    >
      <div style={{ width: 18, textAlign: "center", opacity: 0.9 }}>{icon}</div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ShimmerApplicants() {
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
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

function topBtnStyle() {
  return {
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 10,
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function primaryBtnStyle() {
  return {
    background: staffari.emeraldGreen,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 14,
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function hexWithAlpha(hex, alpha01) {
  // expects #RRGGBB
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha01})`;
}
