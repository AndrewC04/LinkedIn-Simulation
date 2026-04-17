import React, { useMemo, useState } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginSignupPage from "./pages/LoginSignupPage.jsx";
import MemberHome from "./pages/MemberHome.jsx";
import RecruiterHome from "./pages/RecruiterHome.jsx";
import PlaceholderScreen from "./components/PlaceholderScreen.jsx";

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("home");

  const backTarget = useMemo(() => {
    if (["jobSearch", "myApplications", "messages", "submitApplication"].includes(screen)) {
      return "memberHome";
    }
    if (["manageJobs", "applicants", "statusUpdates", "notes", "analytics"].includes(screen)) {
      return "recruiterHome";
    }
    return "home";
  }, [screen]);

  if (!isAuthenticated) {
    return <LoginSignupPage />;
  }

  if (user.role === "member" && (screen === "home" || screen === "memberHome")) {
    return <MemberHome onNavigate={setScreen} />;
  }

  if (user.role === "recruiter" && (screen === "home" || screen === "recruiterHome")) {
    return <RecruiterHome onNavigate={setScreen} />;
  }

  const titles = {
    jobSearch: ["Job Search", "Search and browse roles with a LinkedIn-style layout."],
    myApplications: ["My Applications", "Track member-side application progress and statuses."],
    messages: ["Messages", "Reserved for messaging and connections UI flows."],
    submitApplication: ["Apply to a Job", "Frontend placeholder for your application submission experience."],
    manageJobs: ["Manage Job Postings", "Recruiter-side page for creating and updating jobs."],
    applicants: ["Applicants by Job", "Recruiter-side page for viewing applications tied to a posting."],
    statusUpdates: ["Update Application Status", "Recruiter-side workflow for moving candidates through the pipeline."],
    notes: ["Add Recruiter Notes", "Internal review notes and decision rationale UI."],
    analytics: ["Recruiter Analytics", "Placeholder for dashboards, job traction, and applicant metrics."],
  };

  const [title, description] = titles[screen] || ["Page", "Frontend placeholder"];

  return (
    <PlaceholderScreen
      title={title}
      description={description}
      onBack={() => setScreen(user.role === "member" ? "memberHome" : "recruiterHome")}
    />
  );
}