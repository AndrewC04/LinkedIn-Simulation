import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobForm from "../components/JobForm.jsx";
import { createJob } from "../api/jobApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

const COMPANY_NAMES_KEY = "companyNames";

export default function CreateJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function saveCompanyName(jobId, companyName) {
    const current = JSON.parse(localStorage.getItem(COMPANY_NAMES_KEY) || "{}");

    localStorage.setItem(
      COMPANY_NAMES_KEY,
      JSON.stringify({
        ...current,
        [jobId]: companyName,
      })
    );
  }

  async function handleSubmit(payload) {
    try {
      setLoading(true);
      setError("");

      const companyName = payload.company_name?.trim() || "Company not listed";

      const finalPayload = {
        ...payload,
        recruiter_id: user?.userId,
        company_id: user?.companyId || payload.company_id,
      };

      delete finalPayload.company_name;

      const createdJob = await createJob(finalPayload);

      const jobId =
        createdJob?.job_id ||
        createdJob?.job?.job_id ||
        createdJob?.data?.job_id;

      if (jobId) {
        saveCompanyName(jobId, companyName);
      }

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
        <div style={{ marginBottom: "16px" }}>
          <Link to="/recruiter/jobs">Back</Link>
        </div>

        <h1>Create Job</h1>

        {error && <div style={{ color: "crimson", marginBottom: "12px" }}>{error}</div>}

        <JobForm
          initialValues={{
            recruiter_id: user?.userId || "",
            company_id: user?.companyId || "",
            company_name: user?.companyName || "",
          }}
          onSubmit={handleSubmit}
          submitLabel="Create Job"
          loading={loading}
          showCompanyName={false}
        />
      </div>
    </div>
  );
}