import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { lsGet } from "../utils/storage";

export default function HotelProtectedRoute() {
  const isLoggedIn = !!lsGet("isLoggedIn", false);
  const role = lsGet("role", null);
  const uid = lsGet("uid", null);

  if (!isLoggedIn || !uid || role !== "Hotel") {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
