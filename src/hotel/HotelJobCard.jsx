import React from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";

const deepJungleGreen = "#0F3D34";
// const terracottaBrown = "#E57734";
const charcoalBlack = "#1C1C1C";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";

export default function HotelJobCard({ job, onTap }) {
  const title = job?.title || "No Title";
  const company = job?.company || "No Company";
  const description = job?.description || "No description available.";
  const location = job?.location || "NA";
  const jobtype = job?.jobtype || "NA";
  const salary = job?.salary || "Not disclosed";

  return (
    <Paper
      onClick={onTap}
      elevation={0}
      sx={{
        bgcolor: cardBackground,
        borderRadius: 3,
        border: `1px solid rgba(123,111,87,0.30)`,
        cursor: "pointer",
        overflow: "hidden",
        "&:hover": { borderColor: "rgba(25,95,78,0.45)" },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography
          sx={{ fontSize: 22, fontWeight: 900, color: deepJungleGreen }}
        >
          {title}
        </Typography>

        <Typography
          sx={{ mt: 1, fontSize: 16, color: charcoalBlack, fontWeight: 700 }}
        >
          {company}
        </Typography>

        <Typography
          sx={{ mt: 2, fontSize: 14, color: mutedOlive, lineHeight: 1.6 }}
        >
          {description}
        </Typography>

        <Divider sx={{ my: 2, opacity: 0.5 }} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <InfoChip
            icon={
              <LocationOnOutlinedIcon
                sx={{ fontSize: 18, color: mutedOlive }}
              />
            }
            text={location}
          />
          <InfoChip
            icon={
              <WorkOutlineRoundedIcon
                sx={{ fontSize: 18, color: mutedOlive }}
              />
            }
            text={jobtype}
          />
          <InfoChip
            icon={
              <AttachMoneyRoundedIcon
                sx={{ fontSize: 18, color: mutedOlive }}
              />
            }
            text={salary}
          />
        </Box>
      </Box>
    </Paper>
  );
}

function InfoChip({ icon, text }) {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, maxWidth: "100%" }}
    >
      {icon}
      <Typography
        sx={{ fontSize: 14, color: "rgba(28,28,28,0.90)", fontWeight: 600 }}
        noWrap
      >
        {text}
      </Typography>
    </Box>
  );
}
