import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  applicationGet,
  applicationUpdateStatus,
  applicationAddNote,
} from "../api/applicationApi";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

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

export default function OpenApplication() {
  const { applicationId } = useParams();
  const { user } = useAuth();

  const recruiterId = user?.userId;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusValue, setStatusValue] = useState("submitted");
  const [statusSaving, setStatusSaving] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [message, setMessage] = useState("");
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
    noteTextStyle: {
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
    formsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "22px",
    },
    formCard: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e6ebf0",
      borderRadius: "14px",
      padding: "18px",
    },
    formTitle: {
      margin: "0 0 12px",
      fontSize: "18px",
      fontWeight: 700,
      color: "#1d2226",
    },
    input: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: "10px",
      border: "1px solid #cfd8e3",
      boxSizing: "border-box",
      fontSize: "14px",
      backgroundColor: "#fff",
      marginBottom: "12px",
    },
    textarea: {
      width: "100%",
      minHeight: "120px",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #cfd8e3",
      boxSizing: "border-box",
      fontSize: "14px",
      backgroundColor: "#fff",
      resize: "vertical",
      marginBottom: "12px",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    primaryButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 18px",
      borderRadius: "999px",
      backgroundColor: "#0a66c2",
      color: "#fff",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 700,
      border: "1px solid #0a66c2",
      cursor: "pointer",
    },
    empty: {
      color: "#6b7280",
      fontSize: "14px",
    },
    success: {
      backgroundColor: "#ecfdf5",
      color: "#166534",
      border: "1px solid #bbf7d0",
      padding: "12px 14px",
      borderRadius: "10px",
      marginBottom: "16px",
      fontSize: "14px",
    },
    errorBox: {
      backgroundColor: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
      padding: "12px 14px",
      borderRadius: "10px",
      marginBottom: "16px",
      fontSize: "14px",
    },
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await applicationGet(applicationId);
        setApplication(data);
        setStatusValue(data?.status || "submitted");
      } catch (err) {
        console.error("Failed to load application:", err);
        setError(err.message || "Failed to load application.");
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

  async function handleUpdateStatus() {
    setMessage("");
    setError("");

    if (!applicationId) {
      setError("Missing application ID.");
      return;
    }

    try {
      setStatusSaving(true);

      const data = await applicationUpdateStatus(applicationId, statusValue);

      setMessage(`Status updated to ${data.new_status || statusValue}.`);

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: data.new_status || statusValue,
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Failed to update status.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAddNote() {
    setMessage("");
    setError("");

    if (!applicationId) {
      setError("Missing application ID.");
      return;
    }

    if (!recruiterId) {
      setError("Missing recruiter ID.");
      return;
    }

    if (!noteText.trim()) {
      setError("Please enter a note.");
      return;
    }

    try {
      setNoteSaving(true);

      const newNote = await applicationAddNote(
        applicationId,
        recruiterId,
        noteText.trim()
      );

      setMessage("Note added successfully.");
      setNoteText("");

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              notes: [...(prev.notes || []), newNote],
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to add note:", err);
      setError(err.message || "Failed to add note.");
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <LinkedInNav userType="recruiter" />

      <div style={styles.container}>
        <div style={styles.headerCard}>
          <div>
            <h1 style={styles.title}>Open Application</h1>
            <p style={styles.subtitle}>
              Review one candidate submission, open uploaded files, update
              status, and leave notes.
            </p>
          </div>

          <Link
            to={
              application?.job_id
                ? `/recruiter/applications/view-applicants/${application.job_id}`
                : "/recruiter/applications/select-job"
            }
            style={styles.backButton}
          >
            Back
          </Link>
        </div>

        {message ? <div style={styles.success}>{message}</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

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
                    {application.job_title ||
                      application.job_name ||
                      application.job_id ||
                      "Job"}
                  </h2>
                  <div style={styles.subtext}>
                    Applicant:{" "}
                    {application.member_name ||
                      application.member_id ||
                      "Member"}
                  </div>
                </div>

                <StatusBadge status={application.status} />
              </div>

              <div style={styles.grid}>
                {renderDetail(
                  "Job Name",
                  application.job_title ||
                    application.job_name ||
                    application.job_id ||
                    "N/A"
                )}
                {renderDetail(
                  "Member Name",
                  application.member_name || application.member_id || "N/A"
                )}
                {renderDetail(
                  "Submitted",
                  application.submitted_at
                    ? new Date(application.submitted_at).toLocaleString()
                    : "N/A"
                )}

                <div>
                  <div style={styles.label}>Resume</div>
                  <div style={styles.value}>
                    {application.resume_url ? (
                      <a
                        href={`http://localhost:8000${application.resume_url}`}
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
                        href={`http://localhost:8000${application.cover_letter}`}
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
              <div style={styles.formsGrid}>
                <div style={styles.formCard}>
                  <h3 style={styles.formTitle}>Update Status</h3>

                  <div style={styles.label}>Application Status</div>
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    style={styles.input}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={statusSaving}
                    style={{
                      ...styles.primaryButton,
                      opacity: statusSaving ? 0.8 : 1,
                    }}
                  >
                    {statusSaving ? "Saving..." : "Save Status"}
                  </button>
                </div>

                <div style={styles.formCard}>
                  <h3 style={styles.formTitle}>Add Note</h3>

                  <div style={styles.label}>Recruiter Note</div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={styles.textarea}
                    placeholder="Write a note about this applicant"
                  />

                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={noteSaving}
                    style={{
                      ...styles.primaryButton,
                      opacity: noteSaving ? 0.8 : 1,
                    }}
                  >
                    {noteSaving ? "Saving..." : "Add Note"}
                  </button>
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
                      <p style={styles.noteTextStyle}>{note.note}</p>
                      <div style={styles.noteMeta}>
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