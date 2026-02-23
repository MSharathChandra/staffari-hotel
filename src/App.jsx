// src/App.jsx (replace with this)
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HotelDashboard from "./hotel/HotelDashboard";
import SignInPage from "./auth/SignInPage";
import SignUpPage from "./auth/SignUpPage";

function ProtectedRoute({ children }) {
  const uid = localStorage.getItem("uid");
  return uid ? children : <Navigate to="/signin" replace />;
}

function Placeholder({ title }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route
          path="/hotel"
          element={
            <ProtectedRoute>
              <HotelDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/broker" element={<Placeholder title="Broker Dashboard" />} />
        <Route path="/jobseeker" element={<Placeholder title="Job Seeker Dashboard" />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
