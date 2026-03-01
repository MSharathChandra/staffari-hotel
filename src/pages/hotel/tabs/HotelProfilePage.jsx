import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffari } from "../../../theme/staffariTheme";
import { lsGet } from "../../../utils/storage";
import { getHotelProfile, saveBannerOnly } from "../../../api/hotelProfileApi";

export default function HotelProfilePage() {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSelectingBanner, setIsSelectingBanner] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);

  const [optionsOpen, setOptionsOpen] = useState(false);

  const openUrl = (url) => {
    if (!url) return;
    window.open(String(url), "_blank", "noopener,noreferrer");
  };

  //   const asString = (v) => (v == null ? "" : String(v));
  //   const listToString = (v) => (Array.isArray(v) ? v.join(", ") : asString(v));

  const gallery = useMemo(() => {
    const g = profileData?.gallery_image_urls;
    return Array.isArray(g) ? g.filter(Boolean) : [];
  }, [profileData]);

  const heroImage = useMemo(() => {
    const persisted = (profileData?.banner_image_url ?? "").toString().trim();
    if (bannerImageUrl && String(bannerImageUrl).trim()) return bannerImageUrl;
    if (persisted) return persisted;
    if (gallery.length) return String(gallery[0] ?? "").trim() || null;
    return null;
  }, [bannerImageUrl, profileData, gallery]);

  const starRating = useMemo(() => {
    const v = profileData?.star_rating;
    if (typeof v === "number") return v;
    const n = Number.parseInt(String(v ?? "0"), 10);
    return Number.isFinite(n) ? n : 0;
  }, [profileData]);

  const hotelName = useMemo(() => {
    return profileData?.hotel_name ?? profileData?.fullName ?? "Hotel";
  }, [profileData]);

  const initial = useMemo(() => {
    const name = String(hotelName || "").trim();
    return name ? name[0].toUpperCase() : "?";
  }, [hotelName]);

  const fetchProfile = async () => {
    setIsLoading(true);

    const userId = lsGet("uid", null);
    if (!userId) {
      setIsLoading(false);
      navigate("/signin", { replace: true });
      return;
    }

    try {
      const data = await getHotelProfile(userId);

      const prof =
        data?.data?.profile_data && typeof data.data.profile_data === "object"
          ? data.data.profile_data
          : {};

      if (!prof || Object.keys(prof).length === 0) {
        navigate("/hotel/profile/setup", { replace: true });
        return;
      }

      const creds =
        data?.data?.credentials_data &&
        typeof data.data.credentials_data === "object"
          ? data.data.credentials_data
          : {};

      const merged = { ...creds, ...prof };
      setProfileData(merged);

      const g = Array.isArray(merged.gallery_image_urls)
        ? merged.gallery_image_urls
        : [];
      const persisted = (merged.banner_image_url ?? "").toString().trim();

      setBannerImageUrl(
        persisted ? persisted : g.length ? String(g[0] ?? "").trim() : null,
      );
    } catch {
      // In Flutter you redirect to setup on non-200; keep same feel:
      navigate("/hotel/profile/setup", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBanner = async () => {
    const userId = lsGet("uid", null);
    if (!userId) {
      alert("User not logged in.");
      navigate("/signin", { replace: true });
      return;
    }

    try {
      await saveBannerOnly({
        userId,
        bannerImageUrl,
        galleryImageUrls: gallery,
        profilePicUrl: profileData?.profile_pic_url ?? null,
      });
      setIsSelectingBanner(false);
      alert("Banner updated");
      await fetchProfile();
    } catch {
      alert("Failed to update banner");
    }
  };

  const signOut = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    navigate("/signin", { replace: true });
  };

  if (isLoading) return <LoadingShimmer />;

  if (!profileData) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          background: staffari.earthyBeige,
        }}
      >
        <div style={{ textAlign: "center", fontFamily: "Poppins, system-ui" }}>
          <div style={{ fontSize: 80, color: staffari.mutedOlive }}>🏨</div>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontSize: 22,
              fontWeight: 900,
              color: staffari.deepJungleGreen,
            }}
          >
            Hotel Profile Not Found
          </div>
          <div
            style={{
              marginTop: 8,
              color: staffari.mutedOlive,
              fontWeight: 700,
            }}
          >
            Let's get your property listed.
          </div>
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => navigate("/hotel/profile/setup")}
              style={primaryBtn()}
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          height: 240,
          background: staffari.deepJungleGreen,
        }}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.20), rgba(0,0,0,0.60))",
          }}
        />

        {/* Top actions */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }} />

          <button
            onClick={() => setIsSelectingBanner((v) => !v)}
            style={ghostIconBtn()}
            title={isSelectingBanner ? "Cancel banner select" : "Set Banner"}
          >
            {isSelectingBanner ? "✕" : "🖼️"}
          </button>

          <button
            onClick={() =>
              navigate("/hotel/profile/setup", {
                state: {
                  initialProfileData: buildInitialForSetup(
                    profileData,
                    bannerImageUrl,
                  ),
                },
              })
            }
            style={ghostIconBtn()}
            title="Edit in setup"
          >
            ✎
          </button>

          <button
            onClick={() => setOptionsOpen(true)}
            style={ghostIconBtn()}
            title="Options"
          >
            ⋮
          </button>
        </div>

        {/* Title */}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
          <div
            style={{
              fontFamily: "Space Grotesk, system-ui",
              fontWeight: 900,
              fontSize: 22,
              color: "#fff",
            }}
          >
            {String(hotelName)}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: staffari.emeraldGreen,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                border: "2px solid rgba(255,255,255,0.55)",
              }}
            >
              {profileData?.profile_pic_url ? (
                <img
                  src={profileData.profile_pic_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: "Space Grotesk, system-ui",
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {initial}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.max(0, starRating) }).map((_, i) => (
                <span
                  key={i}
                  style={{ color: staffari.terracottaBrown, fontSize: 22 }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {isSelectingBanner ? (
            <div
              style={{
                marginTop: 10,
                color: "#fff",
                opacity: 0.92,
                fontFamily: "Poppins, system-ui",
                fontWeight: 700,
              }}
            >
              Tap an image in Gallery to set it as the banner.
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 16,
          paddingBottom: isSelectingBanner ? 110 : 24,
        }}
      >
        <InfoSection title="Hotel Details">
          <KeyValue label="Hotel Name" value={profileData?.hotel_name} />
          <KeyValue label="Hotel Type" value={profileData?.hotel_type} />
          <KeyValue label="Description" value={profileData?.description} />
        </InfoSection>

        <InfoSection title="Online">
          <KeyValue
            label="Website"
            value={profileData?.website_url}
            link
            onOpen={openUrl}
          />
          <KeyValue
            label="Google Maps"
            value={profileData?.google_maps_link}
            link
            onOpen={openUrl}
          />
        </InfoSection>

        {String(profileData?.logo_url ?? "").trim() ? (
          <InfoSection title="Branding">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img
                src={profileData.logo_url}
                alt=""
                style={{
                  height: 72,
                  objectFit: "contain",
                  borderRadius: 12,
                  background: "#fff",
                  padding: 8,
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <button
                onClick={() => openUrl(profileData.logo_url)}
                style={linkBtn()}
              >
                Open logo
              </button>
            </div>
          </InfoSection>
        ) : null}

        <InfoSection title="Address">
          <KeyValue label="Address" value={profileData?.address_line_1} />
          <KeyValue label="City" value={profileData?.city} />
          <KeyValue label="State" value={profileData?.state} />
          <KeyValue label="Postal Code" value={profileData?.postal_code} />
          <KeyValue label="Country" value={profileData?.country} />
        </InfoSection>

        <InfoSection title="Stats">
          <KeyValue label="Star Rating" value={profileData?.star_rating} />
          <KeyValue
            label="Number of Rooms"
            value={profileData?.number_of_rooms}
          />
          <KeyValue
            label="Year Established"
            value={profileData?.year_established}
          />
        </InfoSection>

        {profileData?.branch != null || profileData?.is_parent != null ? (
          <InfoSection title="Structure">
            {profileData?.is_parent != null ? (
              <KeyValue
                label="Type"
                value={
                  profileData?.is_parent === true
                    ? "Parent Hotel"
                    : "Child Branch"
                }
              />
            ) : null}
            <KeyValue label="Branch" value={profileData?.branch} />
            {profileData?.is_parent === false ? (
              <>
                <KeyValue
                  label="Parent Hotel"
                  value={profileData?.parent_hotel_name}
                />
                <KeyValue
                  label="Parent Branch"
                  value={profileData?.parent_branch}
                />
              </>
            ) : null}
          </InfoSection>
        ) : null}

        <InfoSection title="Legal">
          <KeyValue
            label="Business Registration"
            value={profileData?.business_registration_number}
          />
          <KeyValue
            label="License Number"
            value={profileData?.license_number}
          />
        </InfoSection>

        <InfoSection title="HR Contact">
          <KeyValue label="Contact Name" value={profileData?.hr_contact_name} />
          <KeyValue
            label="Contact Email"
            value={profileData?.hr_contact_email}
          />
          <KeyValue
            label="Contact Phone"
            value={profileData?.hr_contact_phone}
          />
        </InfoSection>

        <InfoSection title="Account">
          <KeyValue label="Email" value={profileData?.email} />
          <KeyValue label="Phone" value={profileData?.phone} />
          <KeyValue label="UID" value={profileData?.uid} />
        </InfoSection>

        <InfoSection title="Meta">
          <KeyValue
            label="Profile Status"
            value={profileData?.profile_status}
          />
          <KeyValue label="Created At" value={profileData?.created_at} />
          <KeyValue label="Updated At" value={profileData?.updated_at} />
        </InfoSection>

        <InfoSection title="Amenities">
          {Array.isArray(profileData?.amenities) &&
          profileData.amenities.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profileData.amenities.map((a) => (
                <span key={String(a)} style={chipStyle()}>
                  {String(a)}
                </span>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontFamily: "Poppins, system-ui",
                color: staffari.charcoalBlack,
              }}
            >
              Not provided
            </div>
          )}
        </InfoSection>

        <InfoSection title="Gallery">
          {gallery.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {gallery.map((u, i) => {
                const url = String(u || "").trim();
                if (!url) return <div key={i} style={emptyTile()} />;

                const isBanner =
                  bannerImageUrl && String(bannerImageUrl) === url;

                return (
                  <div
                    key={url + i}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isSelectingBanner) setBannerImageUrl(url);
                      else openUrl(url);
                    }}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "rgba(123,111,87,0.12)",
                    }}
                    title={isSelectingBanner ? "Set as banner" : "Open"}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {isBanner ? (
                      <div style={bannerTag()}>
                        <span style={{ fontWeight: 900 }}>Banner</span>
                      </div>
                    ) : null}

                    {isSelectingBanner && !isBanner ? (
                      <div style={pinTag()}>📌</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                fontFamily: "Poppins, system-ui",
                color: staffari.mutedOlive,
                fontWeight: 700,
              }}
            >
              No gallery images.
            </div>
          )}
        </InfoSection>
      </div>

      {/* Save Banner bottom CTA (Flutter-like) */}
      {isSelectingBanner ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.9)",
            borderTop: "1px solid rgba(123,111,87,0.20)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <button onClick={saveBanner} style={primaryBtn()}>
              Save Banner
            </button>
          </div>
        </div>
      ) : null}

      {/* Options sheet */}
      {optionsOpen ? (
        <BottomSheet onClose={() => setOptionsOpen(false)} title="Options">
          <SheetItem
            label="Delete Account"
            danger
            onClick={() => {
              setOptionsOpen(false);
              navigate("/delete-account");
            }}
          />
          <SheetItem
            label="Log Out"
            danger
            onClick={() => {
              setOptionsOpen(false);
              signOut();
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function buildInitialForSetup(profileData, bannerImageUrl) {
  const d = { ...(profileData || {}) };
  return {
    hotel_name: d.hotel_name,
    star_rating: d.star_rating,
    hotel_type: d.hotel_type,
    website_url: d.website_url,
    google_maps_link: d.google_maps_link,
    address_line_1: d.address_line_1,
    city: d.city,
    state: d.state,
    postal_code: d.postal_code,
    country: d.country,
    business_registration_number: d.business_registration_number,
    license_number: d.license_number,
    description: d.description,
    number_of_rooms: d.number_of_rooms,
    year_established: d.year_established,
    hr_contact_name: d.hr_contact_name,
    hr_contact_email: d.hr_contact_email,
    hr_contact_phone: d.hr_contact_phone,
    logo_url: d.logo_url,
    profile_pic_url: d.profile_pic_url,
    gallery_image_urls: d.gallery_image_urls || [],
    amenities: d.amenities || [],
    banner_image_url: bannerImageUrl,

    is_parent: d.is_parent,
    branch: d.branch,
    parent_hotel_id: d.parent_hotel_id,
    parent_hotel_name: d.parent_hotel_name,
    parent_branch: d.parent_branch,
  };
}

/* ---------- small UI components ---------- */

function InfoSection({ title, children }) {
  return (
    <div
      style={{
        background: staffari.cardBackground,
        borderRadius: 16,
        border: "1px solid rgba(123,111,87,0.20)",
        padding: 20,
        marginBottom: 16,
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

function KeyValue({ label, value, link = false, onOpen }) {
  const v = value == null ? "" : String(value).trim();
  if (!v) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "Poppins, system-ui",
          fontSize: 12,
          fontWeight: 800,
          color: staffari.mutedOlive,
        }}
      >
        {label}
      </div>
      <div style={{ height: 4 }} />
      {link && onOpen ? (
        <button onClick={() => onOpen(v)} style={linkBtn()}>
          {v}
        </button>
      ) : (
        <div
          style={{
            fontFamily: "Poppins, system-ui",
            fontSize: 16,
            color: staffari.charcoalBlack,
            lineHeight: 1.4,
          }}
        >
          {v}
        </div>
      )}
    </div>
  );
}

function BottomSheet({ title, children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: staffari.cardBackground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: "1px solid rgba(123,111,87,0.25)",
          padding: 16,
        }}
      >
        <div style={{ display: "grid", placeItems: "center" }}>
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              background: "rgba(0,0,0,0.25)",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 10,
            fontFamily: "Space Grotesk, system-ui",
            fontSize: 18,
            fontWeight: 900,
            color: staffari.deepJungleGreen,
          }}
        >
          {title}
        </div>

        <div style={{ marginTop: 10 }}>{children}</div>

        <div style={{ height: 10 }} />
      </div>
    </div>
  );
}

function SheetItem({ label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        padding: "14px 10px",
        cursor: "pointer",
        fontFamily: "Poppins, system-ui",
        fontWeight: 800,
        color: danger ? "rgb(220, 38, 38)" : staffari.charcoalBlack,
      }}
    >
      {label}
    </button>
  );
}

function LoadingShimmer() {
  return (
    <div style={{ minHeight: "100vh", background: staffari.earthyBeige }}>
      <div
        style={{
          height: 240,
          background:
            "linear-gradient(90deg, rgba(230,230,230,1) 25%, rgba(250,250,250,1) 50%, rgba(230,230,230,1) 75%)",
          backgroundSize: "400% 100%",
          animation: "shimmer 1.2s ease-in-out infinite",
        }}
      />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 150,
              marginBottom: 16,
              borderRadius: 16,
              background:
                "linear-gradient(90deg, rgba(230,230,230,1) 25%, rgba(250,250,250,1) 50%, rgba(230,230,230,1) 75%)",
              backgroundSize: "400% 100%",
              animation: "shimmer 1.2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <style>{`@keyframes shimmer { 0%{background-position:100% 0;} 100%{background-position:0 0;} }`}</style>
    </div>
  );
}

/* ---------- styles ---------- */

function primaryBtn() {
  return {
    width: "100%",
    background: staffari.emeraldGreen,
    color: "#fff",
    border: "none",
    padding: "14px 16px",
    borderRadius: 16,
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    fontSize: 16,
  };
}

function ghostIconBtn() {
  return {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    backdropFilter: "blur(6px)",
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

function chipStyle() {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(25,95,78,0.10)",
    border: "1px solid rgba(25,95,78,0.30)",
    color: staffari.deepJungleGreen,
    fontFamily: "Poppins, system-ui",
    fontWeight: 800,
    fontSize: 13,
  };
}

function emptyTile() {
  return {
    height: 110,
    borderRadius: 10,
    background: "rgba(123,111,87,0.15)",
  };
}

function bannerTag() {
  return {
    position: "absolute",
    left: 6,
    top: 6,
    padding: "4px 8px",
    borderRadius: 8,
    background: "rgba(25,95,78,0.90)",
    color: "#fff",
    fontFamily: "Poppins, system-ui",
    fontWeight: 900,
    fontSize: 12,
  };
}

function pinTag() {
  return {
    position: "absolute",
    right: 6,
    top: 6,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    display: "grid",
    placeItems: "center",
    fontSize: 14,
  };
}
