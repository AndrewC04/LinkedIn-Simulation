import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobForm from "../components/JobForm.jsx";
import { getJob, updateJob } from "../api/jobApi.js";

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function loadJob() {
    try {
      setPageLoading(true);
      setError("");
      const data = await getJob(jobId, "mem_0001");
      setJob(data);
    } catch (err) {
      setError(err?.message || "Failed to load job");
    } finally {
      setPageLoading(false);
    }
  }

  async function handleSubmit(payload) {
    try {
      setLoading(true);
      setError("");

      const fields = {
        title: payload.title,
        description: payload.description,
        seniority_level: payload.seniority_level,
        employment_type: payload.employment_type,
        location: payload.location,
        work_mode: payload.work_mode,
        industry: payload.industry,
        skills_required: payload.skills_required,
        salary_range: payload.salary_range,
      };

      await updateJob(jobId, fields);
      navigate("/recruiter/jobs");
    } catch (err) {
      setError(err?.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f2ef", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType="recruiter" />
      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ marginBottom: "16px" }}><Link to="/recruiter/jobs">Back</Link></div>
        <h1>Edit Job</h1>
        {error && <div style={{ color: "crimson", marginBottom: "12px" }}>{error}</div>}
        {pageLoading ? <div>Loading job...</div> : job && (
          <JobForm
            initialValues={job}
            onSubmit={handleSubmit}
            submitLabel="Update Job"
            includeOwnerFields={false}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}