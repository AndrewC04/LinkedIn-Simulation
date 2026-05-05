import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const API = "http://aa7329fda3c2240879e987dc91a0e9d8-726efa2d8f64fd49.elb.us-east-2.amazonaws.com:8003";

export default function SubmitApplication() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function generateIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (!resume) {
      setError("Resume is required.");
      return;
    }

    if (!user?.userId) {
      setError("User not logged in.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("job_id", jobId);
      formData.append("member_id", user.userId);
      formData.append("idempotency_key", generateIdempotencyKey());
      formData.append("resume_file", resume);

      if (coverLetter) {
        formData.append("cover_letter_file", coverLetter);
      }

      const res = await fetch(`${API}/applications/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Submission failed");
      }

      setMessage("Application submitted successfully!");

      setTimeout(() => {
        if (data?.application_id) {
          navigate(`/member/applications/details/${data.application_id}`);
        } else {
          navigate("/member/applications/view");
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="member" />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #d9dee3",
            borderRadius: "16px",
            padding: "26px 28px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
            Submit Application
          </h1>

          <p style={{ marginTop: "8px", color: "#5e6a75" }}>
            Apply for this job by uploading your resume and optional cover letter.
          </p>

          {error && (
            <div style={{ color: "crimson", marginTop: "12px" }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ color: "green", marginTop: "12px" }}>
              {message}
            </div>
          )}

          {/* Resume Upload */}
          <div style={{ marginTop: "20px" }}>
            <label style={{ fontWeight: 700 }}>Resume (required)</label>
            <input
              type="file"
              onChange={(e) => setResume(e.target.files[0])}
              style={{ display: "block", marginTop: "8px" }}
            />
          </div>

          {/* Cover Letter Upload */}
          <div style={{ marginTop: "20px" }}>
            <label style={{ fontWeight: 700 }}>Cover Letter (optional)</label>
            <input
              type="file"
              onChange={(e) => setCoverLetter(e.target.files[0])}
              style={{ display: "block", marginTop: "8px" }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: "#0a66c2",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "999px",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>

            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #cfd6dc",
                padding: "10px 18px",
                borderRadius: "999px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}