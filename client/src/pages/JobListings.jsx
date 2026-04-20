import React, { useState, useEffect } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

export default function JobListings({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState({ seniority: "", employmentType: "" });

  const s = {
    page: { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout: { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
             display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card: { backgroundColor: "white", border: `1px solid ${brand.border}`,
            borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    title: { fontSize: "20px", fontWeight: 800, color: brand.text },
    primaryBtn: { backgroundColor: brand.blue, color: "white", border: "none",
                  borderRadius: "999px", padding: "10px 20px", fontWeight: 700,
                  cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    badge: { display: "inline-block", padding: "3px 10px", borderRadius: "999px",
             fontSize: "12px", fontWeight: 700 },
    jobCard: { padding: "16px", borderRadius: "8px", border: `1px solid ${brand.border}`,
               marginBottom: "12px", backgroundColor: "#fafafa" },
    jobTitle: { fontSize: "16px", fontWeight: 700, color: brand.text, marginBottom: "4px" },
    jobMeta: { fontSize: "13px", color: brand.muted, marginBottom: "8px" },
    jobDesc: { fontSize: "14px", color: brand.text, marginBottom: "12px", lineHeight: 1.5 },
    filterRow: { display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-end" },
    input: { padding: "8px 12px", borderRadius: "6px", border: `1px solid ${brand.border}`,
             fontSize: "14px", flex: 1 },
    toast: { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "4px", fontWeight: 600 },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Load all jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8002/jobs/all", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (err) {
      notify("Could not load jobs. Make sure the Job Service is running.", "error");
    }
    setLoading(false);
  };

  const handleApplyClick = (jobId) => {
    // Store job ID for submit page
    localStorage.setItem("selectedJobId", jobId);
    onNavigate("submitApp");
  };

  const handleSaveJob = (job) => {
    const existing = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    const jobId = job.job_id || job.id;
    if (existing.some((j) => (j.job_id || j.id) === jobId)) {
      notify("Job already saved.");
      return;
    }
    const savedJob = {
      job_id: jobId,
      title: job.title,
      description: job.description,
      location: job.location,
      seniority_level: job.seniority_level,
      employment_type: job.employment_type,
      salary_range: job.salary_range,
      skills_required: job.skills_required,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem("savedJobs", JSON.stringify([savedJob, ...existing]));
    notify("Job saved.");
  };

  const filteredJobs = jobs.filter(job => {
    if (filter.seniority && job.seniority_level !== filter.seniority) return false;
    if (filter.employmentType && job.employment_type !== filter.employmentType) return false;
    return true;
  });

  return (
    <div style={s.page}>
      <LinkedInNav userType="member" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="member" />

        <div style={s.centerCol}>
          {message && (
            <div style={{ ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          <div style={s.card}>
            <div style={s.header}>
              <div>
                <div style={s.title}>Browse Job Postings</div>
                <div style={{ fontSize: "13px", color: brand.muted }}>Found {filteredJobs.length} jobs available</div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("memberHome")}>← Back</button>
            </div>

            <div style={s.filterRow}>
              <select
                style={s.input}
                value={filter.seniority}
                onChange={(e) => setFilter({ ...filter, seniority: e.target.value })}
              >
                <option value="">All Seniority Levels</option>
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
              </select>

              <select
                style={s.input}
                value={filter.employmentType}
                onChange={(e) => setFilter({ ...filter, employmentType: e.target.value })}
              >
                <option value="">All Employment Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted }}>Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted }}>
              No jobs match your filters. Try adjusting them.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.job_id || job.id} style={s.card}>
                <div style={s.jobTitle}>{job.title}</div>
                <div style={s.jobMeta}>
                  <span style={{ marginRight: "16px" }}>{job.location || "Remote"}</span>
                  <span style={{ ...s.badge, backgroundColor: "#E8F3FF", color: brand.blue }}>{job.seniority_level}</span>
                  <span style={{ marginLeft: "8px", ...s.badge, backgroundColor: "#F0F0F0", color: "#666" }}>
                    {job.employment_type}
                  </span>
                </div>
                <div style={s.jobDesc}>{job.description || "No description provided."}</div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {job.skills_required && (
                    <div style={{ fontSize: "12px", color: brand.muted }}>
                      <strong>Skills:</strong> {job.skills_required}
                    </div>
                  )}
                </div>
                {job.salary_range && (
                  <div style={{ fontSize: "13px", color: brand.blue, fontWeight: 600, marginTop: "8px" }}>
                    Salary: {job.salary_range}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button style={s.primaryBtn} onClick={() => handleApplyClick(job.job_id || job.id)}>
                    Apply Now
                  </button>
                  <button style={s.secondaryBtn} onClick={() => handleSaveJob(job)}>
                    Save Job
                  </button>
                  <button style={s.secondaryBtn} onClick={() => onNavigate("myApplications")}>
                    View My Applications
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <RightNewsRail role="member" />
      </div>
    </div>
  );
}
