import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import {
  fetchParentHotels,
  submitHotelProfileSetup,
} from "../../../api/hotelProfileSetupApi";

const AMENITY_OPTIONS = [
  "Free Wi‑Fi",
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

function isEmail(s) {
  return /^[^@]+@[^@]+\.[^@]+$/.test(String(s || "").trim());
}

function toDataUri(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // already data:*;base64,...
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function HotelProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // optional initial data when you navigate from profile edit
  const initialProfileData = location.state?.initialProfileData || null;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Parent/child structure
  const [isParent, setIsParent] = useState(
    initialProfileData?.is_parent != null
      ? Boolean(initialProfileData.is_parent)
      : null,
  );
  const [branch, setBranch] = useState(initialProfileData?.branch ?? "");
  const [parentHotels, setParentHotels] = useState([]);
  const [parentSearch, setParentSearch] = useState("");
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(() => {
    if (!initialProfileData?.parent_hotel_id) return null;
    return {
      hotel_id: initialProfileData.parent_hotel_id,
      hotel_name: initialProfileData.parent_hotel_name,
      branch: initialProfileData.parent_branch,
    };
  });

  // Profile fields (snake_case like Flutter)
  const [profileData, setProfileData] = useState(() => ({
    hotel_name: initialProfileData?.hotel_name ?? "",
    star_rating: initialProfileData?.star_rating ?? "",
    hotel_type: initialProfileData?.hotel_type ?? "",
    year_established: initialProfileData?.year_established ?? "",
    description: initialProfileData?.description ?? "",

    website_url: initialProfileData?.website_url ?? "",
    google_maps_link: initialProfileData?.google_maps_link ?? "",

    address_line_1: initialProfileData?.address_line_1 ?? "",
    city: initialProfileData?.city ?? "",
    state: initialProfileData?.state ?? "",
    postal_code: initialProfileData?.postal_code ?? "",
    country: initialProfileData?.country ?? "",

    hr_contact_name: initialProfileData?.hr_contact_name ?? "",
    hr_contact_email: initialProfileData?.hr_contact_email ?? "",
    hr_contact_phone: initialProfileData?.hr_contact_phone ?? "",

    business_registration_number:
      initialProfileData?.business_registration_number ?? "",
    license_number: initialProfileData?.license_number ?? "",
    number_of_rooms: initialProfileData?.number_of_rooms ?? "",
    logo_url: initialProfileData?.logo_url ?? "",

    banner_image_url: initialProfileData?.banner_image_url ?? null,
  }));

  // Media
  const [existingProfilePicUrl] = useState(
    initialProfileData?.profile_pic_url ?? "",
  );
  const [profileImageFile, setProfileImageFile] = useState(null);

  const [existingGalleryUrls] = useState(
    Array.isArray(initialProfileData?.gallery_image_urls)
      ? initialProfileData.gallery_image_urls
      : [],
  );
  const [galleryFiles, setGalleryFiles] = useState([]);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState(
    Array.isArray(initialProfileData?.amenities)
      ? initialProfileData.amenities
      : [],
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchParentHotels();
        setParentHotels(list);
      } catch {
        setParentHotels([]);
      }
    })();
  }, []);

  const filteredParents = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return parentHotels;
    return parentHotels.filter((h) => {
      const name = String(h?.hotel_name || "").toLowerCase();
      const br = String(h?.branch || "").toLowerCase();
      return name.includes(q) || br.includes(q);
    });
  }, [parentHotels, parentSearch]);

  const setField = (k, v) => setProfileData((p) => ({ ...p, [k]: v }));

  const addAmenity = async (value) => {
    if (value === "Other") {
      const custom = window.prompt("Add amenity", "e.g., Rooftop Cinema");
      const cleaned = (custom || "").trim();
      if (!cleaned) return;
      setSelectedAmenities((prev) =>
        prev.includes(cleaned) ? prev : [...prev, cleaned],
      );
      return;
    }
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev : [...prev, value],
    );
  };

  const removeAmenity = (value) => {
    setSelectedAmenities((prev) => prev.filter((x) => x !== value));
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (isParent !== true && isParent !== false)
        return "Please choose Parent or Child.";
      if (!String(branch).trim()) return "Please enter Branch.";
      if (isParent === false && !selectedParent)
        return "Please select a parent hotel.";
    }

    if (currentStep === 1) {
      if (!String(profileData.hotel_name).trim())
        return "Hotel Name is required.";
      if (!String(profileData.star_rating).trim())
        return "Star Rating is required.";
      if (!String(profileData.hotel_type).trim())
        return "Hotel Type is required.";
    }

    if (currentStep === 2) {
      if (!String(profileData.address_line_1).trim())
        return "Address is required.";
      if (!String(profileData.city).trim()) return "City is required.";
      if (!String(profileData.state).trim()) return "State is required.";
      if (!String(profileData.postal_code).trim())
        return "Postal Code is required.";
      if (!String(profileData.country).trim()) return "Country is required.";
      if (!String(profileData.hr_contact_name).trim())
        return "HR Contact Name is required.";
      if (
        !String(profileData.hr_contact_email).trim() ||
        !isEmail(profileData.hr_contact_email)
      )
        return "Enter a valid HR Contact Email.";
      if (!String(profileData.hr_contact_phone).trim())
        return "HR Contact Phone is required.";
    }

    if (currentStep === 4) {
      if (!String(profileData.website_url).trim())
        return "Website URL is required.";
      if (!String(profileData.business_registration_number).trim())
        return "Business Registration Number is required.";
      if (!String(profileData.number_of_rooms).trim())
        return "Number of Rooms is required.";
      if (selectedAmenities.length === 0)
        return "Please select at least one amenity.";
    }

    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return alert(err);
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const back = () => setCurrentStep((s) => Math.max(0, s - 1));

  const onSubmit = async () => {
    const err = validateStep();
    if (err) return alert(err);

    const userId = lsGet("uid", null);
    if (!userId) {
      alert("User not logged in.");
      navigate("/signin", { replace: true });
      return;
    }

    setIsLoading(true);
    try {
      // Encode media like Flutter: data:*;base64,... [file:131]
      const profilePicBase64 = profileImageFile
        ? await toDataUri(profileImageFile)
        : null;
      const galleryBase64 = [];
      for (const f of galleryFiles) {
        const uri = await toDataUri(f);
        if (uri) galleryBase64.push(uri);
      }

      const body = {
        userid: userId, // Flutter setup uses "userid" [file:131]
        ...profileData,
        amenities: selectedAmenities,

        is_parent: isParent,
        branch: String(branch || "").trim(),

        ...(isParent === false && selectedParent
          ? {
              parent_hotel_id: selectedParent.hotel_id,
              parent_hotel_name: selectedParent.hotel_name,
              parent_branch: selectedParent.branch,
            }
          : {}),

        ...(existingProfilePicUrl && String(existingProfilePicUrl).trim()
          ? { profile_pic_url: String(existingProfilePicUrl).trim() }
          : {}),

        ...(profilePicBase64
          ? { profile_pic_file_base64: profilePicBase64 }
          : {}),

        ...(existingGalleryUrls.length
          ? { gallery_image_urls: existingGalleryUrls }
          : {}),

        ...(galleryBase64.length
          ? { gallery_files_base64: galleryBase64 }
          : {}),
      };

      await submitHotelProfileSetup(body);

      alert("Profile created successfully!");
      navigate("/hotel/profile", { replace: true });
    } catch {
      alert("Error creating profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: staffari.earthyBeige,
        fontFamily: "Poppins, system-ui",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: staffari.earthyBeige,
          padding: "14px 16px",
          borderBottom: "1px solid rgba(123,111,87,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate("/hotel")}
          style={topBtn()}
          title="Back to Dashboard"
        >
          ←
        </button>
        <div
          style={{
            fontFamily: "Space Grotesk, system-ui",
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          Hotel Profile Setup
        </div>
        <div
          style={{
            marginLeft: "auto",
            color: staffari.mutedOlive,
            fontWeight: 900,
          }}
        >
          Step {currentStep + 1}/5
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        {currentStep === 0 ? (
          <Section title="Structure">
            <div
              style={{
                color: staffari.mutedOlive,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Is this a parent (head) hotel or a child (branch)?
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <Choice
                selected={isParent === true}
                onClick={() => setIsParent(true)}
                label="Parent"
              />
              <Choice
                selected={isParent === false}
                onClick={() => setIsParent(false)}
                label="Child"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Label>Branch *</Label>
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={input()}
              />
            </div>

            {isParent === false ? (
              <div style={{ marginTop: 16 }}>
                <Label>Select Parent Hotel</Label>
                <button
                  onClick={() => setParentPickerOpen(true)}
                  style={outlineBtn()}
                >
                  {selectedParent
                    ? `${selectedParent.hotel_name}${selectedParent.branch ? ` — ${selectedParent.branch}` : ""}`
                    : "Choose Parent"}
                </button>
              </div>
            ) : null}
          </Section>
        ) : null}

        {currentStep === 1 ? (
          <Section title="Basic Info">
            <Field
              label="Hotel Name *"
              value={profileData.hotel_name}
              onChange={(v) => setField("hotel_name", v)}
            />
            <Field
              label="Star Rating *"
              value={profileData.star_rating}
              onChange={(v) => setField("star_rating", v)}
            />
            <Field
              label="Hotel Type *"
              value={profileData.hotel_type}
              onChange={(v) => setField("hotel_type", v)}
            />
            <Field
              label="Year Established"
              value={profileData.year_established}
              onChange={(v) => setField("year_established", v)}
            />
            <TextArea
              label="Description"
              value={profileData.description}
              onChange={(v) => setField("description", v)}
            />
          </Section>
        ) : null}

        {currentStep === 2 ? (
          <Section title="Location & Contact">
            <Field
              label="Address *"
              value={profileData.address_line_1}
              onChange={(v) => setField("address_line_1", v)}
            />
            <Field
              label="City *"
              value={profileData.city}
              onChange={(v) => setField("city", v)}
            />
            <Field
              label="State *"
              value={profileData.state}
              onChange={(v) => setField("state", v)}
            />
            <Field
              label="Postal Code *"
              value={profileData.postal_code}
              onChange={(v) => setField("postal_code", v)}
            />
            <Field
              label="Country *"
              value={profileData.country}
              onChange={(v) => setField("country", v)}
            />
            <Field
              label="HR Contact Name *"
              value={profileData.hr_contact_name}
              onChange={(v) => setField("hr_contact_name", v)}
            />
            <Field
              label="HR Contact Email *"
              value={profileData.hr_contact_email}
              onChange={(v) => setField("hr_contact_email", v)}
            />
            <Field
              label="HR Contact Phone *"
              value={profileData.hr_contact_phone}
              onChange={(v) => setField("hr_contact_phone", v)}
            />
          </Section>
        ) : null}

        {currentStep === 3 ? (
          <Section title="Media">
            <div>
              <Label>Profile Picture</Label>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {existingProfilePicUrl ? (
                  <button
                    onClick={() =>
                      window.open(
                        existingProfilePicUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    style={linkBtn()}
                  >
                    View existing
                  </button>
                ) : null}

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) =>
                    setProfileImageFile(e.target.files?.[0] || null)
                  }
                />
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div>
              <Label>Gallery</Label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={(e) =>
                  setGalleryFiles(Array.from(e.target.files || []))
                }
              />

              {existingGalleryUrls.length ? (
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                    gap: 8,
                  }}
                >
                  {existingGalleryUrls.map((u, i) => (
                    <div
                      key={u + i}
                      style={{
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "rgba(123,111,87,0.12)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        window.open(u, "_blank", "noopener,noreferrer")
                      }
                      title="Open"
                    >
                      <img
                        src={u}
                        alt=""
                        style={{
                          width: "100%",
                          height: 90,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {currentStep === 4 ? (
          <Section title="Details & Legal">
            <Field
              label="Website URL *"
              value={profileData.website_url}
              onChange={(v) => setField("website_url", v)}
            />
            <Field
              label="Google Maps Link"
              value={profileData.google_maps_link}
              onChange={(v) => setField("google_maps_link", v)}
            />
            <Field
              label="Business Registration Number *"
              value={profileData.business_registration_number}
              onChange={(v) => setField("business_registration_number", v)}
            />
            <Field
              label="License Number"
              value={profileData.license_number}
              onChange={(v) => setField("license_number", v)}
            />
            <Field
              label="Number of Rooms *"
              value={profileData.number_of_rooms}
              onChange={(v) => setField("number_of_rooms", v)}
            />
            <Field
              label="Logo URL"
              value={profileData.logo_url}
              onChange={(v) => setField("logo_url", v)}
            />

            <div style={{ marginTop: 12 }}>
              <Label>Amenities *</Label>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {selectedAmenities.map((a) => (
                  <span key={a} style={chip()}>
                    {a}
                    <button
                      onClick={() => removeAmenity(a)}
                      style={chipX()}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <select
                defaultValue=""
                onChange={(e) => {
                  addAmenity(e.target.value);
                  e.target.value = "";
                }}
                style={input()}
              >
                <option value="" disabled>
                  Add amenity
                </option>
                {AMENITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </Section>
        ) : null}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {currentStep > 0 ? (
            <button onClick={back} style={outlineBtn()} disabled={isLoading}>
              Back
            </button>
          ) : null}

          <div style={{ flex: 1 }} />

          {currentStep < 4 ? (
            <button onClick={next} style={primaryBtn()} disabled={isLoading}>
              Next
            </button>
          ) : (
            <button
              onClick={onSubmit}
              style={primaryBtn()}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>

      {parentPickerOpen ? (
        <Modal
          onClose={() => setParentPickerOpen(false)}
          title="Select Parent Hotel"
        >
          <input
            value={parentSearch}
            onChange={(e) => setParentSearch(e.target.value)}
            placeholder="Search by name or branch"
            style={input()}
          />

          <div style={{ height: 12 }} />

          <div
            style={{
              maxHeight: 320,
              overflow: "auto",
              border: "1px solid rgba(123,111,87,0.18)",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            {filteredParents.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  color: staffari.mutedOlive,
                  fontWeight: 800,
                }}
              >
                No parent hotels found
              </div>
            ) : (
              filteredParents.map((h) => (
                <button
                  key={String(h.hotel_id)}
                  onClick={() => {
                    setSelectedParent(h);
                    setParentPickerOpen(false);
                    setParentSearch("");
                  }}
                  style={listItemBtn()}
                >
                  <div
                    style={{ fontWeight: 900, color: staffari.deepJungleGreen }}
                  >
                    {h.hotel_name || "Unnamed"}
                  </div>
                  {h.branch ? (
                    <div style={{ fontSize: 12, color: staffari.mutedOlive }}>
                      Branch: {h.branch}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Section({ title, children }) {
  return (
    <div
      style={{
        background: staffari.cardBackground,
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.20)",
        padding: 20,
      }}
    >
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 20,
          fontWeight: 900,
          color: staffari.deepJungleGreen,
        }}
      >
        {title}
      </div>
      <div style={{ height: 14 }} />
      <div style={{ height: 1, background: "rgba(123,111,87,0.25)" }} />
      <div style={{ height: 14 }} />
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div
      style={{ color: staffari.mutedOlive, fontWeight: 900, marginBottom: 6 }}
    >
      {children}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={input()}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...input(), minHeight: 110 }}
      />
    </div>
  );
}

function Choice({ selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "10px 14px",
        cursor: "pointer",
        border: `1px solid ${selected ? staffari.emeraldGreen : "rgba(123,111,87,0.30)"}`,
        background: selected ? "rgba(25,95,78,0.12)" : "#fff",
        color: staffari.deepJungleGreen,
        fontWeight: 900,
      }}
    >
      {label}
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          margin: "10vh auto 0",
          background: staffari.cardBackground,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 18,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
            }}
          >
            {title}
          </div>
          <div style={{ marginLeft: "auto" }} />
          <button onClick={onClose} style={topBtn()}>
            ✕
          </button>
        </div>
        <div style={{ height: 12 }} />
        {children}
      </div>
    </div>
  );
}

function input() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(123,111,87,0.25)",
    outline: "none",
    background: "#fff",
    fontFamily: "Poppins, system-ui",
    fontWeight: 700,
    boxSizing: "border-box",
  };
}

function primaryBtn() {
  return {
    background: staffari.emeraldGreen,
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function outlineBtn() {
  return {
    background: "#fff",
    color: staffari.deepJungleGreen,
    border: "1px solid rgba(123,111,87,0.30)",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
  };
}

function topBtn() {
  return {
    border: "1px solid rgba(123,111,87,0.25)",
    background: "#fff",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    color: staffari.deepJungleGreen,
  };
}

function linkBtn() {
  return {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    color: staffari.emeraldGreen,
    textDecoration: "underline",
  };
}

function chip() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(25,95,78,0.10)",
    border: "1px solid rgba(25,95,78,0.30)",
    color: staffari.deepJungleGreen,
    fontWeight: 900,
  };
}

function chipX() {
  return {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    color: "rgb(220,38,38)",
    lineHeight: 1,
  };
}

function listItemBtn() {
  return {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
  };
}
