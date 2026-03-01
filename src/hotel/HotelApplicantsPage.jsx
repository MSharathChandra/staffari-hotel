import React, { useCallback, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import EditIcon from "@mui/icons-material/Edit";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";

// --- STAFFARI UI CONSTANTS (same as Flutter) ---
const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
// const terracottaBrown = "#E57734";
const charcoalBlack = "#1C1C1C";
const mutedOlive = "#7B6F57";
const earthyBeige = "#FFFFFF";
const cardBackground = "#FDF9F0";

const STATUS_OPTIONS = [
  "Interview Scheduled",
  "Viewed",
  "Accepted",
  "Rejected",
  "Pending",
];

function formatAppliedDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function getStatusInfo(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("accepted") || s.includes("hired")) {
    return { text: "Accepted", color: emeraldGreen, bgColor: "#E9F7F2" };
  }
  if (s.includes("interview")) {
    return { text: "Interview", color: "#1565C0", bgColor: "#E8F1FD" };
  }
  if (s.includes("rejected")) {
    return { text: "Rejected", color: "#C62828", bgColor: "#FDECEC" };
  }
  if (s.includes("viewed")) {
    return { text: "Viewed", color: "#6A1B9A", bgColor: "#F3E8FB" };
  }
  return { text: "Pending", color: "#B26A00", bgColor: "#FFF4E0" };
}

function shouldShowChatButton(status) {
  const s = String(status || "").toLowerCase();
  return (
    s.includes("interview scheduled") ||
    s.includes("accepted") ||
    s.includes("pending") ||
    s.includes("viewed") ||
    s.includes("hired")
  );
}

async function fetchApplicants({ hotelOwnerId, jobId }) {
  const url = `https://hhs-backend-1fmx.onrender.com/hotel/job-applicants?hotel_owner_id=${encodeURIComponent(
    hotelOwnerId,
  )}&job_id=${encodeURIComponent(jobId)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load applicants: ${res.status}`);

  const json = await res.json();
  // In your Flutter, you used: json.decode(response.body)["data"] as List
  const data = Array.isArray(json?.data) ? json.data : [];
  return data;
}

async function updateApplicantStatus({ hotelOwnerId, jobId, userId, status }) {
  const url =
    "https://hhs-backend-1fmx.onrender.com/hotel/job-applicants/application-status";
  const payload = {
    hotelownerid: hotelOwnerId,
    jobid: jobId,
    userid: userId,
    status,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to update status: ${txt || res.status}`);
  }
}

async function bulkUpdateStatus({ hotelOwnerId, jobId, updates }) {
  const url =
    "https://hhs-backend-1fmx.onrender.com/hotel/job-applicants/application-status";
  const payload = { hotelownerid: hotelOwnerId, jobid: jobId, updates };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Bulk update failed: ${txt || res.status}`);
  }
}

async function createConversation({ hotelOwnerId, jobSeekerId }) {
  const url = `https://hhs-chat.onrender.com/conversations?userid=${encodeURIComponent(hotelOwnerId)}`;
  const payload = {
    participants: [hotelOwnerId, jobSeekerId],
    topic: "Hotel Job Opening",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;

  const json = await res.json().catch(() => ({}));
  const cid = json?.conversationId?.toString();
  return cid && cid.length ? cid : null;
}

export default function HotelApplicantsPage({ job, onBack, onOpenChat }) {
  // `job` should be the JobWithApplicantCount object (same as your dashboard flow)
  const jobData = job?.jobData || {};
  const jobId = jobData?.id;

  const hotelOwnerId = localStorage.getItem("uid");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [applicants, setApplicants] = useState([]);

  // Per applicant loaders
  const [updatingStatusFor, setUpdatingStatusFor] = useState(() => new Set());
  const [isCreatingChatFor, setIsCreatingChatFor] = useState(() => new Set());

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const allSelected =
    applicants.length > 0 && selectedIds.size === applicants.length;

  // Profile dialog (web equivalent of bottom sheet)
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileApplicant, setProfileApplicant] = useState(null);

  // Menus
  const [anchorElBulk, setAnchorElBulk] = useState(null);
  const bulkMenuOpen = Boolean(anchorElBulk);

  const [anchorElRow, setAnchorElRow] = useState(null);
  const [rowMenuApplicant, setRowMenuApplicant] = useState(null);
  const rowMenuOpen = Boolean(anchorElRow);

  const load = useCallback(async () => {
    if (!hotelOwnerId) {
      setErr(new Error("Hotel owner not logged in."));
      setLoading(false);
      return;
    }
    if (!jobId) {
      setErr(new Error("No job selected."));
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const data = await fetchApplicants({ hotelOwnerId, jobId });
      setApplicants(data);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [hotelOwnerId, jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelectionMode = () => {
    if (isBulkUpdating) return;
    setIsSelectionMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (isBulkUpdating) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const s = new Set(applicants.map((a) => String(a?.userid)));
      setSelectedIds(s);
    }
  };

  const toggleSelected = (id) => {
    if (isBulkUpdating) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openProfile = (applicant) => {
    setProfileApplicant(applicant);
    setProfileOpen(true);
  };

  const handleUpdateStatus = async (applicantUserId, newStatus, index) => {
    if (!hotelOwnerId || !jobId) return;
    setUpdatingStatusFor((prev) => new Set(prev).add(applicantUserId));
    try {
      await updateApplicantStatus({
        hotelOwnerId,
        jobId,
        userId: applicantUserId,
        status: newStatus,
      });
      setApplicants((prev) => {
        const next = prev.slice();
        if (next[index]) next[index] = { ...next[index], status: newStatus };
        return next;
      });
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

  const handleBulkUpdate = async (newStatus) => {
    if (!hotelOwnerId || !jobId) return;

    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      alert("Select at least one applicant.");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const updates = ids.map((id) => ({ userid: id, status: newStatus }));
      await bulkUpdateStatus({ hotelOwnerId, jobId, updates });

      setApplicants((prev) =>
        prev.map((a) => {
          const id = String(a?.userid);
          return selectedIds.has(id) ? { ...a, status: newStatus } : a;
        }),
      );

      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openChatForApplicant = async (applicant) => {
    if (isSelectionMode) return;

    if (!hotelOwnerId) {
      alert("Hotel owner not logged in.");
      return;
    }

    const jobSeekerId = String(applicant?.userid || "");
    if (!jobSeekerId) return;

    setIsCreatingChatFor((prev) => new Set(prev).add(jobSeekerId));
    try {
      const conversationId = await createConversation({
        hotelOwnerId,
        jobSeekerId,
      });
      if (!conversationId) {
        alert("Failed to start chat");
        return;
      }

      const jobTitle = String(jobData?.title || "Job");
      const company = String(jobData?.company || "Company");

      // If you have a chat route/page, pass it out:
      if (onOpenChat) {
        onOpenChat({
          conversationId,
          hotelOwnerId,
          jobSeekerId,
          jobTitle,
          company,
        });
      } else {
        // fallback: just log it
        console.log("Open chat:", {
          conversationId,
          hotelOwnerId,
          jobSeekerId,
          jobTitle,
          company,
        });
        alert("Chat created. Hook up onOpenChat to navigate/open ChatScreen.");
      }
    } finally {
      setIsCreatingChatFor((prev) => {
        const next = new Set(prev);
        next.delete(jobSeekerId);
        return next;
      });
    }
  };

  const title = "Job Applicants";
  const subtitle = String(jobData?.title || "Job");

  return (
    <Box sx={{ bgcolor: earthyBeige }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: deepJungleGreen }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={onBack} sx={{ color: "#fff" }} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: "#fff",
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.70)",
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <IconButton
            onClick={toggleSelectionMode}
            sx={{ color: "#fff" }}
            title={isSelectionMode ? "Cancel selection" : "Select"}
            disabled={isBulkUpdating}
          >
            {isSelectionMode ? <CloseIcon /> : <ChecklistIcon />}
          </IconButton>

          {isSelectionMode && (
            <IconButton
              onClick={toggleSelectAll}
              sx={{ color: "#fff" }}
              title={allSelected ? "Unselect all" : "Select all"}
              disabled={isBulkUpdating}
            >
              {allSelected ? <SelectAllIcon /> : <DoneAllIcon />}
            </IconButton>
          )}

          {/* Bulk edit menu */}
          <IconButton
            onClick={(e) => setAnchorElBulk(e.currentTarget)}
            sx={{ color: "#fff" }}
            disabled={!isSelectionMode || isBulkUpdating}
            title="Bulk update"
          >
            {isBulkUpdating ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              <EditIcon />
            )}
          </IconButton>

          <Menu
            anchorEl={anchorElBulk}
            open={bulkMenuOpen}
            onClose={() => setAnchorElBulk(null)}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem
                key={s}
                onClick={() => {
                  setAnchorElBulk(null);
                  handleBulkUpdate(s);
                }}
              >
                {s}
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        {loading ? (
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, bgcolor: cardBackground }}
          >
            <Stack spacing={2}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{ p: 2, borderRadius: 2, bgcolor: "#fff" }}
                >
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: "rgba(25,95,78,0.08)",
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          width: "40%",
                          height: 18,
                          bgcolor: "rgba(0,0,0,0.08)",
                          borderRadius: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: "55%",
                          height: 14,
                          bgcolor: "rgba(0,0,0,0.06)",
                          borderRadius: 1,
                          mt: 1,
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        ) : err ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: cardBackground,
              textAlign: "center",
            }}
          >
            <ErrorOutlineRoundedIcon
              style={{ fontSize: 80, color: "#ff5252" }}
            />
            <Typography
              sx={{
                mt: 2,
                fontSize: 22,
                fontWeight: 900,
                color: deepJungleGreen,
              }}
            >
              Something Went Wrong
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontSize: 14,
                color: mutedOlive,
                whiteSpace: "pre-wrap",
              }}
            >
              {String(err?.message || err)}
            </Typography>
            <Button
              onClick={load}
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: emeraldGreen,
                "&:hover": { bgcolor: emeraldGreen },
                textTransform: "none",
              }}
            >
              Retry
            </Button>
          </Paper>
        ) : applicants.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: cardBackground,
              textAlign: "center",
            }}
          >
            <PersonSearchOutlinedIcon
              style={{ fontSize: 80, color: mutedOlive }}
            />
            <Typography
              sx={{
                mt: 2,
                fontSize: 22,
                fontWeight: 900,
                color: deepJungleGreen,
              }}
            >
              No Applicants Yet
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 16, color: mutedOlive }}>
              Check back later to see who has applied.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {applicants.map((applicant, index) => {
              const profile = applicant?.profile_snapshot || {};
              const applicantUserId = String(applicant?.user_id || "");
              const statusText = String(applicant?.status || "");
              const statusInfo = getStatusInfo(statusText);
              const isUpdating = updatingStatusFor.has(applicantUserId);
              const isSelected = selectedIds.has(applicantUserId);
              const isChatLoading = isCreatingChatFor.has(applicantUserId);

              const fullName = String(profile?.fullName || "NA");
              const initial =
                fullName && fullName !== "NA" ? fullName[0].toUpperCase() : "N";
              const showChat =
                !isSelectionMode && shouldShowChatButton(statusText);

              return (
                <Paper
                  key={`${applicantUserId}-${index}`}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: statusInfo.bgColor,
                    border: `1px solid ${hexToRgba(statusInfo.color, 0.3)}`,
                  }}
                  onClick={() => {
                    if (isSelectionMode) toggleSelected(applicantUserId);
                    else openProfile(applicant);
                  }}
                >
                  <Box
                    sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                  >
                    {isSelectionMode && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelected(applicantUserId)}
                        sx={{
                          mt: 0.4,
                          color: deepJungleGreen,
                          "&.Mui-checked": { color: deepJungleGreen },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Avatar */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: hexToRgba(statusInfo.color, 0.1),
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 48px",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: statusInfo.color,
                        }}
                      >
                        {initial}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: deepJungleGreen,
                            }}
                          >
                            {fullName}
                          </Typography>
                          <Typography
                            sx={{ mt: 0.5, color: mutedOlive, fontSize: 14 }}
                          >
                            {String(profile?.headline || "No headline")}
                          </Typography>
                        </Box>

                        {/* Right actions */}
                        {!isSelectionMode && (
                          <Box onClick={(e) => e.stopPropagation()}>
                            {isUpdating ? (
                              <CircularProgress
                                size={24}
                                sx={{ color: statusInfo.color }}
                              />
                            ) : (
                              <>
                                <Chip
                                  label={statusInfo.text}
                                  variant="outlined"
                                  onClick={(e) => {
                                    setRowMenuApplicant({
                                      applicant,
                                      index,
                                      applicantUserId,
                                    });
                                    setAnchorElRow(e.currentTarget);
                                  }}
                                  sx={{
                                    fontWeight: 800,
                                    color: statusInfo.color,
                                    bgcolor: statusInfo.bgColor,
                                    borderColor: hexToRgba(
                                      statusInfo.color,
                                      0.35,
                                    ),
                                    cursor: "pointer",
                                  }}
                                />
                              </>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Divider sx={{ my: 2, opacity: 0.4 }} />

                      <InfoRow
                        icon={<EmailOutlinedIcon fontSize="small" />}
                        text={String(profile?.email || "NA")}
                      />
                      <InfoRow
                        icon={<PhoneOutlinedIcon fontSize="small" />}
                        text={String(profile?.phone || "NA")}
                      />
                      <InfoRow
                        icon={<CalendarTodayOutlinedIcon fontSize="small" />}
                        text={`Applied on ${formatAppliedDate(applicant?.appliedat)}`}
                      />

                      {showChat && (
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isChatLoading ? (
                            <CircularProgress
                              size={22}
                              sx={{ color: emeraldGreen }}
                            />
                          ) : (
                            <Button
                              variant="contained"
                              startIcon={<ChatBubbleOutlineIcon />}
                              onClick={() => openChatForApplicant(applicant)}
                              sx={{
                                bgcolor: emeraldGreen,
                                "&:hover": { bgcolor: emeraldGreen },
                                textTransform: "none",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                              }}
                            >
                              Chat
                            </Button>
                          )}
                        </Box>
                      )}

                      {isSelectionMode && (
                        <Typography
                          sx={{
                            mt: 1,
                            color: isSelected
                              ? deepJungleGreen
                              : hexToRgba(mutedOlive, 0.9),
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          {isSelected ? "Selected" : "Tap to select"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Row status menu */}
      <Menu
        anchorEl={anchorElRow}
        open={rowMenuOpen}
        onClose={() => {
          setAnchorElRow(null);
          setRowMenuApplicant(null);
        }}
      >
        {STATUS_OPTIONS.map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              const row = rowMenuApplicant;
              setAnchorElRow(null);
              setRowMenuApplicant(null);
              if (row) handleUpdateStatus(row.applicantUserId, s, row.index);
            }}
          >
            {s}
          </MenuItem>
        ))}
      </Menu>

      {/* Profile dialog (placeholder) */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            color: deepJungleGreen,
            bgcolor: cardBackground,
          }}
        >
          Applicant Profile
        </DialogTitle>
        <DialogContent sx={{ bgcolor: cardBackground }}>
          <Typography sx={{ color: charcoalBlack, whiteSpace: "pre-wrap" }}>
            Hook this dialog to your ApplicantProfilePage component.
            {"\n\n"}
            Raw applicant object:
            {"\n"}
            {JSON.stringify(profileApplicant, null, 2)}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function InfoRow({ icon, text }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
      <Box sx={{ color: mutedOlive, display: "flex", alignItems: "center" }}>
        {icon}
      </Box>
      <Typography
        sx={{
          color: charcoalBlack,
          fontSize: 14,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function hexToRgba(hex, alpha) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
