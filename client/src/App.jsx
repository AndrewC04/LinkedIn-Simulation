import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";

import LoginSignupPage from "./pages/LoginSignupPage.jsx";
import MemberHome from "./pages/MemberHome.jsx";
import MemberAppHome from "./pages/MemberAppHome.jsx";
import RecruiterHome from "./pages/RecruiterHome.jsx";
import RecruiterAppHome from "./pages/RecruiterAppHome.jsx";

import ViewMyApplications from "./pages/ViewMyApplications.jsx";
import ViewApplicationDetails from "./pages/ViewApplicationDetails.jsx";
import FilterByStatus from "./pages/FilterByStatus.jsx";

import SelectJob from "./pages/SelectJob.jsx";
import ViewApplicants from "./pages/ViewApplicants.jsx";
import OpenApplication from "./pages/OpenApplication.jsx";
import UpdateStatus from "./pages/UpdateStatus.jsx";
import AddNote from "./pages/AddNote.jsx";

import PlaceholderScreen from "./components/PlaceholderScreen.jsx";

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LoginSignupPage />} />

      <Route
        path="/member/home"
        element={
          isAuthenticated && user?.role === "member" ? (
            <MemberHome />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/applications"
        element={
          isAuthenticated && user?.role === "member" ? (
            <MemberAppHome />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/applications/view"
        element={
          isAuthenticated && user?.role === "member" ? (
            <ViewMyApplications />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/applications/details/:applicationId"
        element={
          isAuthenticated && user?.role === "member" ? (
            <ViewApplicationDetails />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/applications/filter"
        element={
          isAuthenticated && user?.role === "member" ? (
            <FilterByStatus />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/jobs"
        element={
          isAuthenticated && user?.role === "member" ? (
            <PlaceholderScreen title="Jobs" description="Member jobs page placeholder." />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/member/messages"
        element={
          isAuthenticated && user?.role === "member" ? (
            <PlaceholderScreen title="Messages" description="Member messages page placeholder." />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/home"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <RecruiterHome />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <RecruiterAppHome />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications/select-job"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <SelectJob />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications/view-applicants/:jobId"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <ViewApplicants />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications/open/:applicationId"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <OpenApplication />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications/update-status/:applicationId"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <UpdateStatus />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/applications/add-note/:applicationId"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <AddNote />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/jobs"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <PlaceholderScreen title="Jobs" description="Recruiter jobs page placeholder." />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/recruiter/analytics"
        element={
          isAuthenticated && user?.role === "recruiter" ? (
            <PlaceholderScreen title="Analytics" description="Recruiter analytics placeholder." />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}