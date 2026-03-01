import React from "react";
import { staffari } from "../../../theme/staffariTheme";
import JobDetailsPage from "./JobDetailsPage";

export default function JobDetailsSheet({ open, onClose, job, onSaved }) {
  if (!open) return null;

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
          width: "min(900px, 100%)",
          maxHeight: "95vh",
          background: staffari.cardBackground,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <JobDetailsPage job={job} onClose={onClose} onSaved={onSaved} />
      </div>
    </div>
  );
}
