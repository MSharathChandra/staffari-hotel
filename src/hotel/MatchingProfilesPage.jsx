import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlaceIcon from "@mui/icons-material/Place";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonIcon from "@mui/icons-material/Person";

import hotelApi from "./api";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";

const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const mutedOlive = "#7B6F57";
const charcoalBlack = "#1C1C1C";
const cardBackground = "#FDF9F0";

const s = (v) => (v == null ? "" : String(v).trim());
const asStringList = (v) =>
  Array.isArray(v) ? v.map((x) => s(x)).filter(Boolean) : [];
const isTruthy = (v) => {
  if (typeof v === "boolean") return v;
  const t = s(v).toLowerCase();
  return t === "true" || t === "1" || t === "yes";
};

export default function MatchingProfilesPage({ job, onBack }) {
  const uid = localStorage.getItem("uid") || "";

  const jobId = useMemo(
    () => String(job?.id || job?.job_id || job?.jobId || ""),
    [job],
  );
  const titleText = job?.title
    ? `Matching profiles • ${job.title}`
    : "Matching profiles";

  const [rows, setRows] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [profileId, setProfileId] = useState("");

  const load = async () => {
    if (!uid) {
      setErr(new Error("User not logged in."));
      return;
    }
    if (!jobId) {
      setErr(new Error("Job ID missing."));
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const decoded = await hotelApi.matchProfiles({
        hotelOwnerId: uid,
        jobId,
      });

      // Flutter expects: decoded["data"] as List ?? []
      const dataArray = Array.isArray(decoded?.data) ? decoded.data : [];
      setRows(dataArray);
    } catch (e) {
      setErr(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return (
    <Box sx={{ bgcolor: "#fff" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: 20, fontWeight: 900, color: deepJungleGreen }}
          >
            {titleText}
          </Typography>
          <Typography sx={{ fontSize: 13, color: mutedOlive }}>
            Tap a card to expand.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            onClick={onBack}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: deepJungleGreen,
            }}
          >
            Back
          </Button>
          <Button
            onClick={load}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              bgcolor: emeraldGreen,
              "&:hover": { bgcolor: emeraldGreen },
              borderRadius: 2,
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <ShimmerList />
      ) : err ? (
        <ErrorBox err={err} />
      ) : rows.length === 0 ? (
        <EmptyBox />
      ) : (
        <Stack spacing={2} sx={{ pb: 2 }}>
          {rows.map((row, i) => {
            const r = row || {};
            const userId = s(r.user_id);
            const key = userId || `row_${i}`;

            const profile =
              r.profile && typeof r.profile === "object" ? r.profile : {};

            const name =
              s(profile.fullName) ||
              `${s(profile.first_name)} ${s(profile.last_name)}`.trim() ||
              "Unnamed candidate";

            const headline = s(profile.headline);
            const location = s(profile.location);

            const score =
              typeof r.final_score === "number"
                ? r.final_score.toFixed(1)
                : s(r.final_score) || "-";

            const skills = asStringList(profile.skills);
            const languages = asStringList(profile.languages);
            const certifications = asStringList(profile.certifications);
            const aiReasons = asStringList(r.ai_reasons);

            const verified = isTruthy(profile.isEmailVerified);
            const profilePic = s(profile.profile_pic_url);

            const expanded = expandedKey === key;

            return (
              <Paper
                key={key}
                elevation={0}
                sx={{
                  bgcolor: "transparent",
                  boxShadow: `0 4px 12px rgba(15,61,52,0.08)`,
                  borderRadius: 2,
                }}
              >
                <Accordion
                  expanded={expanded}
                  onChange={() => setExpandedKey(expanded ? null : key)}
                  elevation={0}
                  sx={{
                    bgcolor: cardBackground,
                    borderRadius: 2,
                    border: `1px solid rgba(25,95,78,0.15)`,
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: emeraldGreen }} />}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        width: "100%",
                        alignItems: "flex-start",
                      }}
                    >
                      <Avatar
                        src={profilePic || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "#fff",
                          color: mutedOlive,
                        }}
                      >
                        {!profilePic ? <PersonIcon /> : null}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          <Typography
                            sx={{
                              fontSize: 16,
                              fontWeight: 900,
                              color: deepJungleGreen,
                            }}
                            noWrap
                          >
                            {name}
                          </Typography>
                          <ScorePill scoreText={score} />
                        </Box>

                        {headline ? (
                          <Typography
                            sx={{
                              mt: 0.5,
                              fontSize: 13,
                              color: "rgba(15,61,52,0.80)",
                            }}
                            noWrap={!expanded}
                          >
                            {headline}
                          </Typography>
                        ) : null}

                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {location ? (
                            <MiniChip
                              icon={
                                <PlaceIcon
                                  sx={{ fontSize: 14, color: deepJungleGreen }}
                                />
                              }
                              text={location}
                            />
                          ) : null}

                          {verified ? (
                            <MiniChip
                              icon={
                                <VerifiedRoundedIcon
                                  sx={{ fontSize: 14, color: emeraldGreen }}
                                />
                              }
                              text="Verified"
                              chipColor={emeraldGreen}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Divider sx={{ mb: 1.5, opacity: 0.5 }} />

                    {skills.length ? (
                      <>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: mutedOlive,
                          }}
                        >
                          Top Skills
                        </Typography>
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {(expanded
                            ? skills.slice(0, 20)
                            : skills.slice(0, 4)
                          ).map((sk) => (
                            <SkillPill key={sk} text={sk} />
                          ))}
                        </Box>
                      </>
                    ) : null}

                    {expanded ? (
                      <>
                        {aiReasons.length ? (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 900,
                                color: deepJungleGreen,
                              }}
                            >
                              AI Match Analysis
                            </Typography>

                            <Box
                              sx={{
                                mt: 1,
                                p: 1.5,
                                bgcolor: "rgba(255,255,255,0.6)",
                                borderRadius: 1.5,
                                border: "1px solid #fff",
                              }}
                            >
                              <Stack spacing={1}>
                                {aiReasons.map((reason) => (
                                  <Box
                                    key={reason}
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <CheckCircleOutlineIcon
                                      sx={{
                                        fontSize: 16,
                                        color: emeraldGreen,
                                        mt: "2px",
                                      }}
                                    />
                                    <Typography
                                      sx={{
                                        fontSize: 13,
                                        color: charcoalBlack,
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {reason}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          </Box>
                        ) : null}

                        {languages.length ? (
                          <KV k="Languages" v={languages.join(", ")} />
                        ) : null}
                        {certifications.length ? (
                          <KV
                            k="Certifications"
                            v={certifications.join(", ")}
                          />
                        ) : null}

                        <Box sx={{ mt: 2 }}>
                          <Button
                            fullWidth
                            disabled={!userId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileId(userId);
                            }}
                            variant="contained"
                            startIcon={<PersonIcon />}
                            sx={{
                              bgcolor: emeraldGreen,
                              "&:hover": { bgcolor: emeraldGreen },
                              textTransform: "none",
                              fontWeight: 900,
                              borderRadius: 2,
                              py: 1.4,
                            }}
                          >
                            View Full Profile
                          </Button>
                        </Box>
                      </>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              </Paper>
            );
          })}
        </Stack>
      )}

      {profileId ? (
        <ApplicantProfileDrawer
          applicantId={profileId}
          onClose={() => setProfileId("")}
        />
      ) : null}
    </Box>
  );
}

function ScorePill({ scoreText }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.5,
        bgcolor: emeraldGreen,
        borderRadius: 999,
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>
        {scoreText}%
      </Typography>
    </Box>
  );
}

function MiniChip({ icon, text, chipColor }) {
  const c = chipColor || deepJungleGreen;
  return (
    <Chip
      icon={icon}
      label={text}
      size="small"
      sx={{
        bgcolor: "#fff",
        color: c,
        borderRadius: 1.5,
        border: `1px solid rgba(15,61,52,0.10)`,
        fontWeight: 700,
      }}
    />
  );
}

function SkillPill({ text }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        bgcolor: "rgba(15,61,52,0.06)",
        borderRadius: 1.5,
      }}
    >
      <Typography
        sx={{ fontSize: 12, fontWeight: 700, color: deepJungleGreen }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function KV({ k, v }) {
  return (
    <Box sx={{ mt: 1.25, display: "flex", gap: 1, alignItems: "flex-start" }}>
      <Typography
        sx={{ fontSize: 13, fontWeight: 900, color: deepJungleGreen }}
      >
        {k}:
      </Typography>
      <Typography sx={{ fontSize: 13, color: charcoalBlack }}>{v}</Typography>
    </Box>
  );
}

// Skeleton is the MUI standard loading placeholder. [web:99]
function ShimmerList() {
  return (
    <Stack spacing={2}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Paper
          key={i}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid rgba(123,111,87,0.20)",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="45%" height={26} />
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton
                variant="rectangular"
                height={22}
                sx={{ mt: 1, borderRadius: 1 }}
              />
            </Box>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

function EmptyBox() {
  return (
    <Paper
      elevation={0}
      sx={{ p: 5, textAlign: "center", borderRadius: 2, bgcolor: "#fff" }}
    >
      <Typography
        sx={{ fontSize: 16, fontWeight: 900, color: deepJungleGreen }}
      >
        No matching profiles found.
      </Typography>
      <Typography sx={{ mt: 1, color: mutedOlive }}>
        Try refreshing or adjust the job details.
      </Typography>
    </Paper>
  );
}

function ErrorBox({ err }) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 5, textAlign: "center", borderRadius: 2, bgcolor: "#fff" }}
    >
      <Typography
        sx={{ fontSize: 16, fontWeight: 900, color: deepJungleGreen }}
      >
        Oops! Something went wrong.
      </Typography>
      <Typography sx={{ mt: 1, color: mutedOlive, whiteSpace: "pre-wrap" }}>
        {String(err?.message || err)}
      </Typography>
    </Paper>
  );
}
