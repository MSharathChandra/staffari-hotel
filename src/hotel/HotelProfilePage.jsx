import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Avatar,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

/** STAFFARI UI CONSTANTS (matching your dashboard/Dart) */
const emeraldGreen = "#195F4E";
const deepJungleGreen = "#0F3D34";
const mutedOlive = "#7B6F57";
const cardBackground = "#FDF9F0";
const charcoalBlack = "#1C1C1C";

const API_BASE = "https://hhs-backend-1fmx.onrender.com";

const amenityOptions = [
  "Free WiFi",
  "Pool",
  "Spa",
  "Gym",
  "Restaurant",
  "Bar",
  "Parking",
  "Airport Shuttle",
  "Pet Friendly",
  "Private Beach",
  "EV Charging",
  "Other",
];

const steps = [
  "Structure",
  "Basic Info",
  "Location & Contact",
  "Media",
  "Details & Legal",
];

async function fileToDataUri(file) {
  if (!file) return null;
  const bytes = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${b64}`;
}

function isValidEmail(v) {
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function toIntOrNull(v) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  multiline,
  rows,
  helperText,
  error,
}) {
  return (
    <TextField
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      size="small"
      type={type}
      multiline={multiline}
      rows={rows}
      helperText={helperText}
      error={error}
      sx={{
        "& .MuiInputBase-root": { bgcolor: cardBackground },
        "& .MuiInputLabel-root": { color: mutedOlive },
      }}
      required={required}
    />
  );
}

export default function HotelProfilePage({ hotelId, email }) {
  const isMobile = useMediaQuery("(max-width:900px)");

  const theme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: "Poppins, Arial, sans-serif" },
        palette: {
          primary: { main: deepJungleGreen },
          secondary: { main: emeraldGreen },
          background: { paper: cardBackground },
          text: { primary: deepJungleGreen },
        },
      }),
    [],
  );

  // Viewer / edit mode
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fetched from backend (for viewer + edit hydration)
  const [profile, setProfile] = useState(null);

  // Stepper state (edit wizard)
  const [currentStep, setCurrentStep] = useState(0);

  // Structure
  const [isParent, setIsParent] = useState(null); // boolean | null
  const [branch, setBranch] = useState("");
  const [selectedParent, setSelectedParent] = useState(null); // {hotelid, hotelname, branch}

  // Parent hotels list
  const [parentHotels, setParentHotels] = useState([]);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");

  // Profile fields (mirroring Dart profileData keys)
  const [hotelname, setHotelname] = useState("");
  const [starrating, setStarrating] = useState("");
  const [hoteltype, setHoteltype] = useState("");
  const [websiteurl, setWebsiteurl] = useState("");
  const [googlemapslink, setGooglemapslink] = useState("");
  const [addressline1, setAddressline1] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalcode, setPostalcode] = useState("");
  const [country, setCountry] = useState("");
  const [businessregistrationnumber, setBusinessregistrationnumber] =
    useState("");
  const [licensenumber, setLicensenumber] = useState("");
  const [description, setDescription] = useState("");
  const [numberofrooms, setNumberofrooms] = useState("");
  const [yearestablished, setYearestablished] = useState("");
  const [hrcontactname, setHrcontactname] = useState("");
  const [hrcontactemail, setHrcontactemail] = useState("");
  const [hrcontactphone, setHrcontactphone] = useState("");
  const [logourl, setLogourl] = useState("");
  const [bannerimageurl, setBannerimageurl] = useState("");

  // Media (existing URLs + new files)
  const [existingProfilePicUrl, setExistingProfilePicUrl] = useState("");
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [profileImageFile, setProfileImageFile] = useState(null); // File
  const [galleryFiles, setGalleryFiles] = useState([]); // File[]

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Dialog: add other amenity
  const [otherAmenityOpen, setOtherAmenityOpen] = useState(false);
  const [otherAmenityValue, setOtherAmenityValue] = useState("");

  // Simple UI messages
  const [errorMsg, setErrorMsg] = useState("");

  const filteredParentHotels = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return parentHotels;
    return parentHotels.filter((h) => {
      const name = String(h.hotelname ?? "").toLowerCase();
      const br = String(h.branch ?? "").toLowerCase();
      return name.includes(q) || br.includes(q);
    });
  }, [parentSearch, parentHotels]);

  function hydrateFromInitial(d) {
    if (!d) return;

    setHotelname(d.hotelname ?? "");
    setStarrating(d.starrating ?? "");
    setHoteltype(d.hoteltype ?? "");
    setWebsiteurl(d.websiteurl ?? "");
    setGooglemapslink(d.googlemapslink ?? "");
    setAddressline1(d.addressline1 ?? "");
    setCity(d.city ?? "");
    setStateVal(d.state ?? "");
    setPostalcode(d.postalcode ?? "");
    setCountry(d.country ?? "");
    setBusinessregistrationnumber(d.businessregistrationnumber ?? "");
    setLicensenumber(d.licensenumber ?? "");
    setDescription(d.description ?? "");
    setNumberofrooms(d.numberofrooms ?? "");
    setYearestablished(d.yearestablished ?? "");
    setHrcontactname(d.hrcontactname ?? "");
    setHrcontactemail(d.hrcontactemail ?? "");
    setHrcontactphone(d.hrcontactphone ?? "");
    setLogourl(d.logourl ?? "");
    setBannerimageurl(d.bannerimageurl ?? "");

    setExistingProfilePicUrl(String(d.profilepicurl ?? "").trim());
    setExistingGalleryUrls(
      Array.isArray(d.galleryimageurls) ? d.galleryimageurls.map(String) : [],
    );
    setSelectedAmenities(
      Array.isArray(d.amenities) ? d.amenities.map(String) : [],
    );

    if (typeof d.isparent === "boolean") setIsParent(d.isparent);
    if (String(d.branch ?? "").trim()) setBranch(String(d.branch).trim());

    if (String(d.parenthotelid ?? "").trim()) {
      setSelectedParent({
        hotelid: d.parenthotelid,
        hotelname: d.parenthotelname,
        branch: d.parentbranch,
      });
    }
  }

  async function fetchParentHotels() {
    try {
      const url = `${API_BASE}/hotel/getallhotelslist?parentonly=true`;
      const res = await fetch(url, { method: "GET" });
      const json = await res.json().catch(() => null);
      const items = json?.hotels ?? [];
      const mapped = Array.isArray(items)
        ? items.map((e) => ({
            hotelid: e.hotelid,
            hotelname: e.hotelname,
            branch: e.branch ?? "",
          }))
        : [];
      setParentHotels(mapped);
    } catch {
      // ignore
    }
  }

  async function fetchProfile() {
    // You MUST align this to your real backend route.
    // The Dart snippet doesn't show the viewer fetch endpoint.
    const candidates = [];
    if (hotelId)
      candidates.push(
        `${API_BASE}/hotel/get-profile?hotelid=${encodeURIComponent(hotelId)}`,
      );
    if (email)
      candidates.push(
        `${API_BASE}/hotel/get-profile?email=${encodeURIComponent(email)}`,
      );

    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) continue;
        const data = await res.json().catch(() => null);
        // Accept either {profile:{...}} or direct object
        const p = data?.profile ?? data;
        if (p && typeof p === "object") return p;
      } catch {
        // try next
      }
    }
    return null;
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErrorMsg("");

      await fetchParentHotels();

      const p = await fetchProfile();
      if (!alive) return;

      setProfile(p);
      if (p) hydrateFromInitial(p);

      setLoading(false);
      setMode(p ? "view" : "edit");
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, email]);

  function openUrl(url) {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  }

  function validateStep(stepIdx) {
    setErrorMsg("");

    // Mirrors Dart validators at a practical level
    if (stepIdx === 0) {
      if (isParent === null) return "Please choose Parent or Child.";
      if (!branch.trim()) return "Please enter Branch.";
      if (isParent === false && !selectedParent)
        return "Please select a parent hotel.";
    }

    if (stepIdx === 1) {
      if (!hotelname.trim()) return "Please enter Hotel Name.";
      if (!starrating.trim()) return "Please enter Star Rating.";
      if (!hoteltype.trim()) return "Please enter Hotel Type.";
      if (!yearestablished.trim()) return "Please enter Year Established.";
      if (!description.trim()) return "Please enter Description.";
    }

    if (stepIdx === 2) {
      if (!addressline1.trim()) return "Please enter Address.";
      if (!city.trim()) return "Please enter City.";
      if (!stateVal.trim()) return "Please enter State.";
      if (!postalcode.trim()) return "Please enter Postal Code.";
      if (!country.trim()) return "Please enter Country.";
      if (!hrcontactname.trim()) return "Please enter HR Contact Name.";
      if (!hrcontactemail.trim() || !isValidEmail(hrcontactemail.trim()))
        return "Please enter a valid HR Contact Email.";
      if (!hrcontactphone.trim()) return "Please enter HR Contact Phone.";
    }

    if (stepIdx === 4) {
      if (!websiteurl.trim()) return "Please enter Website URL.";
      if (!businessregistrationnumber.trim())
        return "Please enter Business Registration Number.";
      if (!numberofrooms.trim()) return "Please enter Number of Rooms.";
      if (!selectedAmenities.length)
        return "Please select at least one amenity.";
    }

    return null;
  }

  async function submitProfile() {
    setSaving(true);
    setErrorMsg("");

    try {
      const userId =
        localStorage.getItem("uid") || localStorage.getItem("userid");
      if (!userId) {
        setErrorMsg("Error: User not found.");
        setSaving(false);
        return;
      }

      const profilePicBase64 = profileImageFile
        ? await fileToDataUri(profileImageFile)
        : null;
      const galleryBase64 = [];
      for (const f of galleryFiles) {
        const uri = await fileToDataUri(f);
        if (uri) galleryBase64.push(uri);
      }

      const body = {
        userid: userId,
        hotelname: hotelname.trim(),
        starrating: starrating.trim(),
        hoteltype: hoteltype.trim(),
        websiteurl: websiteurl.trim(),
        googlemapslink: googlemapslink.trim(),
        addressline1: addressline1.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        postalcode: postalcode.trim(),
        country: country.trim(),
        businessregistrationnumber: businessregistrationnumber.trim(),
        licensenumber: licensenumber.trim(),
        description: description.trim(),
        numberofrooms: toIntOrNull(numberofrooms) ?? numberofrooms.trim(),
        yearestablished: toIntOrNull(yearestablished) ?? yearestablished.trim(),
        hrcontactname: hrcontactname.trim(),
        hrcontactemail: hrcontactemail.trim(),
        hrcontactphone: hrcontactphone.trim(),
        logourl: logourl.trim(),
        amenities: selectedAmenities,
      };

      // Preserve banner url if present (mirrors Dart)
      if (bannerimageurl && bannerimageurl.trim())
        body.bannerimageurl = bannerimageurl.trim();

      // Structure fields
      if (isParent !== null) body.isparent = isParent;
      if (branch.trim()) body.branch = branch.trim();
      if (isParent === false && selectedParent) {
        body.parenthotelid = selectedParent.hotelid;
        body.parenthotelname = selectedParent.hotelname;
        body.parentbranch = selectedParent.branch;
      }

      // Existing media URLs
      if (existingProfilePicUrl && existingProfilePicUrl.trim())
        body.profilepicurl = existingProfilePicUrl.trim();
      if (Array.isArray(existingGalleryUrls) && existingGalleryUrls.length)
        body.galleryimageurls = existingGalleryUrls;

      // New uploads
      if (profilePicBase64) body.profilepicfilebase64 = profilePicBase64;
      if (galleryBase64.length) body.galleryfilesbase64 = galleryBase64;

      const url = `${API_BASE}/hotel/create-or-update-profile`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create profile");
      }

      // Re-fetch profile for viewer + reset wizard
      const p = await fetchProfile();
      setProfile(p || body);
      setMode("view");
      setCurrentStep(0);
    } catch {
      setErrorMsg("Error creating profile.");
    } finally {
      setSaving(false);
    }
  }

  function onNext() {
    const err = validateStep(currentStep);
    if (err) return setErrorMsg(err);

    if (currentStep === steps.length - 1) {
      submitProfile();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function onBack() {
    setErrorMsg("");
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function removeGalleryAt(idx) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function addAmenity(value) {
    if (!value) return;
    if (value === "Other") {
      setOtherAmenityValue("");
      setOtherAmenityOpen(true);
      return;
    }
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev : [...prev, value],
    );
  }

  function confirmOtherAmenity() {
    const cleaned = otherAmenityValue.trim();
    if (!cleaned) return;
    setSelectedAmenities((prev) =>
      prev.includes(cleaned) ? prev : [...prev, cleaned],
    );
    setOtherAmenityOpen(false);
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            minHeight: "70vh",
          }}
        >
          <CircularProgress sx={{ color: emeraldGreen }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <Paper
          elevation={1}
          sx={{
            maxWidth: 1100,
            mx: "auto",
            bgcolor: cardBackground,
            borderRadius: 2,
            p: isMobile ? 1.5 : 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography
              sx={{ fontWeight: 800, color: deepJungleGreen, fontSize: 18 }}
            >
              Hotel Profile
            </Typography>

            <Stack direction="row" spacing={1}>
              {mode === "view" && (
                <Button
                  variant="contained"
                  onClick={() => setMode("edit")}
                  sx={{
                    bgcolor: emeraldGreen,
                    "&:hover": { bgcolor: emeraldGreen },
                  }}
                >
                  Edit profile
                </Button>
              )}
              {mode === "edit" && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setMode(profile ? "view" : "view");
                    setErrorMsg("");
                  }}
                  sx={{
                    borderColor: "rgba(15, 61, 52, 0.25)",
                    color: deepJungleGreen,
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>

          <Typography sx={{ color: mutedOlive, fontSize: 13, mb: 2 }}>
            {mode === "view"
              ? "View your public listing details and media."
              : "Complete the steps to create or update your profile."}
          </Typography>

          {errorMsg ? (
            <Paper
              variant="outlined"
              sx={{
                mb: 2,
                p: 1.2,
                borderColor: "rgba(255, 0, 0, 0.25)",
                bgcolor: "rgba(255, 0, 0, 0.03)",
              }}
            >
              <Typography sx={{ color: "red", fontSize: 13 }}>
                {errorMsg}
              </Typography>
            </Paper>
          ) : null}

          {mode === "view" ? (
            <Viewer profile={profile} onOpenUrl={openUrl} />
          ) : (
            <>
              <Stepper
                activeStep={currentStep}
                alternativeLabel={!isMobile}
                sx={{ mb: 2 }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        "& .MuiStepLabel-label": {
                          fontFamily: "Poppins, Arial, sans-serif",
                        },
                        "& .MuiStepIcon-root.Mui-active": {
                          color: emeraldGreen,
                        },
                        "& .MuiStepIcon-root.Mui-completed": {
                          color: emeraldGreen,
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider
                sx={{ mb: 2, borderColor: "rgba(123, 111, 87, 0.25)" }}
              />

              {currentStep === 0 && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: deepJungleGreen }}>
                    Structure
                  </Typography>
                  <Typography
                    sx={{ color: mutedOlive, fontSize: 13, lineHeight: 1.4 }}
                  >
                    Is this a parent (head) hotel or a child (branch)?
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant={isParent === true ? "contained" : "outlined"}
                      onClick={() => setIsParent(true)}
                      sx={chipBtnSx(isParent === true)}
                    >
                      Parent
                    </Button>
                    <Button
                      variant={isParent === false ? "contained" : "outlined"}
                      onClick={() => setIsParent(false)}
                      sx={chipBtnSx(isParent === false)}
                    >
                      Child
                    </Button>
                  </Stack>

                  <Field
                    label="Branch"
                    value={branch}
                    onChange={setBranch}
                    required
                  />

                  {isParent === false && (
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: deepJungleGreen,
                          fontSize: 14,
                          mb: 1,
                        }}
                      >
                        Select Parent Hotel
                      </Typography>

                      <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setParentPickerOpen(true)}
                        sx={{
                          borderColor: "rgba(123, 111, 87, 0.5)",
                          color: deepJungleGreen,
                          textTransform: "none",
                        }}
                      >
                        {selectedParent
                          ? `${selectedParent.hotelname}${selectedParent.branch ? ` — ${selectedParent.branch}` : ""}`
                          : "Choose Parent"}
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}

              {currentStep === 1 && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: deepJungleGreen }}>
                    Basic Info
                  </Typography>
                  <Field
                    label="Hotel Name"
                    value={hotelname}
                    onChange={setHotelname}
                    required
                  />
                  <Field
                    label="Star Rating"
                    value={starrating}
                    onChange={setStarrating}
                    required
                  />
                  <Field
                    label="Hotel Type (e.g., Resort, Business)"
                    value={hoteltype}
                    onChange={setHoteltype}
                    required
                  />
                  <Field
                    label="Year Established"
                    value={yearestablished}
                    onChange={setYearestablished}
                    required
                  />
                  <Field
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    required
                    multiline
                    rows={4}
                  />
                </Stack>
              )}

              {currentStep === 2 && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: deepJungleGreen }}>
                    Location & Contact
                  </Typography>
                  <Field
                    label="Address"
                    value={addressline1}
                    onChange={setAddressline1}
                    required
                  />
                  <Stack direction={isMobile ? "column" : "row"} spacing={1.5}>
                    <Field
                      label="City"
                      value={city}
                      onChange={setCity}
                      required
                    />
                    <Field
                      label="State"
                      value={stateVal}
                      onChange={setStateVal}
                      required
                    />
                  </Stack>
                  <Stack direction={isMobile ? "column" : "row"} spacing={1.5}>
                    <Field
                      label="Postal Code"
                      value={postalcode}
                      onChange={setPostalcode}
                      required
                    />
                    <Field
                      label="Country"
                      value={country}
                      onChange={setCountry}
                      required
                    />
                  </Stack>
                  <Divider sx={{ borderColor: "rgba(123, 111, 87, 0.25)" }} />
                  <Field
                    label="HR Contact Name"
                    value={hrcontactname}
                    onChange={setHrcontactname}
                    required
                  />
                  <Field
                    label="HR Contact Email"
                    value={hrcontactemail}
                    onChange={setHrcontactemail}
                    required
                    error={
                      hrcontactemail ? !isValidEmail(hrcontactemail) : false
                    }
                    helperText={
                      hrcontactemail && !isValidEmail(hrcontactemail)
                        ? "Enter a valid email."
                        : ""
                    }
                  />
                  <Field
                    label="HR Contact Phone"
                    value={hrcontactphone}
                    onChange={setHrcontactphone}
                    required
                  />
                </Stack>
              )}

              {currentStep === 3 && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: deepJungleGreen }}>
                    Media
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: cardBackground,
                      borderColor: "rgba(123, 111, 87, 0.5)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, color: deepJungleGreen, mb: 1 }}
                    >
                      Profile Picture
                    </Typography>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: "rgba(123,111,87,0.25)",
                          color: deepJungleGreen,
                        }}
                        src={
                          profileImageFile
                            ? URL.createObjectURL(profileImageFile)
                            : undefined
                        }
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{ color: charcoalBlack, fontSize: 13 }}
                          noWrap
                        >
                          {profileImageFile?.name ||
                            (existingProfilePicUrl
                              ? "Existing profile image"
                              : "Upload JPG/PNG")}
                        </Typography>
                      </Box>

                      {existingProfilePicUrl ? (
                        <Tooltip title="View">
                          <IconButton
                            onClick={() => openUrl(existingProfilePicUrl)}
                            sx={{ color: emeraldGreen }}
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      <Tooltip title="Upload">
                        <IconButton
                          component="label"
                          sx={{ color: emeraldGreen }}
                        >
                          <UploadFileIcon />
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setProfileImageFile(f);
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: cardBackground,
                      borderColor: "rgba(123, 111, 87, 0.5)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, color: deepJungleGreen, mb: 1 }}
                    >
                      Gallery
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {galleryFiles.map((f, idx) => (
                        <Box
                          key={`${f.name}-${idx}`}
                          sx={{ position: "relative" }}
                        >
                          <Box
                            component="img"
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 2,
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeGalleryAt(idx)}
                            sx={{
                              position: "absolute",
                              top: -10,
                              right: -10,
                              bgcolor: "white",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            <CloseIcon fontSize="small" sx={{ color: "red" }} />
                          </IconButton>
                        </Box>
                      ))}

                      {existingGalleryUrls.map((url, idx) => (
                        <Box
                          key={`${url}-${idx}`}
                          component="img"
                          onClick={() => openUrl(url)}
                          src={url}
                          alt="existing"
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                        />
                      ))}

                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AddAPhotoIcon />}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          borderColor: "rgba(123,111,87,0.5)",
                          color: emeraldGreen,
                          textTransform: "none",
                        }}
                      >
                        <input
                          hidden
                          multiple
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length)
                              setGalleryFiles((prev) => [...prev, ...files]);
                          }}
                        />
                      </Button>
                    </Stack>

                    <Typography sx={{ color: mutedOlive, fontSize: 12, mt: 1 }}>
                      Add multiple JPG/PNG images to showcase your property.
                    </Typography>
                  </Paper>
                </Stack>
              )}

              {currentStep === 4 && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: deepJungleGreen }}>
                    Details & Legal
                  </Typography>

                  <Field
                    label="Website URL"
                    value={websiteurl}
                    onChange={setWebsiteurl}
                    required
                  />
                  <Field
                    label="Google Maps Link"
                    value={googlemapslink}
                    onChange={setGooglemapslink}
                  />
                  <Field
                    label="Business Registration Number"
                    value={businessregistrationnumber}
                    onChange={setBusinessregistrationnumber}
                    required
                  />
                  <Field
                    label="Hotel License Number (optional)"
                    value={licensenumber}
                    onChange={setLicensenumber}
                  />
                  <Field
                    label="Number of Rooms"
                    value={numberofrooms}
                    onChange={setNumberofrooms}
                    required
                  />
                  <Field
                    label="Logo URL (optional)"
                    value={logourl}
                    onChange={setLogourl}
                  />

                  <Divider sx={{ borderColor: "rgba(123, 111, 87, 0.25)" }} />

                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: deepJungleGreen,
                      fontSize: 14,
                    }}
                  >
                    Amenities
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      borderColor: "rgba(123,111,87,0.5)",
                      bgcolor: cardBackground,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {selectedAmenities.map((a) => (
                        <Chip
                          key={a}
                          label={a}
                          onDelete={() =>
                            setSelectedAmenities((prev) =>
                              prev.filter((x) => x !== a),
                            )
                          }
                          sx={{
                            bgcolor: "rgba(15, 61, 52, 0.08)",
                            color: deepJungleGreen,
                            "& .MuiChip-deleteIcon": { color: "red" },
                          }}
                        />
                      ))}
                      {!selectedAmenities.length ? (
                        <Typography sx={{ color: mutedOlive, fontSize: 13 }}>
                          No amenities selected yet.
                        </Typography>
                      ) : null}
                    </Stack>

                    <Box sx={{ mt: 1.2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Add amenity</InputLabel>
                        <Select
                          value=""
                          onChange={(e) => addAmenity(e.target.value)}
                          input={<OutlinedInput label="Add amenity" />}
                          sx={{ bgcolor: "white" }}
                        >
                          {amenityOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Paper>
                </Stack>
              )}

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mt: 3 }}
                alignItems="center"
              >
                <Button
                  disabled={currentStep === 0 || saving}
                  onClick={onBack}
                  sx={{ color: mutedOlive, textTransform: "none" }}
                >
                  Back
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button
                  variant="contained"
                  onClick={onNext}
                  disabled={saving}
                  sx={{
                    bgcolor: emeraldGreen,
                    "&:hover": { bgcolor: emeraldGreen },
                    textTransform: "none",
                    px: 4,
                  }}
                >
                  {saving ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} sx={{ color: "white" }} />
                      <span>Saving…</span>
                    </Stack>
                  ) : currentStep === steps.length - 1 ? (
                    "Submit"
                  ) : (
                    "Next"
                  )}
                </Button>
              </Stack>
            </>
          )}
        </Paper>

        {/* Parent picker dialog */}
        <Dialog
          open={parentPickerOpen}
          onClose={() => setParentPickerOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800, color: deepJungleGreen }}>
            Select Parent Hotel
          </DialogTitle>
          <DialogContent>
            <TextField
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              placeholder="Search by name or branch"
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: mutedOlive }} />
                ),
              }}
              sx={{ mb: 1.5, "& .MuiInputBase-root": { bgcolor: "white" } }}
            />

            <Paper
              variant="outlined"
              sx={{ borderColor: "rgba(123,111,87,0.5)" }}
            >
              <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                {filteredParentHotels.length === 0 ? (
                  <Typography sx={{ p: 2, color: mutedOlive }}>
                    No parent hotels found.
                  </Typography>
                ) : (
                  filteredParentHotels.map((h) => (
                    <ListItemButton
                      key={h.hotelid}
                      onClick={() => {
                        setSelectedParent(h);
                        setParentPickerOpen(false);
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontWeight: 700, color: deepJungleGreen }}
                          >
                            {h.hotelname || "Unnamed hotel"}
                          </Typography>
                        }
                        secondary={
                          h.branch ? (
                            <Typography
                              sx={{ fontSize: 12, color: mutedOlive }}
                            >
                              Branch: {h.branch}
                            </Typography>
                          ) : null
                        }
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setParentPickerOpen(false)}
              sx={{ color: deepJungleGreen }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add other amenity dialog */}
        <Dialog
          open={otherAmenityOpen}
          onClose={() => setOtherAmenityOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 800, color: deepJungleGreen }}>
            Add amenity
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: mutedOlive, fontSize: 13, mb: 1 }}>
              Enter a custom amenity to include in your listing.
            </Typography>
            <TextField
              value={otherAmenityValue}
              onChange={(e) => setOtherAmenityValue(e.target.value)}
              placeholder="e.g., Rooftop Cinema"
              fullWidth
              size="small"
              sx={{ "& .MuiInputBase-root": { bgcolor: "white" } }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOtherAmenityOpen(false)}
              sx={{ color: deepJungleGreen }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={confirmOtherAmenity}
              sx={{
                bgcolor: emeraldGreen,
                "&:hover": { bgcolor: emeraldGreen },
              }}
            >
              Add amenity
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

function chipBtnSx(active) {
  return {
    textTransform: "none",
    borderColor: active ? emeraldGreen : "rgba(123, 111, 87, 0.6)",
    bgcolor: active ? "rgba(25, 95, 78, 0.18)" : "transparent",
    color: deepJungleGreen,
    "&:hover": {
      bgcolor: active ? "rgba(25, 95, 78, 0.18)" : "rgba(25, 95, 78, 0.08)",
      borderColor: emeraldGreen,
    },
  };
}

function Viewer({ profile, onOpenUrl }) {
  if (!profile) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderColor: "rgba(123,111,87,0.5)",
          bgcolor: cardBackground,
        }}
      >
        <Typography sx={{ color: mutedOlive }}>
          No profile found yet. Please complete setup.
        </Typography>
      </Paper>
    );
  }

  const gallery = Array.isArray(profile.galleryimageurls)
    ? profile.galleryimageurls
    : [];
  const amenities = Array.isArray(profile.amenities) ? profile.amenities : [];

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderColor: "rgba(123,111,87,0.5)",
          bgcolor: cardBackground,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "rgba(123,111,87,0.25)",
              color: deepJungleGreen,
            }}
            src={profile.profilepicurl || undefined}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 900, color: deepJungleGreen, fontSize: 18 }}
              noWrap
            >
              {profile.hotelname || "Hotel"}
            </Typography>
            <Typography sx={{ color: mutedOlive, fontSize: 13 }}>
              {profile.hoteltype ? `${profile.hoteltype} · ` : ""}
              {profile.starrating ? `${profile.starrating} star` : ""}
            </Typography>
          </Box>

          {profile.websiteurl ? (
            <Button
              variant="outlined"
              onClick={() => onOpenUrl(profile.websiteurl)}
              sx={{
                borderColor: "rgba(123,111,87,0.5)",
                color: deepJungleGreen,
                textTransform: "none",
              }}
            >
              Website
            </Button>
          ) : null}
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderColor: "rgba(123,111,87,0.5)",
          bgcolor: cardBackground,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: deepJungleGreen, mb: 1 }}>
          About
        </Typography>
        <Typography
          sx={{ color: charcoalBlack, fontSize: 14, whiteSpace: "pre-wrap" }}
        >
          {profile.description || "—"}
        </Typography>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderColor: "rgba(123,111,87,0.5)",
          bgcolor: cardBackground,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: deepJungleGreen, mb: 1 }}>
          Amenities
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {amenities.length ? (
            amenities.map((a) => (
              <Chip
                key={a}
                label={a}
                sx={{
                  bgcolor: "rgba(15, 61, 52, 0.08)",
                  color: deepJungleGreen,
                }}
              />
            ))
          ) : (
            <Typography sx={{ color: mutedOlive }}>—</Typography>
          )}
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderColor: "rgba(123,111,87,0.5)",
          bgcolor: cardBackground,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: deepJungleGreen, mb: 1 }}>
          Gallery
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {gallery.length ? (
            gallery.map((url, idx) => (
              <Box
                key={`${url}-${idx}`}
                component="img"
                src={url}
                alt="gallery"
                onClick={() => onOpenUrl(url)}
                sx={{
                  width: 120,
                  height: 90,
                  borderRadius: 2,
                  objectFit: "cover",
                  cursor: "pointer",
                }}
              />
            ))
          ) : (
            <Typography sx={{ color: mutedOlive }}>—</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
