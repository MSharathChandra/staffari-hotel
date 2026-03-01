import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HotelProtectedRoute from "./routes/HotelProtectedRoute";
import HotelSignInPage from "./pages/HotelSignInPage";
import HotelDashboard from "./pages/HotelDashboard";
import ChatListPage from "./pages/hotel/ChatListPage";
import ViewApplicationsPage from "./pages/hotel/tabs/ViewApplicationsPage";
import PostJobFormPage from "./pages/hotel/jobs/PostJobFormPage";
import MatchingProfilesPage from "./pages/hotel/jobs/MatchingProfilesPage";
import ApplicantProfilePage from "./pages/hotel/applicants/ApplicantProfilePage";
import HotelProfileSetupPage from "./pages/hotel/profile/HotelProfileSetupPage";
import HotelProfilePage from "./pages/hotel/tabs/HotelProfilePage";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 24, fontFamily: "Poppins, system-ui" }}>
      <h3>{title}</h3>
      <p>Coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<HotelSignInPage />} />
        <Route
          path="/signup"
          element={<Placeholder title="Sign Up (you will provide later)" />}
        />

        <Route element={<HotelProtectedRoute />}>
          <Route path="/hotel" element={<HotelDashboard />} />
          <Route path="/hotel/chats" element={<ChatListPage />} />
          <Route
            path="/hotel/applications/:jobId"
            element={<ViewApplicationsPage />}
          />
          <Route path="/hotel/jobs/post" element={<PostJobFormPage />} />
          <Route
            path="/hotel/jobs/:jobId/matching"
            element={<MatchingProfilesPage />}
          />
          <Route
            path="/hotel/applicants/:userId"
            element={<ApplicantProfilePage />}
          />
        </Route>
        <Route path="/hotel/profile" element={<HotelProfilePage />} />
        <Route
          path="/hotel/profile/setup"
          element={<HotelProfileSetupPage />}
        />
        {/* <Route path="/delete-account" element={<DeleteAccountPage />} /> */}

        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
