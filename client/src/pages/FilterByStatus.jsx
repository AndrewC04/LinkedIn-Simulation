import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsByMember, session } from "../api/applicationApi";
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

export default function FilterByStatus() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("submitted");
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
    selectWrap: {
      marginTop: "18px",
    },
    select: {
      width: "260px",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid #cfd8e3",
      fontSize: "14px",
      backgroundColor: "#fff",
      outline: "none",
    },
    listCard: {
      backgroundColor: "#fff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      padding: "18px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
    },
    item: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      padding: "18px",
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      marginBottom: "14px",
      backgroundColor: "#fff",
    },
    itemTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    },
    jobTitle: {
      fontWeight: 700,
      color: "#1d2226",
      fontSize: "17px",
      margin: 0,
    },
    company: {
      marginTop: "6px",
      color: "#5e6a75",
      fontSize: "14px",
    },
    link: {
      color: "#0a66c2",
      fontWeight: 700,
      textDecoration: "none",
      fontSize: "14px",
    },
    empty: {
      color: "#6b7280",
      fontSize: "14px",
      padding: "12px 2px",
    },
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await applicationsByMember(session.userId || session.memberId);
        setApplications(data.applications || []);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    return applications.filter((app) => app.status === status);
  }, [applications, status]);

  return (
    <div style={styles.page}>
      <LinkedInNav userType="member" />

      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Filter by Status</h1>
          <p style={styles.subtitle}>
            Narrow your list to one status and focus on the applications that matter right now.
          </p>

          <div style={styles.selectWrap}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.select}
            >
              <option value="submitted">Submitted</option>
              <option value="reviewing">Reviewing</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div style={styles.listCard}>
          {loading ? (
            <div style={styles.empty}>Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>No applications in this status.</div>
          ) : (
            filtered.map((app) => (
              <div key={app.application_id} style={styles.item}>
                <div style={styles.itemTop}>
                  <div>
                    <p style={styles.jobTitle}>{app.job_title}</p>
                    <div style={styles.company}>{app.company_name}</div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>

                <div>
                  <Link
                    to={`/member/applications/details/${app.application_id}`}
                    style={styles.link}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}