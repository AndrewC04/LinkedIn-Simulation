import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobForm from "../components/JobForm.jsx";
import { createJob } from "../api/jobApi.js";

export default function CreateJob() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(payload) {
    try {
      setLoading(true);
      setError("");
      await createJob(payload);
      navigate("/recruiter/jobs");
    } catch (err) {
      setError(err?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="recruiter" />
      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ marginBottom: "16px" }}><Link to="/recruiter/jobs">Back</Link></div>
        <h1>Create Job</h1>
        {error && <div style={{ color: "crimson", marginBottom: "12px" }}>{error}</div>}
        <JobForm onSubmit={handleSubmit} submitLabel="Create Job" loading={loading} />
      </div>
    </div>
  );
}