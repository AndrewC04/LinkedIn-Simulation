import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { recruiterJobs } from "../api/applicationApi";

export default function SelectJob() {
  const { user } = useAuth();
  const recruiterId = user?.userId;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    headerCard: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      padding: "26px 28px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      marginBottom: "22px",
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
    card: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      padding: "18px",
    },
    jobCard: {
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      padding: "18px",
      marginBottom: "14px",
      backgroundColor: "#fff",
    },
    topRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
    },
    titleText: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 700,
      color: "#1d2226",
    },
    meta: {
      marginTop: "6px",
      fontSize: "14px",
      color: "#5e6a75",
    },
    pill: {
      display: "inline-flex",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "capitalize",
      backgroundColor: "#e8f3ff",
      color: "#0a66c2",
      border: "1px solid #cfe5ff",
    },
    actions: {
      marginTop: "14px",
    },
    link: {
      color: "#0a66c2",
      fontWeight: 700,
      textDecoration: "none",
      fontSize: "14px",
    },
    empty: {
      padding: "12px 2px",
      color: "#6b7280",
      fontSize: "14px",
    },
    error: {
      backgroundColor: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
      padding: "12px 14px",
      borderRadius: "10px",
      fontSize: "14px",
    },
  };

  useEffect(() => {
    async function loadJobs() {
      if (!recruiterId) {
        setLoading(false);
        setError("No recruiter ID found in session.");
        return;
      }

      try {
        setError("");

        const data = await recruiterJobs(recruiterId, null, 1, 20);
        console.log("select job user:", user);
        console.log("select job recruiterId:", recruiterId);
        console.log("select job API response:", data);

        // Support multiple possible response shapes safely
        const jobList =
          data?.jobs ||
          data?.items ||
          data?.results ||
          (Array.isArray(data) ? data : []);

        setJobs(Array.isArray(jobList) ? jobList : []);
      } catch (err) {
        console.error("Failed to load recruiter jobs:", err);
        setError(err.message || "Failed to load recruiter jobs.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [recruiterId, user]);

  return (
    <div style={styles.page}>
      <LinkedInNav userType="recruiter" />

      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Select Job</h1>
          <p style={styles.subtitle}>
            Choose one of your jobs to view its applicants.
          </p>
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={styles.empty}>Loading jobs...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : jobs.length === 0 ? (
            <div style={styles.empty}>No jobs found.</div>
          ) : (
            jobs.map((job, index) => {
              const jobId = job?.job_id || job?.id || `job-${index}`;
              const title = job?.title || job?.job_title || "Untitled Job";
              const company =
                job?.company_name || job?.company || job?.company_id || "Company";
              const status = job?.status || "open";
              const location = job?.location || "Location not specified";

              return (
                <div key={jobId} style={styles.jobCard}>
                  <div style={styles.topRow}>
                    <div>
                      <h2 style={styles.titleText}>{title}</h2>
                      <div style={styles.meta}>
                        {company} • {location}
                      </div>
                    </div>

                    <span style={styles.pill}>{status}</span>
                  </div>

                  <div style={styles.actions}>
                    <Link
                      to={`/recruiter/applications/view-applicants/${jobId}`}
                      style={styles.link}
                    >
                      View Applicants
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}