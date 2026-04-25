import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applicationGet } from "../api/applicationApi";
import LinkedInNav from "../components/LinkedInNav.jsx";

function StatusBadge({ status }) {
  const styles = {
    submitted: {
      background: "#e8f3ff",
      color: "#0a66c2",
      border: "1px solid #cfe5ff",
    },
    reviewing: {
      background: "#fff7e6",
      color: "#b26b00",
      border: "1px solid #f6ddb0",
    },
    interview: {
      background: "#f3e8ff",
      color: "#7c3aed",
      border: "1px solid #dfc8ff",
    },
    offer: {
      background: "#e8f7ee",
      color: "#15803d",
      border: "1px solid #c7ebd3",
    },
    rejected: {
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
  };

  return (
    <span
      style={{
        ...(styles[status] || {
          background: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
        }),
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

export default function ViewApplicationDetails() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
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
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
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
      lineHeight: 1.5,
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 18px",
      borderRadius: "999px",
      border: "1px solid #cfd6dc",
      backgroundColor: "#fff",
      color: "#334155",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    card: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      overflow: "hidden",
      marginBottom: "22px",
    },
    section: {
      padding: "24px 28px",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      marginBottom: "22px",
      flexWrap: "wrap",
    },
    sectionTitle: {
      margin: 0,
      fontSize: "22px",
      fontWeight: 700,
      color: "#1d2226",
    },
    subtext: {
      marginTop: "4px",
      fontSize: "14px",
      color: "#5e6a75",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "22px 28px",
    },
    label: {
      fontSize: "13px",
      color: "#6b7280",
      fontWeight: 600,
      marginBottom: "6px",
    },
    value: {
      fontSize: "14px",
      color: "#1d2226",
      lineHeight: 1.5,
    },
    link: {
      color: "#0a66c2",
      fontWeight: 700,
      textDecoration: "none",
    },
    divider: {
      height: "1px",
      backgroundColor: "#eef1f4",
      margin: 0,
      border: 0,
    },
    noteList: {
      display: "grid",
      gap: "14px",
    },
    noteCard: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e6ebf0",
      borderRadius: "12px",
      padding: "16px 18px",
    },
    noteText: {
      margin: 0,
      fontSize: "14px",
      color: "#1f2937",
      lineHeight: 1.6,
      fontWeight: 500,
    },
    noteMeta: {
      marginTop: "10px",
      fontSize: "12px",
      color: "#6b7280",
    },
    empty: {
      color: "#6b7280",
      fontSize: "14px",
    },
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await applicationGet(applicationId);
        console.log("application details response:", data);
        setApplication(data);
      } catch (err) {
        console.error("Failed to load application:", err);
        alert(err.message || "Failed to load application.");
      } finally {
        setLoading(false);
      }
    }

    if (applicationId) {
      load();
    } else {
      setLoading(false);
    }
  }, [applicationId]);

  function renderDetail(label, value) {
    return (
      <div>
        <div style={styles.label}>{label}</div>
        <div style={styles.value}>{value}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <LinkedInNav userType="member" />

      <div style={styles.container}>
        <div style={styles.headerCard}>
          <div>
            <h1 style={styles.title}>Application Details</h1>
            <p style={styles.subtitle}>
              Review your application, open submitted files, and check the current status.
            </p>
          </div>

          <Link to="/member/applications" style={styles.backButton}>
            Back
          </Link>
        </div>

        {loading ? (
          <div style={styles.card}>
            <div style={styles.section}>
              <div style={styles.empty}>Loading application...</div>
            </div>
          </div>
        ) : !application ? (
          <div style={styles.card}>
            <div style={styles.section}>
              <div style={styles.empty}>Application not found.</div>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>
                    {application.job_title || application.job_id || "Job"}
                  </h2>
                  <div style={styles.subtext}>
                    Member: {application.member_name || application.member_id || "Member"}
                  </div>
                </div>

                <StatusBadge status={application.status} />
              </div>

              <div style={styles.grid}>
                {renderDetail(
                  "Job Name",
                  application.job_title || application.job_id || "N/A"
                )}
                {renderDetail(
                  "Member Name",
                  application.member_name || application.member_id || "N/A"
                )}
                {renderDetail(
                  "Submitted",
                  application.submitted_at
                    ? new Date(application.submitted_at).toLocaleString([], {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "N/A"
                )}

                <div>
                  <div style={styles.label}>Resume</div>
                  <div style={styles.value}>
                    {application.resume_url ? (
                      <a
                        href={`http://localhost:8003${application.resume_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.link}
                      >
                        Open Resume
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>

                <div>
                  <div style={styles.label}>Cover Letter</div>
                  <div style={styles.value}>
                    {application.cover_letter ? (
                      <a
                        href={`http://localhost:8003${application.cover_letter}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.link}
                      >
                        Open Cover Letter
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr style={styles.divider} />

            <div style={styles.section}>
              <h3
                style={{
                  margin: "0 0 14px",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1d2226",
                }}
              >
                Notes
              </h3>

              {!application.notes || application.notes.length === 0 ? (
                <div style={styles.empty}>No notes available.</div>
              ) : (
                <div style={styles.noteList}>
                  {application.notes.map((note) => (
                    <div key={note.note_id} style={styles.noteCard}>
                      <p style={styles.noteText}>{note.note}</p>
                      <div style={styles.noteMeta}>
                        {note.recruiter_name || note.recruiter_id} •{" "}
                        {new Date(note.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}