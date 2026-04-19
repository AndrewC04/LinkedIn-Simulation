import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recruiterJobs } from "../api/applicationApi";
import LinkedInNav from "../components/LinkedInNav.jsx";

export default function SelectJob() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const navigate = useNavigate();

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f3f2ef",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    container: {
      maxWidth: "1128px",
      margin: "0 auto",
      padding: "24px 16px 40px",
    },
    card: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
    },
    title: {
      margin: 0,
      fontSize: "30px",
      fontWeight: 700,
      color: "#1d2226",
    },
    subtitle: {
      marginTop: "8px",
      fontSize: "14px",
      color: "#5e6a75",
      lineHeight: 1.6,
    },
    fieldLabel: {
      marginTop: "22px",
      marginBottom: "8px",
      display: "block",
      fontSize: "14px",
      fontWeight: 700,
      color: "#1d2226",
    },
    select: {
      width: "100%",
      maxWidth: "560px",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid #cfd8e3",
      fontSize: "14px",
      backgroundColor: "#fff",
      outline: "none",
    },
    button: {
      marginTop: "20px",
      backgroundColor: "#0a66c2",
      color: "#fff",
      border: "none",
      borderRadius: "999px",
      padding: "12px 22px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  useEffect(() => {
    async function load() {
      const data = await recruiterJobs();
      setJobs(data);
      if (data.length > 0) setSelectedJobId(data[0].job_id);
    }

    load();
  }, []);

  function handleViewApplicants() {
    if (!selectedJobId) return;
    navigate(`/recruiter/applications/view-applicants/${selectedJobId}`);
  }

  return (
    <div style={styles.page}>
      <LinkedInNav userType="recruiter" />

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Select Job</h1>
          <p style={styles.subtitle}>
            Choose one of your job postings to review all associated applicants.
          </p>

          <label style={styles.fieldLabel}>Job Posting</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={styles.select}
          >
            {jobs.map((job) => (
              <option key={job.job_id} value={job.job_id}>
                {job.title} — {job.company_name}
              </option>
            ))}
          </select>

          <button onClick={handleViewApplicants} style={styles.button}>
            View Applicants
          </button>
        </div>
      </div>
    </div>
  );
}