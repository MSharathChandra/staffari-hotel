import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import {
  fetchApplicantProfile,
  shareJobseekerViaEmail,
} from "../../../api/applicantProfileApi";

export default function ApplicantProfilePage() {
  const { userId } = useParams(); // /hotel/applicants/:userId [web:116]
  const navigate = useNavigate();
  const location = useLocation();

  const hotelOwnerId = lsGet("uid", null);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Share section state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [includeChat, setIncludeChat] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState(null);

  const fullName = useMemo(() => {
    const name = (profile?.fullName ?? "Applicant").toString();
    return name.trim() || "Applicant";
  }, [profile]);

  const initial = useMemo(
    () => (fullName ? fullName[0].toUpperCase() : "?"),
    [fullName],
  );

  const bannerUrl = profile?.banner_image_url || null;
  const profilePicUrl = profile?.profile_pic_url || null;
  const videoUrl = profile?.video_cv_url || null;
  const resumeUrl = profile?.resume_url || null;

  const openExternal = (url) => {
    if (!url) return;
    window.open(String(url), "_blank", "noopener,noreferrer");
  };

  const load = async () => {
    setIsLoading(true);
    setErr(null);
    try {
      const data = await fetchApplicantProfile(userId);
      setProfile(data && typeof data === "object" ? data : {});
    } catch (e) {
      setErr(e);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isValidEmail = (email) => /^[^@]+@[^@]+\.[^@]+$/.test(email);

  const onShare = async () => {
    if (!hotelOwnerId) {
      setShareMessage("User not logged in. Please log in again.");
      return;
    }

    const email = recipientEmail.trim();
    if (!isValidEmail(email)) {
      setShareMessage("Please enter a valid email address.");
      return;
    }

    setIsSharing(true);
    setShareMessage(null);

    try {
      await shareJobseekerViaEmail({
        hotel_owner_id: hotelOwnerId,
        jobseeker_id: userId,
        recipient_email: email,
        include_chat: includeChat,
      });

      setShareMessage("Profile shared successfully!");
      setRecipientEmail("");
    } catch {
      setShareMessage("Failed to send email");
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) return <ProfileShimmer />;
  if (err) return <CenteredMessage text="Error loading profile." />;
  if (!profile || Object.keys(profile).length === 0)
    return <CenteredMessage text="Profile data not found." />;

  return (
    <div style={{ minHeight: "100vh", background: staffari.cardBackground }}>
      {/* Header area (web equivalent of SliverAppBar) */}
      <div
        style={{
          position: "relative",
          height: 280,
          background: staffari.deepJungleGreen,
        }}
      >
        {/* Banner */}
        <div style={{ position: "absolute", inset: 0 }}>
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.00), rgba(15,61,52,0.70), rgba(15,61,52,1))",
            }}
          />
        </div>

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            right: 12,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={() => {
              const from = location.state?.from;
              if (from) navigate(-1);
              else navigate(-1);
            }}
            style={iconBtn("#fff")}
            title="Back"
          >
            ←
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={load} style={iconBtn("#fff")} title="Refresh">
            ⟳
          </button>
        </div>

        {/* Profile content */}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: staffari.emeraldGreen,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                border: "2px solid rgba(255,255,255,0.6)",
              }}
            >
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: "Space Grotesk, system-ui",
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {initial}
                </div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Space Grotesk, system-ui",
                  fontWeight: 900,
                  fontSize: 20,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "min(560px, 80vw)",
                }}
              >
                {fullName}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontFamily: "Poppins, system-ui",
                  color: "#fff",
                  opacity: 0.92,
                }}
              >
                {(profile?.headline ?? "No headline").toString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
        {resumeUrl ? (
          <ResumeCard url={resumeUrl} onOpen={openExternal} />
        ) : null}

        {profile["PIT-Medium-score"] != null ? (
          <DetailCard
            title="Assessment Score"
            rows={[
              {
                k: "PIT Medium Score",
                v: `${profile["PIT-Medium-score"].toString()}%`,
              },
            ]}
          />
        ) : null}

        {videoUrl ? <VideoCard videoUrl={videoUrl} /> : null}

        <DetailCard
          title="Contact Information"
          rows={[
            { k: "Email", v: profile?.contact_email },
            { k: "Phone", v: profile?.phone_number },
            { k: "LinkedIn", v: profile?.linkedin_profile, link: true },
            { k: "Portfolio", v: profile?.portfolio, link: true },
          ]}
          onOpen={openExternal}
        />

        <DetailCard
          title="Professional Summary"
          rows={[
            {
              k: "Experience",
              v:
                profile?.experience_years != null
                  ? `${profile.experience_years} years`
                  : null,
            },
            { k: "Department", v: profile?.department },
            { k: "Availability", v: profile?.availability },
            { k: "Employment Status", v: profile?.employment_status },
            { k: "Qualifications", v: profile?.qualifications },
          ]}
        />

        <DetailCard
          title="Education"
          rows={[
            { k: "College", v: profile?.college_name },
            {
              k: "Year of Passout",
              v:
                profile?.year_of_passout?.toString?.() ??
                profile?.year_of_passout,
            },
            { k: "Grade", v: profile?.grade },
          ]}
        />

        <DetailCard
          title="Location"
          rows={[
            { k: "City", v: profile?.location },
            { k: "State", v: profile?.state },
          ]}
        />

        <ChipListCard title="Skills" items={asList(profile?.skills)} />
        <ChipListCard title="Languages" items={asList(profile?.languages)} />
        <ChipListCard
          title="Preferred Job Categories"
          items={asList(profile?.preferred_categories)}
        />
        <ChipListCard
          title="Certifications"
          items={asList(profile?.certifications)}
        />

        {Array.isArray(profile?.certifications_docs) &&
        profile.certifications_docs.length ? (
          <CertDocsCard
            docs={profile.certifications_docs}
            onOpen={openExternal}
          />
        ) : null}

        <ShareCard
          recipientEmail={recipientEmail}
          setRecipientEmail={setRecipientEmail}
          includeChat={includeChat}
          setIncludeChat={setIncludeChat}
          isSharing={isSharing}
          shareMessage={shareMessage}
          onShare={onShare}
          disabled={!hotelOwnerId}
        />
      </div>
    </div>
  );
}

/* ---------- helpers/components ---------- */

function asList(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").trim()).filter(Boolean);
}

function iconBtn(color) {
  return {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.12)",
    color,
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    backdropFilter: "blur(6px)",
  };
}

function CardShell({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.2)",
        padding: 20,
        marginBottom: 16,
        fontFamily: "Poppins, system-ui",
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ color: staffari.emeraldGreen, fontWeight: 900 }}>
        {icon}
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 20,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        {title}
      </div>
    </div>
  );
}

function ResumeCard({ url, onOpen }) {
  return (
    <CardShell>
      <CardTitle icon="📄" title="Resume" />
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />
      <button onClick={() => onOpen(url)} style={primaryBtn()}>
        View/Download Resume
      </button>
    </CardShell>
  );
}

function VideoCard({ videoUrl }) {
  return (
    <CardShell>
      <CardTitle icon="🎥" title="Video CV" />
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(123,111,87,0.10)",
        }}
      >
        <video
          src={videoUrl}
          controls
          style={{ width: "100%", display: "block" }}
        />
      </div>
    </CardShell>
  );
}

function DetailCard({ title, rows, onOpen }) {
  const valid = (rows || []).filter(
    (r) => r?.v != null && String(r.v).trim() !== "",
  );
  if (!valid.length) return null;

  return (
    <CardShell>
      <CardTitle icon="ℹ️" title={title} />
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />

      {valid.map((r) => (
        <div key={r.k} style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: staffari.mutedOlive,
            }}
          >
            {r.k}
          </div>
          <div style={{ height: 4 }} />
          {r.link && onOpen ? (
            <button
              onClick={() => onOpen(r.v)}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                color: staffari.emeraldGreen,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {String(r.v)}
            </button>
          ) : (
            <div
              style={{
                fontSize: 16,
                color: staffari.charcoalBlack,
                lineHeight: 1.4,
              }}
            >
              {String(r.v)}
            </div>
          )}
        </div>
      ))}
    </CardShell>
  );
}

function ChipListCard({ title, items }) {
  const list = items || [];
  if (!list.length) return null;

  return (
    <CardShell>
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 20,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        {title}
      </div>
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {list.map((it) => (
          <span
            key={it}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(25,95,78,0.10)",
              border: "1px solid rgba(25,95,78,0.25)",
              color: staffari.deepJungleGreen,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {it}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

function CertDocsCard({ docs, onOpen }) {
  return (
    <CardShell>
      <CardTitle icon="🏅" title="Certification Documents" />
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gap: 10 }}>
        {docs.map((doc, idx) => {
          const name = (doc?.name ?? "Certificate").toString();
          const url = doc?.url;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(123,111,87,0.18)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(25,95,78,0.10)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span style={{ color: staffari.emeraldGreen, fontWeight: 900 }}>
                  📎
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 900,
                    color: staffari.charcoalBlack,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
              </div>

              <button
                onClick={() => onOpen(url)}
                style={miniBtn()}
                disabled={!url}
              >
                Open
              </button>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function ShareCard({
  recipientEmail,
  setRecipientEmail,
  includeChat,
  setIncludeChat,
  isSharing,
  shareMessage,
  onShare,
  disabled,
}) {
  return (
    <CardShell>
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 20,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        Share Profile via Email
      </div>
      <div style={{ height: 12 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />

      <label style={{ display: "block" }}>
        <div
          style={{
            color: staffari.mutedOlive,
            fontWeight: 900,
            marginBottom: 6,
          }}
        >
          Recipient Email
        </div>
        <input
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="example@domain.com"
          disabled={isSharing || disabled}
          style={inputStyle()}
        />
      </label>

      <div style={{ height: 14 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 800, color: staffari.charcoalBlack }}>
          Include Chat History
        </div>
        <input
          type="checkbox"
          checked={includeChat}
          onChange={(e) => setIncludeChat(e.target.checked)}
          disabled={isSharing || disabled}
          style={{ width: 18, height: 18, accentColor: staffari.emeraldGreen }}
        />
      </div>

      <div style={{ height: 14 }} />

      <button
        onClick={onShare}
        disabled={isSharing || disabled}
        style={{ ...primaryBtn(), opacity: isSharing || disabled ? 0.7 : 1 }}
      >
        {isSharing ? "Sharing..." : "Share Profile"}
      </button>

      {shareMessage ? (
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontWeight: 700,
            color: shareMessage.toLowerCase().includes("success")
              ? "rgb(21, 128, 61)"
              : "rgb(185, 28, 28)",
          }}
        >
          {shareMessage}
        </div>
      ) : null}
    </CardShell>
  );
}

function ProfileShimmer() {
  return (
    <div style={{ minHeight: "100vh", background: staffari.cardBackground }}>
      <div
        style={{
          height: 280,
          background:
            "linear-gradient(90deg, rgba(240,240,240,1) 25%, rgba(255,255,255,1) 50%, rgba(240,240,240,1) 75%)",
          backgroundSize: "400% 100%",
          animation: "shimmer 1.2s ease-in-out infinite",
        }}
      />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
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
      </div>

      <style>{`@keyframes shimmer { 0%{background-position:100% 0;} 100%{background-position:0 0;} }`}</style>
    </div>
  );
}

function CenteredMessage({ text }) {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        background: staffari.cardBackground,
      }}
    >
      <div
        style={{
          fontFamily: "Poppins, system-ui",
          color: staffari.mutedOlive,
          fontWeight: 800,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function primaryBtn() {
  return {
    width: "100%",
    background: staffari.emeraldGreen,
    color: "#fff",
    border: "none",
    padding: "14px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function miniBtn() {
  return {
    border: "none",
    background: staffari.emeraldGreen,
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(123,111,87,0.25)",
    outline: "none",
    background: "#fff",
    fontFamily: "Poppins, system-ui",
    fontWeight: 700,
    boxSizing: "border-box",
  };
}
