import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobCard from "../components/JobCard.jsx";
import { searchJobs, closeJob } from "../api/jobApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function RecruiterJobsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const recruiterId = user?.userId || "000a9569-fb9d-4505-a550-8641196bdd49";

  const [statusFilter, setStatusFilter] = useState("open");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      setLoading(true);
      setError("");
      const data = await searchJobs({ status: statusFilter }, 1, 20);
      setJobs(data.results || []);
    } catch (err) {
      setJobs([]);
      setError(err?.message || "Failed to load recruiter jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [statusFilter, recruiterId]);

  async function handleCloseJob(job) {
    const reason = window.prompt("Reason for closing this job?", "Position has been filled.");
    if (!reason) return;

    try {
      await closeJob(job.job_id, recruiterId, reason);
      loadJobs();
    } catch (err) {
      alert(err?.message || "Failed to close job");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="recruiter" />
      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h1>Recruiter Jobs Dashboard</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/recruiter/home">Back</Link>
            <Link to="/recruiter/jobs/create">Create Job</Link>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #d9dee3", borderRadius: "16px", padding: "18px", marginBottom: "18px" }}>
          <label>Status Filter: </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </div>

        {error && <div style={{ color: "crimson", marginBottom: "12px" }}>{error}</div>}
        {loading ? <div>Loading recruiter jobs...</div> : jobs.length === 0 ? <div>No jobs found.</div> : (
          jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              showRecruiterActions
              onView={(jobId) => navigate(`/recruiter/jobs/${jobId}`)}
              onEdit={(jobId) => navigate(`/recruiter/jobs/edit/${jobId}`)}
              onClose={handleCloseJob}
            />
          ))
        )}
      </div>
    </div>
  );
}