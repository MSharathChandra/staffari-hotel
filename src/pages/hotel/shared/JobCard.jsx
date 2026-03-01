import React from "react";
import { staffari } from "../../../theme/staffariTheme";

export default function JobCard({ job, onTap, showLikeButton = false }) {
  return (
    <div
      onClick={onTap}
      role="button"
      tabIndex={0}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.2)",
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 20,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        {job?.title ?? job?.job_title ?? "No Title"}
      </div>

      <div style={{ height: 6 }} />

      <div
        style={{ fontFamily: "Poppins, system-ui", color: staffari.mutedOlive }}
      >
        {job?.company ?? "No Company"}
      </div>

      {showLikeButton ? <div /> : null}
    </div>
  );
}
