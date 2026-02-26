import React, { useEffect, useState } from "react";
import hotelApi from "./api";

export default function HotelProfileSetupPage({
  initialProfileData = {},
  onDone,
}) {
  const uid = localStorage.getItem("uid");
  const [parents, setParents] = useState([]);
  const [f, setF] = useState({
    hotel_name: initialProfileData?.hotel_name || "",
    star_rating: initialProfileData?.star_rating || "",
    hotel_type: initialProfileData?.hotel_type || "",
    website_url: initialProfileData?.website_url || "",
    google_maps_link: initialProfileData?.google_maps_link || "",
    address_line_1: initialProfileData?.address_line_1 || "",
    city: initialProfileData?.city || "",
    state: initialProfileData?.state || "",
    postal_code: initialProfileData?.postal_code || "",
    country: initialProfileData?.country || "",
    description: initialProfileData?.description || "",
    hr_contact_name: initialProfileData?.hr_contact_name || "",
    hr_contact_email: initialProfileData?.hr_contact_email || "",
    hr_contact_phone: initialProfileData?.hr_contact_phone || "",
    is_parent: initialProfileData?.is_parent ?? true,
    branch: initialProfileData?.branch || "",
    parent_hotel_id: initialProfileData?.parent_hotel_id || "",
    parent_hotel_name: initialProfileData?.parent_hotel_name || "",
    parent_branch: initialProfileData?.parent_branch || "",
    amenities: initialProfileData?.amenities || [],
    gallery_image_urls: initialProfileData?.gallery_image_urls || [],
    profile_pic_url: initialProfileData?.profile_pic_url || "",
    banner_image_url: initialProfileData?.banner_image_url || "",
  });

  useEffect(() => {
    (async () => {
      const data = await hotelApi.getAllParentHotels();
      setParents(data?.hotels || []);
    })();
  }, []);

  const save = async () => {
    if (!uid) return;
    await hotelApi.upsertHotelProfile({ user_id: uid, ...f });
    onDone?.();
  };

  return (
    <div>
      <h3>Hotel Profile Setup</h3>
      <input
        placeholder="Hotel Name"
        value={f.hotel_name}
        onChange={(e) => setF({ ...f, hotel_name: e.target.value })}
      />
      <input
        placeholder="Star Rating"
        value={f.star_rating}
        onChange={(e) => setF({ ...f, star_rating: e.target.value })}
      />
      <input
        placeholder="Hotel Type"
        value={f.hotel_type}
        onChange={(e) => setF({ ...f, hotel_type: e.target.value })}
      />
      <input
        placeholder="Address"
        value={f.address_line_1}
        onChange={(e) => setF({ ...f, address_line_1: e.target.value })}
      />
      <input
        placeholder="City"
        value={f.city}
        onChange={(e) => setF({ ...f, city: e.target.value })}
      />
      <input
        placeholder="State"
        value={f.state}
        onChange={(e) => setF({ ...f, state: e.target.value })}
      />
      <input
        placeholder="HR Contact Name"
        value={f.hr_contact_name}
        onChange={(e) => setF({ ...f, hr_contact_name: e.target.value })}
      />
      <input
        placeholder="HR Contact Email"
        value={f.hr_contact_email}
        onChange={(e) => setF({ ...f, hr_contact_email: e.target.value })}
      />
      <label>
        <input
          type="checkbox"
          checked={!!f.is_parent}
          onChange={(e) => setF({ ...f, is_parent: e.target.checked })}
        />
        Is Parent Hotel
      </label>

      {!f.is_parent && (
        <select
          value={f.parent_hotel_id}
          onChange={(e) => {
            const p = parents.find(
              (x) => String(x.hotel_id) === e.target.value,
            );
            setF({
              ...f,
              parent_hotel_id: e.target.value,
              parent_hotel_name: p?.hotel_name || "",
              parent_branch: p?.branch || "",
            });
          }}
        >
          <option value="">Select Parent Hotel</option>
          {parents.map((p) => (
            <option key={p.hotel_id} value={String(p.hotel_id)}>
              {p.hotel_name}
            </option>
          ))}
        </select>
      )}

      <button onClick={save}>Save Profile</button>
    </div>
  );
}
