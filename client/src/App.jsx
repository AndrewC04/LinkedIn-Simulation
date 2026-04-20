import React, { useState } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginSignupPage from "./pages/LoginSignupPage.jsx";
import RecruiterHome from "./pages/RecruiterHome.jsx";
import ManageJobs from "./pages/ManageJobs.jsx";
import ApplicantsList from "./pages/ApplicantsList.jsx";
import StatusUpdate from "./pages/StatusUpdate.jsx";
import AddNote from "./pages/AddNote.jsx";
import AIReview from "./pages/AIReview.jsx";
import MemberHome from "./pages/MemberHome.jsx";
import JobListings from "./pages/JobListings.jsx";
import MyApplications from "./pages/MyApplications.jsx";
import SavedJobs from "./pages/SavedJobs.jsx";
import Submit from "./pages/Submit.jsx";

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("home");

  if (!isAuthenticated) return <LoginSignupPage />;

  // Recruiter routes
  if (user?.role === "recruiter") {
    if (screen === "recruiterHome") return <RecruiterHome onNavigate={setScreen} />;
    if (screen === "manageJobs")    return <ManageJobs onNavigate={setScreen} />;
    if (screen === "applicants")    return <ApplicantsList onNavigate={setScreen} />;
    if (screen === "statusUpdates") return <StatusUpdate onNavigate={setScreen} />;
    if (screen === "notes")         return <AddNote onNavigate={setScreen} />;
    if (screen === "analytics")     return <AIReview onNavigate={setScreen} />;
    return <RecruiterHome onNavigate={setScreen} />;
  }

  // Member routes
  if (user?.role === "member") {
    if (screen === "memberHome")      return <MemberHome onNavigate={setScreen} />;
    if (screen === "jobListings")     return <JobListings onNavigate={setScreen} />;
    if (screen === "myApplications")  return <MyApplications onNavigate={setScreen} />;
    if (screen === "savedJobs")       return <SavedJobs onNavigate={setScreen} />;
    if (screen === "submitApp")       return <Submit onNavigate={setScreen} />;
    return <MemberHome onNavigate={setScreen} />;
  }

  return <LoginSignupPage />;
}