import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { fetchMatchingProfiles } from "../../../api/matchingProfilesApi";

export default function MatchingProfilesPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const jobTitle = location.state?.jobTitle ?? null; // passed from navigate state [web:111]
  const hotelOwnerId = lsGet("uid", null);

  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const titleText = useMemo(() => {
    const t = (jobTitle || "").toString().trim();
    return t ? `Matching profiles • ${t}` : "Matching profiles";
  }, [jobTitle]);

  const load = async () => {
    if (!hotelOwnerId) {
      setError(new Error("User not logged in"));
      setIsLoading(false);
      return;
    }
    if (!jobId) {
      setError(new Error("Missing jobId in route"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const list = await fetchMatchingProfiles({ hotelOwnerId, jobId });
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const s = (v) => (v == null ? "" : String(v).trim());
  const asStringList = (v) =>
    Array.isArray(v) ? v.map((x) => s(x)).filter(Boolean) : [];
  const isTruthy = (v) => {
    if (typeof v === "boolean") return v;
    const t = s(v).toLowerCase();
    return t === "true" || t === "1" || t === "yes";
  };

  const toggleExpanded = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const viewProfile = (userId) => {
    if (!userId.trim()) return;
    navigate(`/hotel/applicants/${encodeURIComponent(userId)}`, {
      state: { from: location.pathname },
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* AppBar-ish header */}
      <div
        style={{
          padding: "18px 20px 10px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: staffari.deepJungleGreen,
            fontSize: 18,
          }}
          title="Back"
        >
          ←
        </button>

        <div
          style={{
            flex: 1,
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 20,
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          {titleText}
        </div>

        <button
          onClick={load}
          style={{
            border: "1px solid rgba(123,111,87,0.35)",
            background: staffari.cardBackground,
            color: staffari.deepJungleGreen,
            borderRadius: 12,
            padding: "8px 12px",
            cursor: "pointer",
            fontFamily: "Poppins, system-ui",
            fontWeight: 900,
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ padding: "10px 20px 30px" }}>
        {isLoading ? (
          <ShimmerList />
        ) : error ? (
          <ErrorState err={error} />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((row, i) => {
              const map = row && typeof row === "object" ? row : {};
              const userId = s(map.user_id);

              const expandKey = userId || `row_${i}`;
              const isOpen = expanded.has(expandKey);

              const profile =
                map.profile && typeof map.profile === "object"
                  ? map.profile
                  : {};
              const name =
                s(profile.fullName) ||
                `${s(profile.first_name)} ${s(profile.last_name)}`.trim() ||
                "Unnamed candidate";

              const headline = s(profile.headline);
              const loc = s(profile.location);

              const finalScore = map.final_score;
              const scoreText =
                typeof finalScore === "number"
                  ? finalScore.toFixed(1)
                  : s(finalScore);

              const skills = asStringList(profile.skills);
              const languages = asStringList(profile.languages);
              const certifications = asStringList(profile.certifications);
              const aiReasons = asStringList(map.ai_reasons);

              const isVerified = isTruthy(profile.isEmailVerified);
              const profilePic = s(profile.profile_pic_url);

              return (
                <div
                  key={expandKey}
                  style={{
                    boxShadow: "0 4px 12px rgba(15,61,52,0.08)",
                    borderRadius: 16,
                    background: staffari.cardBackground,
                    border: "1px solid rgba(25,95,78,0.15)",
                    padding: 16,
                    fontFamily: "Poppins, system-ui",
                  }}
                >
                  {/* Header (click to expand) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpanded(expandKey)}
                    style={{ display: "flex", gap: 12, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#fff",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid rgba(123,111,87,0.20)",
                      }}
                    >
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: staffari.mutedOlive,
                            fontWeight: 900,
                          }}
                        >
                          👤
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: "Space Grotesk, system-ui",
                            fontSize: 16,
                            fontWeight: 900,
                            color: staffari.deepJungleGreen,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {name}
                        </div>

                        <ScorePill scoreText={scoreText} />
                      </div>

                      {headline ? (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 13,
                            color: "rgba(15,61,52,0.80)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: isOpen ? 4 : 1,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {headline}
                        </div>
                      ) : null}

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {loc ? <Chip text={loc} /> : null}
                        {isVerified ? (
                          <Chip
                            text="Verified"
                            color={staffari.emeraldGreen}
                            icon="✔"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 16 }} />
                  <div style={{ height: 1, background: "#EBE4D5" }} />
                  <div style={{ height: 12 }} />

                  {/* Skills (always visible) */}
                  {skills.length ? (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: staffari.mutedOlive,
                        }}
                      >
                        Top Skills
                      </div>
                      <div style={{ height: 8 }} />
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {skills.slice(0, isOpen ? 20 : 4).map((sk) => (
                          <Pill key={sk} text={sk} />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Expanded content */}
                  {isOpen ? (
                    <div>
                      <div style={{ height: 16 }} />

                      {aiReasons.length ? (
                        <>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: staffari.deepJungleGreen,
                            }}
                          >
                            AI Match Analysis
                          </div>
                          <div style={{ height: 8 }} />
                          <div
                            style={{
                              background: "rgba(255,255,255,0.6)",
                              border: "1px solid #fff",
                              borderRadius: 8,
                              padding: 12,
                            }}
                          >
                            {aiReasons.map((r, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    color: staffari.emeraldGreen,
                                    fontWeight: 900,
                                  }}
                                >
                                  ✓
                                </span>
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: "rgba(0,0,0,0.87)",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {r}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ height: 16 }} />
                        </>
                      ) : null}

                      {languages.length ? (
                        <KV k="Languages" v={languages.join(", ")} />
                      ) : null}
                      {certifications.length ? (
                        <KV k="Certifications" v={certifications.join(", ")} />
                      ) : null}

                      <div style={{ height: 20 }} />

                      <button
                        disabled={!userId}
                        onClick={() => viewProfile(userId)}
                        style={{
                          width: "100%",
                          background: staffari.emeraldGreen,
                          color: "#fff",
                          border: "none",
                          padding: "14px 14px",
                          borderRadius: 12,
                          cursor: userId ? "pointer" : "not-allowed",
                          fontFamily: "Poppins, system-ui",
                          fontWeight: 800,
                        }}
                      >
                        View Full Profile
                      </button>
                    </div>
                  ) : null}

                  <div style={{ height: 12 }} />

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => toggleExpanded(expandKey)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "6px 0",
                        color: staffari.emeraldGreen,
                        fontFamily: "Poppins, system-ui",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {isOpen ? "Show less" : "View details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small UI bits ---------- */

function ScorePill({ scoreText }) {
  return (
    <div
      style={{
        padding: "4px 10px",
        background: staffari.emeraldGreen,
        borderRadius: 20,
        color: "#fff",
        fontSize: 11,
        fontWeight: 900,
        fontFamily: "Poppins, system-ui",
        whiteSpace: "nowrap",
      }}
    >
      {scoreText ? `${scoreText}%` : "—"}
    </div>
  );
}

function Chip({ text, color = staffari.deepJungleGreen, icon = "📍" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 8px",
        background: "#fff",
        borderRadius: 8,
        border: `1px solid ${hexToRgba(color, 0.1)}`,
        maxWidth: 220,
      }}
    >
      <span style={{ fontSize: 12, color }}>{icon}</span>
      <span
        style={{
          fontSize: 11.5,
          color,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Pill({ text }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        background: "rgba(15,61,52,0.06)",
        borderRadius: 8,
        fontSize: 11.5,
        color: staffari.deepJungleGreen,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ margin: "6px 0", display: "flex", gap: 6 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        {k}:
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.87)" }}>{v}</div>
    </div>
  );
}

function ShimmerList() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 160,
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
    <div
      style={{
        textAlign: "center",
        padding: 24,
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div style={{ fontSize: 48, color: staffari.mutedOlive }}>🔎</div>
      <div style={{ height: 12 }} />
      <div style={{ color: staffari.mutedOlive, fontWeight: 800 }}>
        No matching profiles found.
      </div>
    </div>
  );
}

function ErrorState({ err }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 24,
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div style={{ fontSize: 40, color: "#E53935" }}>⚠️</div>
      <div style={{ height: 12 }} />
      <div
        style={{ fontSize: 16, fontWeight: 900, color: staffari.charcoalBlack }}
      >
        Oops! Something went wrong.
      </div>
      <div style={{ height: 8 }} />
      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
        {String(err?.message || err)}
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
