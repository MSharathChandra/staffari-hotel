import React, { useEffect, useState } from "react";
import hotelApi from "./api";
import HotelProfileSetupPage from "./HotelProfileSetupPage";

export default function HotelProfilePage() {
  const uid = localStorage.getItem("uid");
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const res = await hotelApi.getHotelProfile(uid);
    const prof = res?.data?.profile_data || null;
    if (!prof) setEditing(true);
    else setProfile({ ...(res?.data?.credentials_data || {}), ...prof });
  };

  useEffect(() => {
    if (uid) load();
  }, []);

  if (!uid) return <p>User not logged in.</p>;
  if (editing)
    return (
      <HotelProfileSetupPage
        initialProfileData={profile}
        onDone={() => {
          setEditing(false);
          load();
        }}
      />
    );

  return (
    <div>
      <h3>Hotel Profile</h3>
      {!profile ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>
            <b>Name:</b> {profile.hotel_name || "-"}
          </p>
          <p>
            <b>Star Rating:</b> {profile.star_rating || "-"}
          </p>
          <p>
            <b>Type:</b> {profile.hotel_type || "-"}
          </p>
          <p>
            <b>Address:</b> {profile.address_line_1 || "-"},{" "}
            {profile.city || "-"}, {profile.state || "-"}
          </p>
          <p>
            <b>Website:</b> {profile.website_url || "-"}
          </p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Log Out
          </button>
        </>
      )}
    </div>
  );
}
