import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applicationsByJob } from "../api/applicationApi";
import { getJob } from "../api/jobApi.js";
import LinkedInNav from "../components/LinkedInNav.jsx";

function StatusBadge({ status }) {
  const styles = {
    submitted: { background: "#e8f3ff", color: "#0a66c2", border: "1px solid #cfe5ff" },
    reviewing: { background: "#fff7e6", color: "#b26b00", border: "1px solid #f6ddb0" },
    interview: { background: "#f3e8ff", color: "#7c3aed", border: "1px solid #dfc8ff" },
    offer: { background: "#e8f7ee", color: "#15803d", border: "1px solid #c7ebd3" },
    rejected: { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
  };

  return (
    <span
      style={{
        ...(styles[status] || { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }),
        display: "inline-flex",
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

export default function ViewApplicants() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

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
    },
    tableCard: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      overflow: "hidden",
    },
    tableWrap: {
      overflowX: "auto",
    },
    table: {
      width: "100%",
      minWidth: "820px",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "16px 20px",
      fontSize: "13px",
      color: "#6b7280",
      fontWeight: 700,
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: "#fafafa",
    },
    td: {
      padding: "18px 20px",
      borderBottom: "1px solid #eef1f4",
      fontSize: "14px",
      color: "#334155",
      verticalAlign: "middle",
    },
    link: {
      color: "#0a66c2",
      fontWeight: 700,
      textDecoration: "none",
    },
    empty: {
      padding: "28px",
      color: "#6b7280",
      fontSize: "14px",
    },
  };

  useEffect(() => {
    async function load() {
      try {
        const [appData, jobData] = await Promise.all([
          applicationsByJob(jobId),
          getJob(jobId),
        ]);
        setApplications(appData.applications || []);
        setJobTitle(jobData?.title || jobId);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jobId]);

  return (
    <div style={styles.page}>
      <LinkedInNav userType="recruiter" />

      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>View Applicants</h1>
          <p style={styles.subtitle}>Applicants for: {jobTitle}</p>
        </div>

        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.empty}>Loading applicants...</div>
          ) : applications.length === 0 ? (
            <div style={styles.empty}>No applicants found.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Candidate</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Submitted</th>
                    <th style={styles.th}>Resume</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.application_id}>
                      <td style={{ ...styles.td, fontWeight: 700, color: "#1d2226" }}>
                        {app.member_name || app.member_id}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={styles.td}>
                        {new Date(app.submitted_at + 'Z').toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <a
                          href={`http://localhost:8003${app.resume_url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Open Resume
                        </a>
                      </td>
                      <td style={styles.td}>
                        <Link
                          to={`/recruiter/applications/open/${app.application_id}`}
                          style={styles.link}
                        >
                          Open Application
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}