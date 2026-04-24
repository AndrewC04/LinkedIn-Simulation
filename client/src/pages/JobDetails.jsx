import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { getJob } from "../api/jobApi.js";

const SAVED_JOBS_KEY = "savedJobs";

function formatSalary(salaryRange) {
  if (!salaryRange?.min && !salaryRange?.max) return "Salary not listed";
  const currency = salaryRange?.currency || "USD";
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (salaryRange?.min && salaryRange?.max) return `${fmt.format(salaryRange.min)} - ${fmt.format(salaryRange.max)}`;
  if (salaryRange?.min) return `From ${fmt.format(salaryRange.min)}`;
  return `Up to ${fmt.format(salaryRange.max)}`;
}

export default function JobDetails() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadJob();
    const savedJobs = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || "[]");
    setSaved(savedJobs.some((j) => j.job_id === jobId));
  }, [jobId]);

  async function loadJob() {
    try {
      setLoading(true);
      setError("");
      const data = await getJob(jobId, "mem_0001");
      setJob(data);
    } catch (err) {
      setError(err?.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  function toggleSave() {
    if (!job) return;
    const savedJobs = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || "[]");
    let next = saved ? savedJobs.filter((j) => j.job_id !== jobId) : [...savedJobs, job];
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
    setSaved(!saved);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="member" />

      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <Link to="/member/jobs" style={{ display: "inline-block", marginBottom: "16px" }}>Back</Link>

        {loading ? <div>Loading job...</div> : error ? <div style={{ color: "crimson" }}>{error}</div> : job ? (
          <div style={{ background: "#fff", border: "1px solid #d9dee3", borderRadius: "16px", padding: "26px 28px", boxShadow: "0 1px 2px rgba(0,0,0,0.07)" }}>
            <h1>{job.title}</h1>
            <div style={{ color: "#5e6a75", marginBottom: "12px" }}>
              {(job.company_name || job.company_id)} · {job.location}
            </div>
            <div style={{ marginBottom: "12px" }}>
              {job.employment_type} · {job.work_mode} · {job.seniority_level}
            </div>
            <div style={{ marginBottom: "12px" }}><b>Status:</b> {job.status}</div>
            <div style={{ marginBottom: "12px" }}><b>Salary:</b> {formatSalary(job.salary_range)}</div>
            <div style={{ marginBottom: "12px" }}><b>Description</b><p>{job.description}</p></div>
            <div style={{ marginBottom: "12px" }}>
              <b>Skills</b>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {(job.skills_required || []).map((skill) => (
                  <span key={skill} style={{ background: "#e8f3ff", color: "#0a66c2", border: "1px solid #cfe5ff", borderRadius: "999px", padding: "6px 12px", fontSize: "12px", fontWeight: 700 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button onClick={toggleSave}>{saved ? "Unsave Job" : "Save Job"}</button>
              <button onClick={() => navigate(`/member/jobs/${job.job_id}/apply`)}>
                Apply
              </button>
            </div>
          </div>
        ) : <div>Job not found.</div>}
      </div>
    </div>
  );
}