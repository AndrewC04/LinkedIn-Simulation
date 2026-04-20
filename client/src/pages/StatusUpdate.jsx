import React, { useState } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

const STATUSES = ["submitted", "reviewing", "interview", "offer", "rejected"];

const statusColors = {
  submitted: { backgroundColor: "#EEF3FB", color: brand.blue },
  reviewing: { backgroundColor: "#fefce8", color: "#a16207" },
  interview: { backgroundColor: "#f0fdf4", color: "#15803d" },
  offer:     { backgroundColor: "#f0fdf4", color: "#15803d" },
  rejected:  { backgroundColor: "#fef2f2", color: "#dc2626" },
};

export default function StatusUpdate({ onNavigate }) {
  const [applicationId, setApplicationId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("submitted");
  const [newStatus, setNewStatus]         = useState("reviewing");
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState(null);

  const s = {
    page:      { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout:    { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
                 display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card:      { backgroundColor: "white", border: `1px solid ${brand.border}`,
                 borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    title:     { fontSize: "20px", fontWeight: 800, color: brand.text, marginBottom: "6px" },
    label:     { fontSize: "13px", fontWeight: 600, color: brand.text, marginBottom: "6px", display: "block" },
    input:     { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`,
                 borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
    primaryBtn:{ backgroundColor: brand.blue, color: "white", border: "none",
                 borderRadius: "999px", padding: "10px 24px", fontWeight: 700,
                 cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    badge:     { display: "inline-block", padding: "4px 12px", borderRadius: "999px",
                 fontSize: "13px", fontWeight: 700 },
    toast:     { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600 },
    pipeline:  { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: "16px 0" },
    step:      { padding: "6px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSubmit = async () => {
    if (!applicationId.trim()) return notify("Please enter an application ID.", "error");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8005/applications/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId.trim(), status: newStatus })
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        notify(`Status updated to "${newStatus}" successfully!`);
        setApplicationId("");
      } else {
        notify("Update failed. Check the application ID.", "error");
      }
    } catch {
      notify("Could not connect to application service.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="recruiter" />

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={s.title}>Update Application Status</div>
                <div style={{ color: brand.muted, fontSize: "14px" }}>
                  Move a candidate through the hiring pipeline
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("recruiterHome")}>← Back</button>
            </div>

            {/* Pipeline visual */}
            <div style={s.pipeline}>
              {STATUSES.map((status, i) => (
                <React.Fragment key={status}>
                  <div style={{
                    ...s.step,
                    ...(statusColors[status]),
                    opacity: STATUSES.indexOf(currentStatus) >= i ? 1 : 0.35,
                  }}>
                    {status}
                  </div>
                  {i < STATUSES.length - 1 && (
                    <span style={{ color: brand.muted, fontSize: "16px" }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${brand.border}`, paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={s.label}>Application ID *</label>
                <input
                  style={s.input}
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="e.g. app-abc123"
                />
                <div style={{ fontSize: "12px", color: brand.muted, marginTop: "4px" }}>
                  Find this on the Applicants page next to each candidate.
                </div>
              </div>

              <div>
                <label style={s.label}>New Status</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      style={{
                        ...s.badge,
                        cursor: "pointer",
                        border: newStatus === status ? `2px solid ${brand.blue}` : `1px solid ${brand.border}`,
                        ...(statusColors[status]),
                        opacity: newStatus === status ? 1 : 0.6,
                        padding: "8px 18px",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button style={s.primaryBtn} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Updating..." : "Update Status"}
                </button>
                <button style={s.secondaryBtn} onClick={() => onNavigate("applicants")}>
                  Back to Applicants
                </button>
              </div>
            </div>
          </div>
        </div>

        <RightNewsRail role="recruiter" />
      </div>
    </div>
  );
}