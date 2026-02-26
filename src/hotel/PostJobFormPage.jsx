import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FlashOnIcon from "@mui/icons-material/FlashOn";

import hotelApi from "./api";
import JOBPOSTMODE from "./jobPostMode";

const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
// const charcoalBlack = "#1C1C1C";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

const jobTypeOptionsBase = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary/Seasonal",
  "Apprenticeship",
  "Freelance/Consultant",
  "Shift-based (Day/Night/Rotational)",
  "Remote/Hybrid",
  "Other",
];

const urgencyOptionsBase = [
  "Immediate",
  "Within 7 days",
  "Within 15 days",
  "Flexible",
  "Other",
];
const shiftOptionsBase = [
  "Morning",
  "Evening",
  "Night",
  "Rotational",
  "Split",
  "Other",
];

export default function PostJobFormPage({ open, mode, onClose, onDone }) {
  const uid = localStorage.getItem("uid") || "";
  const isQuick = mode === JOBPOSTMODE.QUICK;

  const [busy, setBusy] = useState(false);

  const [jobTypeOptions, setJobTypeOptions] = useState(jobTypeOptionsBase);
  const [urgencyOptions, setUrgencyOptions] = useState(urgencyOptionsBase);
  const [shiftOptions, setShiftOptions] = useState(shiftOptionsBase);

  const [f, setF] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    department: "",
    salary: "",
    applicationdeadline: "",
    status: "open",
    jobtype: "",
    urgency: "",
    shifts: [],
    benefits: [],
    hotelstarrating: 0,
    amenities: [],
    requiredcertificates: [],
  });

  const titleText = isQuick ? "Quick Job Post" : "Post a New Job";

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const toggleInArray = (key, value) => {
    setF((p) => {
      const arr = Array.isArray(p[key]) ? p[key] : [];
      const has = arr.includes(value);
      return {
        ...p,
        [key]: has ? arr.filter((x) => x !== value) : arr.concat(value),
      };
    });
  };

  const promptOther = async (label) => {
    const text = window.prompt(`Add ${label}`, "");
    const v = (text || "").trim();
    return v.length ? v : null;
  };

  const handleSelectWithOther = async (
    fieldKey,
    options,
    setOptions,
    value,
  ) => {
    if (value !== "Other") {
      setField(fieldKey, value);
      return;
    }
    const added = await promptOther(fieldKey);
    if (added) {
      const idx = Math.max(0, options.length - 1);
      const next = options.slice();
      next.splice(idx, 0, added);
      setOptions(next);
      setField(fieldKey, added);
    }
  };

  const validate = () => {
    if (!uid) return "User not logged in.";
    if (!f.title.trim()) return "Job Title is required.";
    if (!f.department.trim()) return "Department is required.";
    if (!f.location.trim()) return "Location is required.";
    if (!f.jobtype.trim()) return "Job Type is required.";
    if (!f.applicationdeadline.trim()) return "Deadline is required.";

    if (isQuick) {
      if (!f.urgency.trim()) return "Urgency is required.";
      if (!Array.isArray(f.shifts) || f.shifts.length === 0)
        return "Select at least one shift.";
    } else {
      if (!f.company.trim()) return "Company is required.";
      if (!f.description.trim()) return "Description is required.";
      // (Flutter requires benefits/amenities/certs in FULL; keep optional if you want)
    }
    return null;
  };

  const submit = async () => {
    const msg = validate();
    if (msg) return alert(msg);

    setBusy(true);
    try {
      const payload = isQuick
        ? {
            userid: uid,
            title: f.title.trim(),
            department: f.department.trim(),
            location: f.location.trim(),
            quickpost: true,
            shifts: f.shifts,
            jobtype: f.jobtype.trim(),
            urgency: f.urgency.trim(),
            salary: f.salary.trim(),
            applicationdeadline: f.applicationdeadline.trim(),
          }
        : {
            userid: uid,
            title: f.title.trim(),
            description: f.description.trim(),
            company: f.company.trim(),
            location: f.location.trim(),
            department: f.department.trim(),
            salary: f.salary.trim(),
            jobtype: f.jobtype.trim(),
            urgency: f.urgency.trim(),
            shifts: f.shifts,
            benefits: f.benefits,
            hotelstarrating: Number(f.hotelstarrating || 0),
            amenities: f.amenities,
            requiredcertificates: f.requiredcertificates,
            applicationdeadline: f.applicationdeadline.trim(),
            status: (f.status || "").trim(),
          };

      await hotelApi.createJob(payload);
      onDone?.();
      onClose?.();
      alert(
        isQuick ? "Quick job posted successfully!" : "Job posted successfully!",
      );
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
        {titleText}
      </DialogTitle>

      <DialogContent sx={{ bgcolor: cardBackground }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Job Title"
              value={f.title}
              onChange={(e) => setField("title", e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Department"
              value={f.department}
              onChange={(e) => setField("department", e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Location (e.g., City, Country)"
              value={f.location}
              onChange={(e) => setField("location", e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Salary (e.g., 50000 INR/month)"
              value={f.salary}
              onChange={(e) => setField("salary", e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                label="Job Type"
                value={f.jobtype || ""}
                onChange={(e) =>
                  handleSelectWithOther(
                    "jobtype",
                    jobTypeOptions,
                    setJobTypeOptions,
                    e.target.value,
                  )
                }
              >
                {jobTypeOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Application Deadline (YYYY-MM-DD)"
              value={f.applicationdeadline}
              onChange={(e) => setField("applicationdeadline", e.target.value)}
              fullWidth
            />
          </Grid>

          {isQuick && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    label="Urgency"
                    value={f.urgency || ""}
                    onChange={(e) =>
                      handleSelectWithOther(
                        "urgency",
                        urgencyOptions,
                        setUrgencyOptions,
                        e.target.value,
                      )
                    }
                  >
                    {urgencyOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography sx={{ color: mutedOlive, fontWeight: 800, mb: 1 }}>
                  Shifts
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "1px solid rgba(123,111,87,0.20)",
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {shiftOptions.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        onClick={async () => {
                          if (s !== "Other") return toggleInArray("shifts", s);
                          const added = await promptOther("shift");
                          if (added) {
                            const idx = Math.max(0, shiftOptions.length - 1);
                            const next = shiftOptions.slice();
                            next.splice(idx, 0, added);
                            setShiftOptions(next);
                            toggleInArray("shifts", added);
                          }
                        }}
                        variant={f.shifts.includes(s) ? "filled" : "outlined"}
                        sx={{
                          bgcolor: f.shifts.includes(s)
                            ? "rgba(25,95,78,0.12)"
                            : "transparent",
                          borderColor: "rgba(25,95,78,0.35)",
                          color: deepJungleGreen,
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </>
          )}

          {!isQuick && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Company Name"
                  value={f.company}
                  onChange={(e) => setField("company", e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Status"
                  value={f.status}
                  onChange={(e) => setField("status", e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Job Description"
                  value={f.description}
                  onChange={(e) => setField("description", e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ bgcolor: cardBackground, p: 2 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            color: deepJungleGreen,
            borderColor: "rgba(123,111,87,0.35)",
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={submit}
          disabled={busy}
          variant="contained"
          startIcon={
            busy ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : isQuick ? (
              <FlashOnIcon />
            ) : (
              <AddIcon />
            )
          }
          sx={{
            textTransform: "none",
            borderRadius: 2,
            bgcolor: emeraldGreen,
            "&:hover": { bgcolor: emeraldGreen },
          }}
        >
          {busy ? "Posting..." : isQuick ? "Quick Post" : "Post Job"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
