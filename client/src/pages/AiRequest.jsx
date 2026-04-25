import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { submitAITask, getTaskStatus } from "../api/aiApi.js";
import { recruiterJobs } from "../api/applicationApi.js";

const brand = {
  blue: "#0a66c2",
  bg: "#f3f2ef",
  border: "#d9dee3",
  text: "#1d2226",
  muted: "#5e6a75",
};

export default function AIRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const recruiterId = user?.userId;

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidateIds, setCandidateIds] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await recruiterJobs(recruiterId, null, 1, 20);
        const jobList = data?.jobs || data?.items || (Array.isArray(data) ? data : []);
        setJobs(jobList);
      } catch {
        setError("Failed to load your jobs.");
      }
    }
    if (recruiterId) loadJobs();
  }, [recruiterId]);

  const handleSubmit = async () => {
    if (!selectedJob) return setError("Please select a job first.");
    setError("");
    setLoading(true);
    setStatusMsg("Submitting task to AI service...");

    try {
      const candidate_ids = candidateIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { task_id } = await submitAITask({
        job_id: selectedJob.job_id || selectedJob.id,
        recruiter_id: recruiterId,
        candidate_ids,
        trace_id: `trace-${Date.now()}`,
      });

      setStatusMsg("Task submitted! Waiting for AI pipeline to complete...");
      setPolling(true);

      // Poll status every 3 seconds
      const interval = setInterval(async () => {
        try {
          const status = await getTaskStatus(task_id);
          setStatusMsg(`AI Status: ${status.status} — Steps: ${status.steps_completed?.join(", ") || "starting..."}`);

          if (status.status === "awaiting_approval" || status.status === "complete") {
            clearInterval(interval);
            setPolling(false);
            setStatusMsg("AI pipeline complete! Redirecting to review...");
            setTimeout(() => navigate("/recruiter/ai-review"), 1500);
          }
        } catch {
          clearInterval(interval);
          setPolling(false);
          setError("Lost connection to AI service.");
        }
      }, 3000);

    } catch (err) {
      setError("Failed to submit task. Is the AI service running?");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    container: { maxWidth: "800px", margin: "0 auto", padding: "24px 16px" },
    card: { backgroundColor: "white", border: `1px solid ${brand.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "20px" },
    title: { fontSize: "26px", fontWeight: 800, color: brand.text, marginBottom: "6px" },
    subtitle: { fontSize: "14px", color: brand.muted, marginBottom: "24px" },
    label: { display: "block", fontWeight: 700, fontSize: "14px", color: brand.text, marginBottom: "8px" },
    jobCard: { border: `1px solid ${brand.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", cursor: "pointer", transition: "all 0.15s" },
    input: { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`, borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" },
    primaryBtn: { backgroundColor: brand.blue, color: "white", border: "none", borderRadius: "999px", padding: "12px 28px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
    secondaryBtn: { backgroundColor: "white", color: brand.text, border: `1px solid ${brand.border}`, borderRadius: "999px", padding: "12px 24px", fontWeight: 600, fontSize: "14px", cursor: "pointer", marginRight: "12px" },
    error: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", marginBottom: "16px" },
    status: { backgroundColor: "#eff6ff", color: brand.blue, border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", marginBottom: "16px" },
  };

  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" />
      <div style={s.container}>

        <div style={s.card}>
          <div style={s.title}>AI Hiring Assistant</div>
          <div style={s.subtitle}>
            Select a job, optionally provide candidate IDs, and launch the AI pipeline.
            The AI will shortlist candidates, score matches, and draft outreach messages.
          </div>

          {error && <div style={s.error}>{error}</div>}
          {statusMsg && <div style={s.status}>{statusMsg}</div>}

          {/* Job Selection */}
          <label style={s.label}>1. Select a Job</label>
          {jobs.length === 0 ? (
            <div style={{ color: brand.muted, fontSize: "14px", marginBottom: "20px" }}>
              No jobs found. Create a job posting first.
            </div>
          ) : (
            <div style={{ marginBottom: "24px" }}>
              {jobs.map((job, i) => {
                const jobId = job.job_id || job.id || `job-${i}`;
                const isSelected = selectedJob?.job_id === jobId || selectedJob?.id === jobId;
                return (
                  <div
                    key={jobId}
                    style={{
                      ...s.jobCard,
                      borderColor: isSelected ? brand.blue : brand.border,
                      backgroundColor: isSelected ? "#eff6ff" : "white",
                    }}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div style={{ fontWeight: 700, color: brand.text }}>{job.title || job.job_title}</div>
                    <div style={{ fontSize: "13px", color: brand.muted, marginTop: "2px" }}>
                      {job.company_name || job.company || ""} • {job.location || ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Candidate IDs */}
          <label style={s.label}>2. Candidate IDs (optional — comma separated)</label>
          <input
            style={{ ...s.input, marginBottom: "24px" }}
            placeholder="e.g. user-001, user-002, user-003"
            value={candidateIds}
            onChange={(e) => setCandidateIds(e.target.value)}
          />

          {/* Actions */}
          <div>
            <button style={s.secondaryBtn} onClick={() => navigate("/recruiter/home")}>
              ← Back
            </button>
            <button
              style={{ ...s.primaryBtn, opacity: loading || polling ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={loading || polling}
            >
              {polling ? "AI Running..." : loading ? "Submitting..." : "🤖 Run AI Pipeline"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}