import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";


const LoginSignupPage = lazy(() => import("./pages/LoginSignupPage.jsx"));

const MemberHome = lazy(() => import("./pages/MemberHome.jsx"));
const MemberAppHome = lazy(() => import("./pages/MemberAppHome.jsx"));
const ViewMyApplications = lazy(() => import("./pages/ViewMyApplications.jsx"));
const ViewApplicationDetails = lazy(() => import("./pages/ViewApplicationDetails.jsx"));

const RecruiterHome = lazy(() => import("./pages/RecruiterHome.jsx"));
const RecruiterAppHome = lazy(() => import("./pages/RecruiterAppHome.jsx"));
const SelectJob = lazy(() => import("./pages/SelectJob.jsx"));
const ViewApplicants = lazy(() => import("./pages/ViewApplicants.jsx"));
const OpenApplication = lazy(() => import("./pages/OpenApplication.jsx"));

const JobSearch = lazy(() => import("./pages/JobSearch.jsx"));
const JobDetails = lazy(() => import("./pages/JobDetails.jsx"));
const SavedJobs = lazy(() => import("./pages/SavedJobs.jsx"));
const MemberProfile = lazy(() => import("./pages/MemberProfile.jsx"));
const MemberMessages = lazy(() => import("./pages/MemberMessages.jsx"));
const RecruiterJobsDashboard = lazy(() => import("./pages/RecruiterJobsDashboard.jsx"));
const CreateJob = lazy(() => import("./pages/CreateJob.jsx"));
const EditJob = lazy(() => import("./pages/EditJob.jsx"));

const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard.jsx"));


function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f2ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#1d2226",
      }}
    >
      Loading...
    </div>
  );
}

function ProtectedRoute({ allowedRole, isAuthenticated, user, children }) {
  if (!isAuthenticated || user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LoginSignupPage />} />

        <Route
          path="/member/home"
          element={
            <ProtectedRoute
              allowedRole="member"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <MemberHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/applications"
          element={
            <ProtectedRoute
              allowedRole="member"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <MemberAppHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/applications/view"
          element={
            <ProtectedRoute
              allowedRole="member"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <ViewMyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/applications/details/:applicationId"
          element={
            <ProtectedRoute
              allowedRole="member"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <ViewApplicationDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/home"
          element={
            <ProtectedRoute
              allowedRole="recruiter"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <RecruiterHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute
              allowedRole="recruiter"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <RecruiterAppHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/applications/select-job"
          element={
            <ProtectedRoute
              allowedRole="recruiter"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <SelectJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/applications/view-applicants/:jobId"
          element={
            <ProtectedRoute
              allowedRole="recruiter"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <ViewApplicants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/applications/open/:applicationId"
          element={
            <ProtectedRoute
              allowedRole="recruiter"
              isAuthenticated={isAuthenticated}
              user={user}
            >
              <OpenApplication />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/jobs"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <JobSearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/jobs/saved"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <SavedJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/jobs/:jobId"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/profile"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <MemberProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/profile/:memberId"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <MemberProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/messages"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <MemberMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute allowedRole="recruiter" isAuthenticated={isAuthenticated} user={user}>
              <RecruiterJobsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs/create"
          element={
            <ProtectedRoute allowedRole="recruiter" isAuthenticated={isAuthenticated} user={user}>
              <CreateJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs/edit/:jobId"
          element={
            <ProtectedRoute allowedRole="recruiter" isAuthenticated={isAuthenticated} user={user}>
              <EditJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs/:jobId"
          element={
            <ProtectedRoute allowedRole="recruiter" isAuthenticated={isAuthenticated} user={user}>
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/analytics"
          element={
            <ProtectedRoute allowedRole="member" isAuthenticated={isAuthenticated} user={user}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute allowedRole="recruiter" isAuthenticated={isAuthenticated} user={user}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />



        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}