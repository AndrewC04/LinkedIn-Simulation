import React, { useState, useEffect } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

const API = "http://localhost:8005";

export default function Submit({ onNavigate }) {
  const [jobId, setJobId] = useState("");
  const [memberId, setMemberId] = useState("mem_001");
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [idempotencyKey] = useState(crypto.randomUUID());

  const s = {
    page: { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout: { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
             display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card: { backgroundColor: "white", border: `1px solid ${brand.border}`,
            borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    title: { fontSize: "20px", fontWeight: 800, color: brand.text },
    label: { fontSize: "13px", fontWeight: 600, color: brand.text, marginBottom: "6px", display: "block" },
    input: { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`,
             borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none", marginBottom: "16px" },
    primaryBtn: { backgroundColor: brand.blue, color: "white", border: "none",
                  borderRadius: "999px", padding: "10px 24px", fontWeight: 700,
                  cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    toast: { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, marginBottom: "16px" },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3500);
  };

  useEffect(() => {
    const selectedJob = localStorage.getItem("selectedJobId");
    if (selectedJob) {
      setJobId(selectedJob);
      localStorage.removeItem("selectedJobId");
    }
  }, []);

  async function submit() {
    if (!jobId.trim()) return notify("Please enter or select a job ID.", "error");
    if (!resumeFile && !coverLetterFile) return notify("Please upload at least a resume or cover letter.", "error");

    setLoading(true);
    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("member_id", memberId);
    formData.append("idempotency_key", idempotencyKey);

    if (resumeFile) {
      formData.append("resume_file", resumeFile);
    }

    if (coverLetterFile) {
      formData.append("cover_letter_file", coverLetterFile);
    }

    try {
      const res = await fetch(`${API}/applications/submit`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        notify("Application submitted successfully!");
        setJobId("");
        setResumeFile(null);
        setCoverLetterFile(null);
      } else {
        notify("Failed to submit application. Please try again.", "error");
      }
    } catch (err) {
      notify("Could not connect to application service.", "error");
    }
    setLoading(false);
  }

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
                <div style={s.title}>Submit Application</div>
                <div style={{ color: brand.muted, fontSize: "14px" }}>
                  Apply for a job with your resume and cover letter
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("jobListings")}>← Back</button>
            </div>

            <div>
      <label style={s.label}>Job ID *</label>
      <input
        style={s.input}
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        placeholder="e.g. job-xyz789"
      />
      <div style={{ fontSize: "12px", color: brand.muted, marginTop: "-12px", marginBottom: "12px" }}>
        Find this by browsing jobs or paste the ID directly.
      </div>

      <label style={s.label}>Member ID</label>
      <input
        style={s.input}
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="e.g. mem_001"
      />

      <label style={s.label}>Resume File</label>
      <input
        style={s.input}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
      />
      {resumeFile && (
        <div style={{ fontSize: "12px", color: "#15803d", marginTop: "-12px", marginBottom: "12px" }}>
          ✓ {resumeFile.name}
        </div>
      )}

      <label style={s.label}>Cover Letter File</label>
      <input
        style={s.input}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
      />
      {coverLetterFile && (
        <div style={{ fontSize: "12px", color: "#15803d", marginTop: "-12px", marginBottom: "12px" }}>
          ✓ {coverLetterFile.name}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={s.primaryBtn} onClick={submit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
        <button style={s.secondaryBtn} onClick={() => onNavigate("myApplications")}>
          View My Applications
        </button>
      </div>
            </div>
          </div>
        </div>

        <RightNewsRail role="member" />
      </div>
    </div>
  );
}