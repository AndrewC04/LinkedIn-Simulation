import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobCard from "../components/JobCard.jsx";

const SAVED_JOBS_KEY_BASE = "savedJobs";

export default function SavedJobs() {
  const { user } = useAuth();
  const SAVED_JOBS_KEY = `savedJobs_${user?.userId || 'guest'}`;
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || "[]");
    setSavedJobs(saved);
  }, [user]);

  function toggleSave(job) {
    const next = savedJobs.filter((j) => j.job_id !== job.job_id);
    setSavedJobs(next);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
  }

  function handleView(jobId) {
    navigate(`/member/jobs/${jobId}`);
  }

  function handleApply(jobId) {
    navigate(`/member/jobs/${jobId}/apply`);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="member" />

      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link to="/member/jobs">Back to Job Search</Link>
        </div>

        <h1>Saved Jobs</h1>

        {savedJobs.length === 0 ? (
          <div>No saved jobs yet.</div>
        ) : (
          savedJobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              isSaved={true}
              onView={handleView}
              onApply={handleApply}
              onToggleSave={toggleSave}
            />
          ))
        )}
      </div>
    </div>
  );
}