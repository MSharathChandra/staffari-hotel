// src/App.jsx
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HotelDashboard from "./hotel/HotelDashboard";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
      <p>Replace this with your actual page.</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const uid = localStorage.getItem("uid");
  return uid ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/hotel" replace />} />

        <Route path="/signin" element={<Placeholder title="Sign In Page" />} />
        <Route path="/jobseeker" element={<Placeholder title="Job Seeker Dashboard" />} />
        <Route path="/broker" element={<Placeholder title="Broker Dashboard" />} />

        <Route
          path="/hotel"
          element={
            <ProtectedRoute>
              <HotelDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
