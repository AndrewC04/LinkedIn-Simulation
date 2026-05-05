import React, { useState, useEffect } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

export default function MyApplications({ onNavigate }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("all");

  const member_id = "mem_001"; // replace with auth context later

  const s = {
    page: { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout: { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
             display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card: { backgroundColor: "white", border: `1px solid ${brand.border}`,
            borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    title: { fontSize: "20px", fontWeight: 800, color: brand.text },
    primaryBtn: { backgroundColor: brand.blue, color: "white", border: "none",
                  borderRadius: "999px", padding: "10px 20px", fontWeight: 700,
                  cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    badge: { display: "inline-block", padding: "3px 10px", borderRadius: "999px",
             fontSize: "12px", fontWeight: 700 },
    appCard: { padding: "16px", borderRadius: "8px", border: `1px solid ${brand.border}`,
               marginBottom: "12px", backgroundColor: "#fafafa" },
    appTitle: { fontSize: "15px", fontWeight: 700, color: brand.text, marginBottom: "6px" },
    appMeta: { fontSize: "13px", color: brand.muted, marginBottom: "8px" },
    statusBadges: {
      submitted: { backgroundColor: "#EEF3FB", color: brand.blue },
      reviewing: { backgroundColor: "#fefce8", color: "#a16207" },
      interview: { backgroundColor: "#f0fdf4", color: "#15803d" },
      offer: { backgroundColor: "#f0fdf4", color: "#15803d" },
      rejected: { backgroundColor: "#fef2f2", color: "#dc2626" },
    },
    filterRow: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
    filterBtn: (isActive) => ({
      padding: "8px 16px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      border: isActive ? `2px solid ${brand.blue}` : `1px solid ${brand.border}`,
      backgroundColor: isActive ? brand.blue : "white",
      color: isActive ? "white" : brand.text,
    }),
    toast: { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "4px", fontWeight: 600 },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://a55cb80cd2cbd486ca4773ae0be96669-49a6f0b64a9c73f6.elb.us-east-2.amazonaws.com:8005/applications/byMember", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id })
      });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (err) {
      notify("Could not load applications. Make sure the Application Service is running.", "error");
    }
    setLoading(false);
  };

  const filteredApplications = filter === "all"
    ? applications
    : applications.filter(app => app.status === filter);

  const statuses = ["all", "submitted", "reviewing", "interview", "offer", "rejected"];

  return (
    <div style={s.page}>
      <LinkedInNav userType="member" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="member" />

        <div style={s.centerCol}>
          {message && (
            <div style={{ ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          <div style={s.card}>
            <div style={s.header}>
              <div>
                <div style={s.title}>My Applications</div>
                <div style={{ fontSize: "13px", color: brand.muted }}>
                  Tracking {filteredApplications.length} application{filteredApplications.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("memberHome")}>← Back</button>
            </div>

            <div style={s.filterRow}>
              {statuses.map((status) => (
                <button
                  key={status}
                  style={s.filterBtn(filter === status)}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted }}>Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted }}>
              <div style={{ marginBottom: "12px" }}>
                No {filter !== "all" ? filter : ""} applications yet.
              </div>
              <button style={s.primaryBtn} onClick={() => onNavigate("jobListings")}>
                Browse Jobs
              </button>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.application_id} style={s.card}>
                <div style={s.appTitle}>{app.job_title || "Job Position"}</div>
                <div style={s.appMeta}>
                  <span style={{ marginRight: "16px" }}>ID: {app.application_id}</span>
                  <span style={{
                    ...s.badge,
                    ...s.statusBadges[app.status || "submitted"]
                  }}>
                    {(app.status || "submitted").charAt(0).toUpperCase() + (app.status || "submitted").slice(1)}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", fontSize: "13px" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: brand.text }}>Submitted:</span>
                    <div style={{ color: brand.muted }}>
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  {app.updated_at && (
                    <div>
                      <span style={{ fontWeight: 600, color: brand.text }}>Last Updated:</span>
                      <div style={{ color: brand.muted }}>
                        {new Date(app.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button style={s.secondaryBtn} onClick={() => onNavigate("savedJobs")}>
                    View Saved Jobs
                  </button>
                  <button style={s.secondaryBtn} onClick={() => onNavigate("jobListings")}>
                    Browse More Jobs
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <RightNewsRail role="member" />
      </div>
    </div>
  );
}
