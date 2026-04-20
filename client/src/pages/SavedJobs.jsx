import React, { useEffect, useState } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

export default function SavedJobs({ onNavigate }) {
  const [savedJobs, setSavedJobs] = useState([]);

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
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setSavedJobs(stored);
  }, []);

  const removeSavedJob = (jobId) => {
    const updated = savedJobs.filter((job) => (job.job_id || job.id) !== jobId);
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  const applyToSavedJob = (jobId) => {
    localStorage.setItem("selectedJobId", jobId);
    onNavigate("submitApp");
  };

  return (
    <div style={s.page}>
      <LinkedInNav userType="member" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="member" />

        <div style={s.centerCol}>
          <div style={s.card}>
            <div style={s.header}>
              <div>
                <div style={s.title}>Saved Jobs</div>
                <div style={{ fontSize: "13px", color: brand.muted }}>
                  {savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("memberHome")}>Back</button>
            </div>
          </div>

          {savedJobs.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted }}>
              <div style={{ marginBottom: "12px" }}>No saved jobs yet.</div>
              <button style={s.primaryBtn} onClick={() => onNavigate("jobListings")}>
                Browse Jobs
              </button>
            </div>
          ) : (
            savedJobs.map((job) => (
              <div key={job.job_id || job.id} style={s.card}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: brand.text, marginBottom: "6px" }}>{job.title || "Untitled Job"}</div>
                <div style={{ fontSize: "13px", color: brand.muted, marginBottom: "8px" }}>
                  <span style={{ marginRight: "12px" }}>{job.location || "Remote"}</span>
                  {job.seniority_level && (
                    <span style={{ ...s.badge, backgroundColor: "#E8F3FF", color: brand.blue }}>{job.seniority_level}</span>
                  )}
                  {job.employment_type && (
                    <span style={{ marginLeft: "8px", ...s.badge, backgroundColor: "#F0F0F0", color: "#666" }}>{job.employment_type}</span>
                  )}
                </div>
                {job.description && (
                  <div style={{ fontSize: "14px", color: brand.text, lineHeight: 1.5, marginBottom: "10px" }}>{job.description}</div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button style={s.primaryBtn} onClick={() => applyToSavedJob(job.job_id || job.id)}>
                    Apply Now
                  </button>
                  <button style={s.secondaryBtn} onClick={() => removeSavedJob(job.job_id || job.id)}>
                    Remove
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
