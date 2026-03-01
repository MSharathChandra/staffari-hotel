import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Skeleton,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

// --- STAFFARI UI CONSTANTS (same as Flutter) ---
const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const charcoalBlack = "#1C1C1C";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

// ---------- Dropdown data from your Flutter code ----------
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const departmentRoles = {
  "Front Office": [
    "Front Office Associate",
    "Guest Relations Executive",
    "Front Office Supervisor",
    "Front Office Manager",
    "Night Duty Manager",
    "Concierge",
  ],
  Housekeeping: [
    "Housekeeping Attendant",
    "Public Area Attendant",
    "Laundry Attendant",
    "Housekeeping Supervisor",
    "Executive Housekeeper",
  ],
  "Food & Beverage Service": [
    "Restaurant Server",
    "Host/Hostess",
    "Room Service Associate",
    "Restaurant Supervisor",
    "Restaurant Manager",
  ],
  "Bar/Beverage": [
    "Bar Back",
    "Bartender",
    "Bar Supervisor",
    "Beverage Manager",
  ],
  "Culinary/Kitchen": [
    "Commis",
    "Demi Chef de Partie",
    "Chef de Partie",
    "Sous Chef",
    "Executive Chef",
  ],
  "Bakery & Pastry": [
    "Bakery Commis",
    "Pastry Commis",
    "Pastry Chef de Partie",
    "Pastry Sous Chef",
    "Head Pastry Chef",
  ],
  "Banquets/Events": [
    "Banquet Server",
    "Banquet Captain",
    "Banquet Supervisor",
    "Banquet Manager",
  ],
  "Reservations & Revenue": [
    "Reservations Agent",
    "Reservations Supervisor",
    "Revenue Analyst",
    "Revenue Manager",
  ],
  "Sales & Marketing": [
    "Sales Coordinator",
    "Sales Executive",
    "Sales Manager",
    "Marketing Executive",
  ],
  "Spa & Wellness": [
    "Spa Receptionist",
    "Spa Therapist",
    "Spa Supervisor",
    "Spa Manager",
  ],
  "Security/Loss Prevention": [
    "Security Officer",
    "Security Supervisor",
    "Loss Prevention Manager",
  ],
  "Engineering/Maintenance": [
    "Maintenance Technician",
    "HVAC Technician",
    "Engineering Supervisor",
    "Chief Engineer",
  ],
  "IT/Systems": ["IT Support", "IT Executive", "Systems Administrator"],
  "Finance & Accounts": [
    "Accounts Payable Executive",
    "Accounts Receivable Executive",
    "Income Auditor",
    "Assistant Finance Manager",
  ],
  "Procurement/Stores": [
    "Storekeeper",
    "Purchasing Executive",
    "Purchasing Manager",
  ],
  "HR/Training": ["HR Executive", "Training Coordinator", "HR Manager"],
  Laundry: ["Laundry Attendant", "Laundry Supervisor"],
  "Transport/Logistics": ["Driver", "Transport Coordinator"],
};

async function fetchSummaryPage({
  hotelId,
  page,
  limit,
  includeExpired,
  department,
  location,
}) {
  // IMPORTANT FIX:
  // Backend expects hotel_id (underscore), not hotelid
  const qp = new URLSearchParams({
    hotel_id: hotelId,
    page: String(page),
    limit: String(limit),
    include_expired: String(includeExpired), // keep both variants for safety
    // includeexpired: String(includeExpired), // if backend still accepts old key
  });

  if (department && department.trim()) qp.set("department", department.trim());
  if (location && location.trim()) qp.set("location", location.trim());

  const url = `https://hhs-backend-1fmx.onrender.com/hotel/active-jobs-summary?${qp.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    let msg = "";
    try {
      const t = await res.text();
      msg = t ? ` | ${t}` : "";
    } catch {
      throw new Error(`Failed to load jobs summary: ${res.status}${msg}`);
    }
  }

  const json = await res.json();
  const success = json?.success ?? true;
  if (!success) throw new Error(json?.message?.toString() || "Request failed");

  const jobs = Array.isArray(json?.jobs) ? json.jobs : [];
  return {
    items: jobs.map((j) => {
      const applicantsCount = Number(j?.applicants_count ?? 0);
      return {
        jobData: j,
        applicantCount: Number.isFinite(applicantsCount) ? applicantsCount : 0,
      };
    }),
    hasMore: json?.has_more ?? true,
    totalApplicants: Number(json?.total_applicants ?? 0) || 0,
    totalAccepted: Number(json?.total_accepted ?? 0) || 0,
    totalPendingOrRejected: Number(json?.total_pending_or_rejected ?? 0) || 0,
  };
}

export default function HotelApplicationsSummaryPage({ onOpenApplicants }) {
  const hotelId = localStorage.getItem("uid") || "";
  const limit = 20;

  // Pagination state
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Totals
  const [totals, setTotals] = useState({
    totalApplicants: 0,
    totalAccepted: 0,
    totalPendingOrRejected: 0,
  });

  // Filters
  const [department, setDepartment] = useState(null);
  const [location, setLocation] = useState(null);
  const [includeExpired, setIncludeExpired] = useState(true);

  // Filter dialog local state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tempDept, setTempDept] = useState(null);
  const [tempLoc, setTempLoc] = useState(null);
  const [tempIncludeExpired, setTempIncludeExpired] = useState(true);

  const containerRef = useRef(null);

  const deptItems = useMemo(
    () => Object.keys(departmentRoles).slice().sort(),
    [],
  );
  const stateItems = useMemo(() => indianStates.slice().sort(), []);

  const loadFirstPage = useCallback(async () => {
    if (!hotelId) {
      setItems([]);
      setHasMore(false);
      setTotals({
        totalApplicants: 0,
        totalAccepted: 0,
        totalPendingOrRejected: 0,
      });
      setError(
        new Error(
          "Hotel owner not logged in (uid missing). Please sign in again.",
        ),
      );
      setIsFirstLoad(false);
      return;
    }

    setIsFirstLoad(true);
    setIsLoadingMore(false);
    setError(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
    setTotals({
      totalApplicants: 0,
      totalAccepted: 0,
      totalPendingOrRejected: 0,
    });

    try {
      const result = await fetchSummaryPage({
        hotelId,
        page: 1,
        limit,
        includeExpired,
        department,
        location,
      });

      setItems(result.items);
      setHasMore(result.hasMore);
      setTotals({
        totalApplicants: result.totalApplicants,
        totalAccepted: result.totalAccepted,
        totalPendingOrRejected: result.totalPendingOrRejected,
      });
    } catch (e) {
      setError(e);
    } finally {
      setIsFirstLoad(false);
    }
  }, [hotelId, limit, includeExpired, department, location]);

  const loadNextPageIfNeeded = useCallback(async () => {
    if (isFirstLoad || isLoadingMore || !hasMore) return;
    if (error && items.length === 0) return;
    if (!hotelId) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchSummaryPage({
        hotelId,
        page: nextPage,
        limit,
        includeExpired,
        department,
        location,
      });

      setPage(nextPage);
      setItems((prev) => prev.concat(result.items));
      setHasMore(result.hasMore);
      setTotals({
        totalApplicants: result.totalApplicants,
        totalAccepted: result.totalAccepted,
        totalPendingOrRejected: result.totalPendingOrRejected,
      });
    } catch (e) {
      setError(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hotelId,
    page,
    limit,
    includeExpired,
    department,
    location,
    isFirstLoad,
    isLoadingMore,
    hasMore,
    error,
    items.length,
  ]);

  // Initial load + reload when filters change
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Infinite scroll (web)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 250;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining < threshold) loadNextPageIfNeeded();
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadNextPageIfNeeded]);

  const openFilters = () => {
    setTempDept(department);
    setTempLoc(location);
    setTempIncludeExpired(includeExpired);
    setFiltersOpen(true);
  };

  const clearFilters = () => {
    setDepartment(null);
    setLocation(null);
    setIncludeExpired(true);
    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setDepartment(tempDept);
    setLocation(tempLoc);
    setIncludeExpired(tempIncludeExpired);
    setFiltersOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: 32, fontWeight: 800, color: deepJungleGreen }}
          >
            Job Postings
          </Typography>
          <Typography sx={{ color: mutedOlive }}>
            View active jobs and applicants count.
          </Typography>
        </Box>

        <IconButton
          onClick={openFilters}
          title="Filters"
          sx={{ color: deepJungleGreen }}
        >
          <TuneRoundedIcon />
        </IconButton>
      </Box>

      {/* Totals cards */}
      {!isFirstLoad && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 2,
          }}
        >
          <StatCard
            title="Applicants"
            value={String(totals.totalApplicants)}
            icon={<GroupsOutlinedIcon />}
          />
          <StatCard
            title="Accepted"
            value={String(totals.totalAccepted)}
            icon={<CheckCircleOutlineIcon />}
          />
          <StatCard
            title="Pending/Rejected"
            value={String(totals.totalPendingOrRejected)}
            icon={<HourglassBottomRoundedIcon />}
          />
        </Box>
      )}

      {/* List container */}
      <Paper
        ref={containerRef}
        elevation={0}
        sx={{
          bgcolor: "transparent",
          height: "70vh",
          overflow: "auto",
          pr: 1,
        }}
      >
        {isFirstLoad ? (
          <ShimmerList />
        ) : error && items.length === 0 ? (
          <ErrorState error={error} onRetry={loadFirstPage} />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ p: 0.5 }}>
            {items.map((item) => (
              <JobCard
                key={String(item?.jobData?.id ?? Math.random())}
                item={item}
                onClick={() => onOpenApplicants?.(item)}
              />
            ))}

            <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
              {isLoadingMore ? (
                <CircularProgress size={22} sx={{ color: emeraldGreen }} />
              ) : !hasMore ? (
                <Typography sx={{ color: mutedOlive }}>
                  No more results.
                </Typography>
              ) : (
                <Typography sx={{ color: mutedOlive }}>
                  Scroll to load more…
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Filters dialog */}
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: deepJungleGreen,
            bgcolor: cardBackground,
          }}
        >
          Filters
        </DialogTitle>

        <DialogContent sx={{ bgcolor: cardBackground }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={tempDept && deptItems.includes(tempDept) ? tempDept : ""}
                label="Department"
                onChange={(e) => setTempDept(e.target.value || null)}
              >
                <MenuItem value="">Select department</MenuItem>
                {deptItems.map((d) => (
                  <MenuItem key={d} value={d} sx={{ color: charcoalBlack }}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Location (State/UT)</InputLabel>
              <Select
                value={tempLoc && stateItems.includes(tempLoc) ? tempLoc : ""}
                label="Location (State/UT)"
                onChange={(e) => setTempLoc(e.target.value || null)}
              >
                <MenuItem value="">Select location</MenuItem>
                {stateItems.map((s) => (
                  <MenuItem key={s} value={s} sx={{ color: charcoalBlack }}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={!!tempIncludeExpired}
                  onChange={(e) => setTempIncludeExpired(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: emeraldGreen,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      bgcolor: emeraldGreen,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: charcoalBlack }}>
                  Include expired
                </Typography>
              }
            />

            <Divider />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {tempDept ? (
                <Chip label={`Dept: ${tempDept}`} />
              ) : (
                <Chip label="Dept: Any" variant="outlined" />
              )}
              {tempLoc ? (
                <Chip label={`Loc: ${tempLoc}`} />
              ) : (
                <Chip label="Loc: Any" variant="outlined" />
              )}
              <Chip
                label={`Expired: ${tempIncludeExpired ? "Yes" : "No"}`}
                variant="outlined"
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ bgcolor: cardBackground, p: 2 }}>
          <Button
            variant="outlined"
            onClick={clearFilters}
            sx={{
              borderColor: "rgba(123,111,87,0.35)",
              color: deepJungleGreen,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={applyFilters}
            sx={{
              bgcolor: emeraldGreen,
              color: "#fff",
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              "&:hover": { bgcolor: emeraldGreen },
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        gridColumn: { xs: "span 12", md: "span 4" },
        bgcolor: "#fff",
        borderRadius: 2,
        border: "1px solid rgba(123,111,87,0.18)",
        p: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
          color: "rgba(96,93,93,1)",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{ color: emeraldGreen, display: "flex", alignItems: "center" }}
        >
          {icon}
        </Box>
        <Typography
          sx={{ fontSize: 28, fontWeight: 900, color: "rgba(0,0,0,0.87)" }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

function JobCard({ item, onClick }) {
  const job = item?.jobData || {};
  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        mb: 2,
        bgcolor: "#fff",
        borderRadius: 2,
        border: "1px solid rgba(123,111,87,0.20)",
        cursor: "pointer",
        "&:hover": { borderColor: "rgba(25,95,78,0.45)" },
      }}
    >
      <Box sx={{ p: 2.5, display: "flex", alignItems: "stretch", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontSize: 20, fontWeight: 900, color: deepJungleGreen }}
          >
            {job?.title || "No Title"}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 16, color: charcoalBlack }}>
            {job?.company || "No Company"}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 90,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GroupsOutlinedIcon style={{ color: emeraldGreen, fontSize: 28 }} />
          <Typography
            sx={{ fontSize: 20, fontWeight: 900, color: emeraldGreen }}
          >
            {String(job?.applicants_count ?? 0)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: mutedOlive }}>
            Applicants
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function ShimmerList() {
  return (
    <Box sx={{ p: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Paper
          key={i}
          elevation={0}
          sx={{
            mb: 2,
            bgcolor: "#fff",
            borderRadius: 2,
            p: 2.5,
          }}
        >
          <Skeleton variant="text" width="45%" height={26} />
          <Skeleton variant="text" width="65%" height={20} />
          <Skeleton
            variant="rectangular"
            height={22}
            sx={{ mt: 1, borderRadius: 1 }}
          />
        </Paper>
      ))}
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
      <Box sx={{ textAlign: "center" }}>
        <WorkOutlineIcon style={{ fontSize: 80, color: mutedOlive }} />
        <Typography
          sx={{ mt: 2, fontSize: 22, fontWeight: 900, color: deepJungleGreen }}
        >
          No Jobs Posted Yet
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 16, color: mutedOlive }}>
          Post a job to start finding talent.
        </Typography>
      </Box>
    </Box>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 8, px: 2 }}>
      <Box sx={{ textAlign: "center", maxWidth: 520 }}>
        <ErrorOutlineRoundedIcon style={{ fontSize: 80, color: "#ff5252" }} />
        <Typography
          sx={{ mt: 2, fontSize: 22, fontWeight: 900, color: deepJungleGreen }}
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
            borderRadius: 2,
          }}
        >
          Retry
        </Button>
      </Box>
    </Box>
  );
}
