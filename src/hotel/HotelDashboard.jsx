import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Button,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SearchIcon from "@mui/icons-material/Search";

import HotelApplicationsSummaryPage from "./HotelApplicationsSummary";
import HotelApplicantsPage from "./HotelApplicantsPage";
import HotelJobsPage from "./HotelJobsPage";
import HotelProfilePage from "./HotelProfilePage";
import SearchJobseekersPage from "./SearchJobSeekersPage";
import HotelChatListPage from "./HotelChatListPage";

/** --- STAFFARI UI CONSTANTS (same as Flutter) --- */
const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const earthyBeige = "#FFFFFF";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

const TABS = {
  applications: "applications",
  jobs: "jobs",
  profile: "profile",
  search: "search",
};

export default function HotelDashboard() {
  const isMobile = useMediaQuery("(max-width:900px)");

  // Tabs / routing inside dashboard
  const [tab, setTab] = useState(TABS.applications);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Read localStorage synchronously via lazy init (no effect, no warning)
  const [hotelName] = useState(
    () => localStorage.getItem("fullName") || "Hotel",
  );
  const [email] = useState(
    () => localStorage.getItem("email") || "No email found",
  );
  const [hotelId] = useState(() => localStorage.getItem("uid"));

  // Keep a loading UI hook (optional). Since localStorage is sync, it's always false.
  const isLoading = false;

  const theme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: "Poppins, Arial, sans-serif" },
        palette: {
          primary: { main: deepJungleGreen },
          secondary: { main: emeraldGreen },
          background: { default: earthyBeige, paper: cardBackground },
          text: { primary: deepJungleGreen },
        },
      }),
    [],
  );

  const resetToTab = (nextTab) => {
    setChatOpen(false);
    setSelectedJob(null);
    setTab(nextTab);
  };

  const content = useMemo(() => {
    if (chatOpen)
      return <HotelChatListPage onClose={() => setChatOpen(false)} />;

    // This matches your current web flow: applications -> open applicants for a selected job
    if (selectedJob) {
      return (
        <HotelApplicantsPage
          job={selectedJob}
          onBack={() => setSelectedJob(null)}
        />
      );
    }

    switch (tab) {
      case TABS.applications:
        return (
          <HotelApplicationsSummaryPage onOpenApplicants={setSelectedJob} />
        );
      case TABS.jobs:
        return <HotelJobsPage />;
      case TABS.profile:
        return <HotelProfilePage hotelId={hotelId} email={email} />;
      case TABS.search:
      default:
        return <SearchJobseekersPage />;
    }
  }, [chatOpen, selectedJob, tab, hotelId, email]);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: earthyBeige,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress sx={{ color: emeraldGreen }} />
        </Box>
      </ThemeProvider>
    );
  }

  const DesktopSidebar = (
    <Paper
      elevation={1}
      sx={{
        width: 260,
        flex: "0 0 260px",
        bgcolor: cardBackground,
        borderRadius: 2,
        height: "fit-content",
        position: "sticky",
        top: 80,
      }}
    >
      <Stack spacing={1} sx={{ p: 2 }}>
        <Button
          variant={tab === TABS.applications ? "contained" : "outlined"}
          onClick={() => resetToTab(TABS.applications)}
          sx={navBtnSx(tab === TABS.applications)}
          startIcon={<InboxOutlinedIcon />}
        >
          Applications
        </Button>

        <Button
          variant={tab === TABS.jobs ? "contained" : "outlined"}
          onClick={() => resetToTab(TABS.jobs)}
          sx={navBtnSx(tab === TABS.jobs)}
          startIcon={<LibraryBooksOutlinedIcon />}
        >
          Jobs
        </Button>

        <Button
          variant={tab === TABS.profile ? "contained" : "outlined"}
          onClick={() => resetToTab(TABS.profile)}
          sx={navBtnSx(tab === TABS.profile)}
          startIcon={<StorefrontOutlinedIcon />}
        >
          Profile
        </Button>

        <Button
          variant={tab === TABS.search ? "contained" : "outlined"}
          onClick={() => resetToTab(TABS.search)}
          sx={navBtnSx(tab === TABS.search)}
          startIcon={<SearchIcon />}
        >
          Search Talent
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: earthyBeige,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: deepJungleGreen }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "#fff", flex: 1 }}>
              Welcome, {hotelName}
            </Typography>

            <IconButton
              onClick={() => setChatOpen(true)}
              sx={{ color: "#fff" }}
              aria-label="Messages"
              title="Messages"
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page body */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
            gap: 2,
            p: 2,
            pb: isMobile ? "72px" : 2, // avoid overlap with fixed bottom nav (common fix)
          }}
        >
          {!isMobile && DesktopSidebar}

          <Paper
            elevation={1}
            sx={{
              flex: 1,
              bgcolor: cardBackground,
              borderRadius: 2,
              p: 2,
              minHeight: "calc(100vh - 140px)",
            }}
          >
            {content}
          </Paper>
        </Box>

        {/* Mobile Bottom Navigation (fixed) */}
        {isMobile && (
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: cardBackground,
            }}
          >
            <BottomNavigation
              showLabels
              value={tab}
              onChange={(_, newValue) => resetToTab(newValue)}
              sx={{
                bgcolor: cardBackground,
                "& .Mui-selected": { color: emeraldGreen },
                "& .MuiBottomNavigationAction-root": { color: mutedOlive },
                "& .MuiBottomNavigationAction-label": {
                  fontFamily: "Poppins, Arial, sans-serif",
                },
              }}
            >
              <BottomNavigationAction
                value={TABS.applications}
                label="Applications"
                icon={<InboxOutlinedIcon />}
              />
              <BottomNavigationAction
                value={TABS.jobs}
                label="Jobs"
                icon={<LibraryBooksOutlinedIcon />}
              />
              <BottomNavigationAction
                value={TABS.profile}
                label="Profile"
                icon={<StorefrontOutlinedIcon />}
              />
              <BottomNavigationAction
                value={TABS.search}
                label="Search Talent"
                icon={<SearchIcon />}
              />
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
}

function navBtnSx(active) {
  return {
    justifyContent: "flex-start",
    textTransform: "none",
    fontWeight: active ? 700 : 500,
    borderColor: active ? emeraldGreen : "rgba(15, 61, 52, 0.25)",
    color: active ? "#fff" : deepJungleGreen,
    bgcolor: active ? emeraldGreen : "transparent",
    "&:hover": {
      bgcolor: active ? emeraldGreen : "rgba(25, 95, 78, 0.08)",
      borderColor: emeraldGreen,
    },
  };
}
