import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Paper,
  Divider,
  Stack,
  CircularProgress,
} from "@mui/material";

import hotelApi from "./api";

const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const terracottaBrown = "#E57734";
const charcoalBlack = "#1C1C1C";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

function toCsvList(text) {
  const t = (text || "").trim();
  if (!t) return [];
  return t
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToCsv(list) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list.map((x) => String(x)).join(", ");
}

export default function JobDetailsModal({ open, job, onClose, onSaved }) {
  const uid = localStorage.getItem("uid") || "";
  const jobId = job?.id || job?.jobid || job?.jobId;

  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [f, setF] = useState(() => ({
    title: job?.title || "",
    description: job?.description || "",
    company: job?.company || "",
    location: job?.location || "",
    salary: job?.salary || "",
    jobtype: job?.jobtype || "",
    status: job?.status || "",
    applicationdeadline: job?.applicationdeadline || "",
    benefits: listToCsv(job?.benefits),
    amenities: listToCsv(job?.amenities),
    requiredcertificates: listToCsv(job?.requiredcertificates),
    hotelstarrating: Number(job?.hotelstarrating || 0),
  }));

  // Refresh form when job changes
  React.useEffect(() => {
    if (!open) return;
    setIsEditing(false);
    setBusy(false);
    setF({
      title: job?.title || "",
      description: job?.description || "",
      company: job?.company || "",
      location: job?.location || "",
      salary: job?.salary || "",
      jobtype: job?.jobtype || "",
      status: job?.status || "",
      applicationdeadline: job?.applicationdeadline || "",
      benefits: listToCsv(job?.benefits),
      amenities: listToCsv(job?.amenities),
      requiredcertificates: listToCsv(job?.requiredcertificates),
      hotelstarrating: Number(job?.hotelstarrating || 0),
    });
  }, [open, job]);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!uid || !jobId) return alert("Missing user/job info");
    if (!f.title.trim()) return alert("Title is required");

    setBusy(true);
    try {
      const payload = {
        user_id: uid,
        title: f.title,
        description: f.description,
        company: f.company,
        location: f.location,
        salary: f.salary,
        jobtype: f.jobtype,
        status: f.status,
        applicationdeadline: f.applicationdeadline,
        benefits: toCsvList(f.benefits),
        amenities: toCsvList(f.amenities),
        requiredcertificates: toCsvList(f.requiredcertificates),
      };

      await hotelApi.editJob(jobId, payload);
      alert("Job updated successfully!");
      setIsEditing(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle
        sx={{
          bgcolor: cardBackground,
          color: deepJungleGreen,
          fontWeight: 900,
        }}
      >
        {isEditing ? "Edit Job" : "Job Details"}
      </DialogTitle>

      <DialogContent sx={{ bgcolor: cardBackground }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <InfoCard>
            <SectionHeader title="Job Title" />
            {isEditing ? (
              <TextField
                value={f.title}
                onChange={(e) => setField("title", e.target.value)}
                fullWidth
              />
            ) : (
              <Typography
                sx={{ fontSize: 24, fontWeight: 900, color: deepJungleGreen }}
              >
                {f.title || "Not provided"}
              </Typography>
            )}

            <Divider sx={{ my: 2, opacity: 0.4 }} />

            <SectionHeader title="Company" />
            {isEditing ? (
              <TextField
                value={f.company}
                onChange={(e) => setField("company", e.target.value)}
                fullWidth
              />
            ) : (
              <Typography
                sx={{ fontSize: 15, color: charcoalBlack, lineHeight: 1.6 }}
              >
                {f.company || "Not provided"}
              </Typography>
            )}

            <Divider sx={{ my: 2, opacity: 0.4 }} />

            <SectionHeader title="Hotel Star Rating" />
            <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
              {Array.from({ length: Number(f.hotelstarrating || 0) }).map(
                (_, i) => (
                  <Box
                    key={i}
                    sx={{
                      color: terracottaBrown,
                      fontSize: 22,
                      lineHeight: "22px",
                    }}
                  >
                    ★
                  </Box>
                ),
              )}
              {Number(f.hotelstarrating || 0) === 0 && (
                <Typography sx={{ color: mutedOlive }}>Not provided</Typography>
              )}
            </Box>
          </InfoCard>

          <InfoCard>
            <SectionHeader title="Description" />
            {isEditing ? (
              <TextField
                value={f.description}
                onChange={(e) => setField("description", e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            ) : (
              <Typography
                sx={{ fontSize: 15, color: charcoalBlack, lineHeight: 1.7 }}
              >
                {f.description || "Not provided"}
              </Typography>
            )}
          </InfoCard>

          <InfoCard>
            <SectionHeader title="Job Specifics" />
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <Field
                  label="Location"
                  editing={isEditing}
                  value={f.location}
                  onChange={(v) => setField("location", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  label="Job Type"
                  editing={isEditing}
                  value={f.jobtype}
                  onChange={(v) => setField("jobtype", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  label="Salary"
                  editing={isEditing}
                  value={f.salary}
                  onChange={(v) => setField("salary", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  label="Status"
                  editing={isEditing}
                  value={f.status}
                  onChange={(v) => setField("status", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  label="Application Deadline"
                  editing={isEditing}
                  value={f.applicationdeadline}
                  onChange={(v) => setField("applicationdeadline", v)}
                />
              </Grid>
            </Grid>
          </InfoCard>

          <InfoCard>
            <SectionHeader title="Benefits (comma-separated)" />
            <Field
              label="Benefits"
              editing={isEditing}
              value={f.benefits}
              onChange={(v) => setField("benefits", v)}
              multiline
            />
            <Divider sx={{ my: 2, opacity: 0.35 }} />
            <SectionHeader title="Amenities (comma-separated)" />
            <Field
              label="Amenities"
              editing={isEditing}
              value={f.amenities}
              onChange={(v) => setField("amenities", v)}
              multiline
            />
            <Divider sx={{ my: 2, opacity: 0.35 }} />
            <SectionHeader title="Required Certificates (comma-separated)" />
            <Field
              label="Required Certificates"
              editing={isEditing}
              value={f.requiredcertificates}
              onChange={(v) => setField("requiredcertificates", v)}
              multiline
            />
          </InfoCard>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ bgcolor: cardBackground, p: 2 }}>
        {isEditing ? (
          <>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={busy}
              sx={{ textTransform: "none", color: mutedOlive, fontWeight: 800 }}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={busy}
              variant="contained"
              startIcon={
                busy ? (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                ) : null
              }
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: emeraldGreen,
                "&:hover": { bgcolor: emeraldGreen },
                fontWeight: 900,
              }}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onClose}
              sx={{ textTransform: "none", color: mutedOlive, fontWeight: 800 }}
            >
              Close
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: emeraldGreen,
                "&:hover": { bgcolor: emeraldGreen },
                fontWeight: 900,
              }}
            >
              Edit Job
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function InfoCard({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#fff",
        borderRadius: 2,
        border: "1px solid rgba(123,111,87,0.20)",
        p: 2,
      }}
    >
      {children}
    </Paper>
  );
}

function SectionHeader({ title }) {
  return (
    <Typography
      sx={{
        fontSize: 14,
        fontWeight: 900,
        color: mutedOlive,
        letterSpacing: 0.2,
      }}
    >
      {title}
    </Typography>
  );
}

function Field({ label, editing, value, onChange, multiline }) {
  if (editing) {
    return (
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        multiline={!!multiline}
        minRows={multiline ? 2 : 1}
        sx={{ mt: 1 }}
      />
    );
  }
  return (
    <Typography sx={{ mt: 1, color: charcoalBlack, lineHeight: 1.7 }}>
      {value?.trim?.() ? value : "Not provided"}
    </Typography>
  );
}
