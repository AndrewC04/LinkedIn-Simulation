import React from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

export default function MemberHome({ onNavigate }) {
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
      <LinkedInNav userType="member" onNavigate={onNavigate} />

      <div style={styles.layout}>
        <LeftProfileRail role="member" />

        <div style={styles.centerCol}>
          <div style={styles.card}>
            <div style={styles.titleRow}>
              <div>
                <div style={styles.title}>Member Home</div>
                <div style={styles.subtitle}>
                  Focused on the required workflows: search jobs, view job details, apply, and track your applications.
                </div>
              </div>
              <div style={styles.badge}>Member Dashboard</div>
            </div>

            <div style={styles.grid}>
              <FeatureCard title="Search Jobs" description="Browse open positions and filter by keyword, location, employment type, and work mode." badge="Required" />
              <FeatureCard title="View Job Details" description="Open a job page, inspect requirements, and decide whether to apply." badge="Required" />
              <FeatureCard title="Apply to Jobs" description="Submit resume and cover letter through the Application Service workflow." badge="Required" />
              <FeatureCard title="My Applications" description="Track submitted, reviewing, interview, offer, and rejected statuses in one place." badge="Required" />
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "10px" }}>Quick actions</div>
            <div style={{ color: brand.muted, fontSize: "14px", marginBottom: "16px" }}>
              Frontend-only buttons for the member-side project flows.
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={() => onNavigate("jobSearch")}>Search Jobs</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("submitApplication")}>Apply to a Job</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("myApplications")}>My Applications</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("messages")}>Messages</button>
            </div>
          </div>
        </div>

        <RightNewsRail role="member" />
      </div>
    </div>
  );
}