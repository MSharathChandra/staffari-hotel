import React, { useEffect, useState } from "react";
import { hotelApi } from "./api";

export default function ApplicantProfileDrawer({ applicantId, onClose }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await hotelApi.getJobSeekerProfile(applicantId);
      setProfile(res?.data?.profile_data || res?.data || null);
    })();
  }, [applicantId]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 16, maxWidth: 720, margin: "0 auto" }}>
        <button onClick={onClose}>Close</button>
        {!profile ? <p>Loading profile...</p> : (
          <div>
            <h3>{profile.fullName || "Candidate"}</h3>
            <p>{profile.headline || "-"}</p>
            <p>Email: {profile.email || "-"}</p>
            <p>Phone: {profile.phone || "-"}</p>
            <p>Location: {profile.location || "-"}</p>
            <p>Skills: {(profile.skills || []).join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
