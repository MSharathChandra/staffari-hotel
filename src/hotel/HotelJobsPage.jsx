import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import AddIcon from "@mui/icons-material/Add";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded";

import hotelApi from "./api";
import JOBPOSTMODE from "./jobPostMode";
import PostJobFormPage from "./PostJobFormPage";
import JobDetailsModal from "./JobDetailsModal";
import MatchingProfilesPage from "./MatchingProfilesPage";
import HotelJobCard from "./HotelJobCard";

const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

export default function HotelJobsPage() {
  const uid = localStorage.getItem("uid") || "";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [formMode, setFormMode] = useState(null); // JOBPOSTMODE.QUICK / FULL
  const [detailsJob, setDetailsJob] = useState(null);

  const [matchingFor, setMatchingFor] = useState(null); // job object

  const load = useCallback(async () => {
    if (!uid) {
      setJobs([]);
      setLoading(false);
      setErr(new Error("User not logged in."));
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const data = await hotelApi.getJobs(uid);
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const openMatchingProfiles = (job) => {
    const hotelOwnerId = uid;
    if (!hotelOwnerId) return alert("User not logged in");

    const jobId = (job?.id ?? job?.jobid ?? job?.jobId ?? "").toString();
    if (!jobId.trim()) return alert("Job ID missing in job object");

    setMatchingFor({
      ...job,
      __matching: {
        hotelOwnerId,
        jobId,
        jobTitle: (job?.title ?? job?.jobtitle ?? "").toString(),
      },
    });
  };

  if (!uid) {
    return (
      <Paper
        elevation={0}
        sx={{ bgcolor: cardBackground, borderRadius: 2, p: 3 }}
      >
        <Typography sx={{ color: mutedOlive }}>User not logged in.</Typography>
      </Paper>
    );
  }

  if (matchingFor) {
    const m = matchingFor.__matching || {};
    return (
      <MatchingProfilesPage
        hotelOwnerId={m.hotelOwnerId}
        jobId={m.jobId}
        jobTitle={m.jobTitle}
        onBack={() => setMatchingFor(null)}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header + actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{ fontSize: 32, fontWeight: 900, color: deepJungleGreen }}
        >
          Your Job Postings
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={() => setFormMode(JOBPOSTMODE.QUICK)}
            variant="contained"
            startIcon={<FlashOnIcon />}
            sx={{
              bgcolor: deepJungleGreen,
              "&:hover": { bgcolor: deepJungleGreen },
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 2,
            }}
          >
            Quick Post
          </Button>

          <Button
            onClick={() => setFormMode(JOBPOSTMODE.FULL)}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: emeraldGreen,
              "&:hover": { bgcolor: emeraldGreen },
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 2,
            }}
          >
            Post Job
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <ShimmerJobs />
      ) : err ? (
        <ErrorState error={err} onRetry={load} />
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={2}>
          {jobs.map((job, idx) => (
            <Box
              key={String(job?.id ?? idx)}
              sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
            >
              <HotelJobCard job={job} onTap={() => setDetailsJob(job)} />

              <Button
                onClick={() => openMatchingProfiles(job)}
                variant="contained"
                startIcon={<PeopleAltRoundedIcon />}
                sx={{
                  alignSelf: "stretch",
                  bgcolor: deepJungleGreen,
                  "&:hover": { bgcolor: deepJungleGreen },
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 2,
                  height: 46,
                }}
              >
                See matching profiles
              </Button>
            </Box>
          ))}
        </Stack>
      )}

      {/* Dialogs */}
      <PostJobFormPage
        open={!!formMode}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onDone={load}
      />

      <JobDetailsModal
        open={!!detailsJob}
        job={detailsJob}
        onClose={() => setDetailsJob(null)}
        onSaved={load}
      />
    </Box>
  );
}

function ShimmerJobs() {
  return (
    <Stack spacing={2}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Paper
          key={i}
          elevation={0}
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            p: 2.5,
            border: "1px solid rgba(123,111,87,0.20)",
          }}
        >
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="text" width="40%" height={22} />
          <Skeleton
            variant="rectangular"
            height={60}
            sx={{ mt: 2, borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            height={44}
            sx={{ mt: 2, borderRadius: 2 }}
          />
        </Paper>
      ))}
    </Stack>
  );
}

function EmptyState() {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: cardBackground,
        borderRadius: 2,
        p: 5,
        textAlign: "center",
      }}
    >
      <PostAddRoundedIcon style={{ fontSize: 80, color: mutedOlive }} />
      <Typography
        sx={{ mt: 2, fontSize: 22, fontWeight: 900, color: deepJungleGreen }}
      >
        No Jobs Posted Yet
      </Typography>
      <Typography sx={{ mt: 1, fontSize: 16, color: mutedOlive }}>
        Tap the Post Job button to find your next great hire!
      </Typography>
    </Paper>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: cardBackground,
        borderRadius: 2,
        p: 5,
        textAlign: "center",
      }}
    >
      <ErrorOutlineRoundedIcon style={{ fontSize: 80, color: "#ff5252" }} />
      <Typography
        sx={{ mt: 2, fontSize: 22, fontWeight: 900, color: deepJungleGreen }}
      >
        Something Went Wrong
      </Typography>
      <Typography
        sx={{ mt: 1, fontSize: 14, color: mutedOlive, whiteSpace: "pre-wrap" }}
      >
        {String(error?.message || error)}
      </Typography>
      <Button
        onClick={onRetry}
        variant="contained"
        sx={{
          mt: 2,
          bgcolor: emeraldGreen,
          "&:hover": { bgcolor: emeraldGreen },
          textTransform: "none",
          fontWeight: 900,
          borderRadius: 2,
        }}
      >
        Retry
      </Button>
    </Paper>
  );
}
