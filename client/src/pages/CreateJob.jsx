import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import JobForm from "../components/JobForm.jsx";
import { createJob } from "../api/jobApi.js";

const DEMO_RECRUITER_ID = "000a9569-fb9d-4505-a550-8641196bdd49";
const DEMO_COMPANY_ID = "04f8fe99-fcba-430a-ba37-cd64f3fd49f3";

const COMPANY_NAMES_KEY = "companyNames";

export default function CreateJob() {
  const navigate = useNavigate();
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
        recruiter_id: payload.recruiter_id || DEMO_RECRUITER_ID,
        company_id: payload.company_id || DEMO_COMPANY_ID,
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
            recruiter_id: DEMO_RECRUITER_ID,
            company_id: DEMO_COMPANY_ID,
            company_name: "",
          }}
          onSubmit={handleSubmit}
          submitLabel="Create Job"
          loading={loading}
        />
      </div>
    </div>
  );
}