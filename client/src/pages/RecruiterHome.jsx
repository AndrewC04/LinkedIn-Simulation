import React from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

export default function RecruiterHome({ onNavigate }) {
  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: brand.bg,
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    layout: {
      maxWidth: "1150px",
      margin: "0 auto",
      padding: "24px 16px",
      display: "grid",
      gridTemplateColumns: "260px 1fr 280px",
      gap: "20px",
    },
    centerCol: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "18px",
      padding: "22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    titleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "16px",
      flexWrap: "wrap",
    },
    title: {
      fontSize: "28px",
      fontWeight: 800,
      color: brand.text,
      marginBottom: "6px",
    },
    subtitle: {
      color: brand.muted,
      fontSize: "14px",
      lineHeight: 1.5,
    },
    badge: {
      backgroundColor: "#E8F3FF",
      color: brand.blue,
      padding: "7px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
    },
    actions: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
    },
    primaryBtn: {
      backgroundColor: brand.blue,
      color: "white",
      border: "none",
      borderRadius: "999px",
      padding: "12px 16px",
      fontWeight: 800,
      cursor: "pointer",
    },
    secondaryBtn: {
      backgroundColor: "white",
      color: "#374151",
      border: `1px solid ${brand.border}`,
      borderRadius: "999px",
      padding: "12px 16px",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <LinkedInNav
        userType="recruiter"
        onNavigate={onNavigate}
        onLogout={() => onNavigate("auth")}
      />

      <div style={styles.layout}>
        <LeftProfileRail role="recruiter" />

        <div style={styles.centerCol}>
          <div style={styles.card}>
            <div style={styles.titleRow}>
              <div>
                <div style={styles.title}>Recruiter Home</div>
                <div style={styles.subtitle}>
                  Organized around recruiter workflows: manage jobs, review applicants, update
                  status, and leave notes.
                </div>
              </div>
              <div style={styles.badge}>Recruiter Dashboard</div>
            </div>

            <div style={styles.grid}>
              <FeatureCard
                title="Manage Job Postings"
                description="Create, update, close, and monitor job postings by recruiter."
                badge="Required"
              />
              <FeatureCard
                title="Review Applicants"
                description="View submitted applications for a job and inspect candidate details."
                badge="Required"
              />
              <FeatureCard
                title="Update Status"
                description="Move applications through submitted, reviewing, interview, offer, and rejected."
                badge="Required"
              />
              <FeatureCard
                title="Add Recruiter Notes"
                description="Capture internal decision rationale and review comments for each application."
                badge="Required"
              />
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "10px" }}>Quick actions</div>
            <div style={{ color: brand.muted, fontSize: "14px", marginBottom: "16px" }}>
              Frontend-only entry points for recruiter-facing application management.
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={() => onNavigate("manageJobs")}>
                Manage Jobs
              </button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("applicants")}>
                View Applicants
              </button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("statusUpdates")}>
                Update Status
              </button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("notes")}>
                Add Note
              </button>
            </div>
          </div>
        </div>

        <RightNewsRail role="recruiter" />
      </div>
    </div>
  );
}