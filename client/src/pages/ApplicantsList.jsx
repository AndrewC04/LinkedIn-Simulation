import React, { useState, useEffect } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

export default function ApplicantsList({ onNavigate }) {
  const [jobs, setJobs]               = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState(null);

  const recruiter_id = "recruiter-001"; // replace with auth context later

  const s = {
    page:      { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout:    { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
                 display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card:      { backgroundColor: "white", border: `1px solid ${brand.border}`,
                 borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    title:     { fontSize: "20px", fontWeight: 800, color: brand.text },
    primaryBtn:{ backgroundColor: brand.blue, color: "white", border: "none",
                 borderRadius: "999px", padding: "10px 20px", fontWeight: 700,
                 cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    badge:     { display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                 fontSize: "12px", fontWeight: 700 },
    jobChip:   { padding: "8px 16px", borderRadius: "999px", fontSize: "14px",
                 fontWeight: 600, cursor: "pointer", border: `1px solid ${brand.border}` },
    row:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                 padding: "16px 0", borderBottom: `1px solid ${brand.border}` },
    toast:     { padding: "12px 16px", borderRadius: "8px", fontSize: "14px",
                 marginBottom: "4px", fontWeight: 600 },
  };

  const statusColors = {
    submitted:    { backgroundColor: "#EEF3FB", color: brand.blue },
    reviewing:    { backgroundColor: "#fefce8", color: "#a16207" },
    interview:    { backgroundColor: "#f0fdf4", color: "#15803d" },
    offer:        { backgroundColor: "#f0fdf4", color: "#15803d" },
    rejected:     { backgroundColor: "#fef2f2", color: "#dc2626" },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Load recruiter's jobs on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8002/jobs/byRecruiter", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recruiter_id })
        });
        const data = await res.json();
        setJobs(data.jobs || data);
      } catch {
        notify("Could not load jobs.", "error");
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load applicants when a job is selected
  const loadApplicants = async (job) => {
    setSelectedJob(job);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8003/applications/byJob", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.job_id })
      });
      const data = await res.json();
      setApplicants(data.applications || data);
    } catch {
      notify("Could not load applicants.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="recruiter" />

        <div style={s.centerCol}>
          {/* Toast */}
          {message && (
            <div style={{ ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          {/* Header */}
          <div style={s.card}>
            <div style={s.header}>
              <div>
                <div style={s.title}>Applicants by Job</div>
                <div style={{ color: brand.muted, fontSize: "14px", marginTop: "4px" }}>
                  Select a job posting to view its applicants
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("recruiterHome")}>← Back</button>
            </div>

            {/* Job selector chips */}
            {loading && !selectedJob && (
              <div style={{ color: brand.muted, fontSize: "14px" }}>Loading jobs...</div>
            )}
            {jobs.length === 0 && !loading && (
              <div style={{ color: brand.muted, fontSize: "14px" }}>
                No job postings found. Create one in Manage Jobs first.
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {jobs.map(job => (
                <button
                  key={job.job_id}
                  style={{
                    ...s.jobChip,
                    backgroundColor: selectedJob?.job_id === job.job_id ? brand.blue : "white",
                    color: selectedJob?.job_id === job.job_id ? "white" : brand.text,
                    borderColor: selectedJob?.job_id === job.job_id ? brand.blue : brand.border,
                  }}
                  onClick={() => loadApplicants(job)}
                >
                  {job.title}
                </button>
              ))}
            </div>
          </div>

          {/* Applicants list */}
          {selectedJob && (
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: "17px", marginBottom: "4px", color: brand.text }}>
                {selectedJob.title}
              </div>
              <div style={{ color: brand.muted, fontSize: "13px", marginBottom: "16px" }}>
                {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}
              </div>

              {loading && (
                <div style={{ color: brand.muted, fontSize: "14px", padding: "20px 0" }}>Loading applicants...</div>
              )}

              {!loading && applicants.length === 0 && (
                <div style={{ color: brand.muted, fontSize: "14px", padding: "20px 0", textAlign: "center" }}>
                  No applicants yet for this posting.
                </div>
              )}

              {applicants.map((app) => (
                <div key={app.application_id} style={s.row}>
                  {/* Avatar */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%",
                    backgroundColor: "#EEF3FB", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 800, color: brand.blue,
                    fontSize: "16px", flexShrink: 0 }}>
                    {(app.member_name || app.member_id || "?")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, marginLeft: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: brand.text }}>
                      {app.member_name || app.member_id}
                    </div>
                    <div style={{ fontSize: "13px", color: brand.muted, marginTop: "2px" }}>
                      Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "recently"}
                    </div>
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "13px", color: brand.blue, marginTop: "4px", display: "inline-block" }}>
                        View Resume ↗
                      </a>
                    )}
                    {app.ai_match_score != null && (
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ ...s.badge, backgroundColor: "#f0fdf4", color: "#15803d" }}>
                          AI Match: {Math.round(app.ai_match_score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <span style={{ ...s.badge, ...(statusColors[app.status] || statusColors.submitted) }}>
                      {app.status || "submitted"}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={s.secondaryBtn} onClick={() => onNavigate("statusUpdates")}>
                        Update Status
                      </button>
                      <button style={s.secondaryBtn} onClick={() => onNavigate("notes")}>
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RightNewsRail role="recruiter" />
      </div>
    </div>
  );
}