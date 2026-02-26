import React, { useEffect, useState } from "react";
import hotelApi from "./api";

const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

export default function ApplicantProfileDrawer({ applicantId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!applicantId) {
        setErr(new Error("Missing applicantId"));
        setBusy(false);
        return;
      }

      setBusy(true);
      setErr(null);
      setProfile(null);

      try {
        const res = await hotelApi.getJobSeekerProfile(applicantId);
        const p = res?.data?.profile_data || res?.data || res || null;
        if (alive) setProfile(p);
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setBusy(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [applicantId]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        padding: 24,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cardBackground,
          borderRadius: 16,
          padding: 16,
          maxWidth: 760,
          margin: "0 auto",
          border: "1px solid rgba(123,111,87,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: deepJungleGreen }}>
              Applicant Profile
            </h3>
            <div style={{ fontSize: 13, color: mutedOlive }}>
              ID: {applicantId}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: emeraldGreen,
              color: "#fff",
              border: 0,
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            background: "#fff",
            borderRadius: 14,
            padding: 14,
          }}
        >
          {busy ? (
            <p style={{ margin: 0, color: mutedOlive }}>Loading profile...</p>
          ) : err ? (
            <p style={{ margin: 0, color: "crimson" }}>
              {String(err?.message || err)}
            </p>
          ) : !profile ? (
            <p style={{ margin: 0, color: mutedOlive }}>No profile found.</p>
          ) : (
            <div style={{ color: deepJungleGreen }}>
              <h3 style={{ marginTop: 0 }}>
                {profile.fullName || "Candidate"}
              </h3>
              <p style={{ marginTop: -8, color: mutedOlive }}>
                {profile.headline || "-"}
              </p>
              <p>Email: {profile.email || "-"}</p>
              <p>Phone: {profile.phone || "-"}</p>
              <p>Location: {profile.location || "-"}</p>
              <p>Skills: {(profile.skills || []).join(", ")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
