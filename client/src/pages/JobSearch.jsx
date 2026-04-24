import React, { useEffect, useState } from "react";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobCard from "../components/JobCard.jsx";
import JobFilters from "../components/JobFilters.jsx";
import { searchJobs } from "../api/jobApi.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx"; // 🔥 ADD THIS

const SAVED_JOBS_KEY = "savedJobs";

export default function JobSearch() {
  const navigate = useNavigate(); // ✅ MOVE HERE
  const { user } = useAuth();     // 🔥 YOU WERE MISSING THIS

  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    employment_type: "",
    industry: "",
    work_mode: "",
  });

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || "[]");
    setSavedJobs(saved);
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setError("");

      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined
        )
      );

      const data = await searchJobs(cleanedFilters, 1, 20);
      setJobs(data.results || []);
    } catch (err) {
      setError(err?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters({
      keyword: "",
      location: "",
      employment_type: "",
      industry: "",
      work_mode: "",
    });
  }

  function toggleSave(job) {
    let next;
    const exists = savedJobs.some((j) => j.job_id === job.job_id);

    if (exists) next = savedJobs.filter((j) => j.job_id !== job.job_id);
    else next = [...savedJobs, job];

    setSavedJobs(next);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="member" />

      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #d9dee3",
            borderRadius: "16px",
            padding: "26px 28px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
            marginBottom: "22px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: 700 }}>Job Search</h1>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#5e6a75" }}>
            Search and browse open positions.
          </p>
        </div>

        <JobFilters
          filters={filters}
          onChange={setFilters}
          onSearch={loadJobs}
          onClear={clearFilters}
        />

        {error && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        )}

        {loading ? (
          <div>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div>No jobs found.</div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              onView={(jobId) => {
                if (user?.role === "member") {
                  navigate(`/member/jobs/${jobId}`);
                } else {
                  navigate(`/recruiter/jobs/${jobId}`);
                }
              }}
              onToggleSave={toggleSave}
              isSaved={savedJobs.some((j) => j.job_id === job.job_id)}
            />
          ))
        )}
      </div>
    </div>
  );
}