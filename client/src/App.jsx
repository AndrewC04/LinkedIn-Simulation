import React, { useState } from "react";
import RecruiterHome from "./pages/RecruiterHome.jsx";
import ManageJobs from "./pages/ManageJobs.jsx";
import ApplicantsList from "./pages/ApplicantsList.jsx";
import StatusUpdate from "./pages/StatusUpdate.jsx";
import AddNote from "./pages/AddNote.jsx";
import AIReview from "./pages/AIReview.jsx";

export default function App() {
  const [screen, setScreen] = useState("recruiterHome");

  if (screen === "recruiterHome") return <RecruiterHome onNavigate={setScreen} />;
  if (screen === "manageJobs")    return <ManageJobs onNavigate={setScreen} />;
  if (screen === "applicants")    return <ApplicantsList onNavigate={setScreen} />;
  if (screen === "statusUpdates") return <StatusUpdate onNavigate={setScreen} />;
  if (screen === "notes")         return <AddNote onNavigate={setScreen} />;
  if (screen === "analytics")     return <AIReview onNavigate={setScreen} />;

  return <RecruiterHome onNavigate={setScreen} />;
}