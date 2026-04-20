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
                <div style={styles.title}>Member Dashboard</div>
                <div style={styles.subtitle}>
                  Organized around job seeker workflows: browse jobs, apply, track applications, and review feedback.
                </div>
              </div>
              <div style={styles.badge}>Job Seeker Hub</div>
            </div>

            <div style={styles.grid}>
              <FeatureCard title="Browse Jobs" description="Explore available job postings matched to your skills and interests." badge="Required" />
              <FeatureCard title="Submit Applications" description="Apply for jobs with your resume and cover letter." badge="Required" />
              <FeatureCard title="Track Applications" description="View your application history, status updates, and interview progress." badge="Required" />
              <FeatureCard title="Saved Jobs" description="Save interesting jobs and return to them when you are ready to apply." badge="Core" />
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "10px" }}>Quick actions</div>
            <div style={{ color: brand.muted, fontSize: "14px", marginBottom: "16px" }}>
              Get started with your job search and application tracking.
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={() => onNavigate("jobListings")}>Browse Jobs</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("submitApp")}>Submit Application</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("myApplications")}>Track Applications</button>
              <button style={styles.secondaryBtn} onClick={() => onNavigate("savedJobs")}>Saved Jobs</button>
            </div>
          </div>
        </div>

        <RightNewsRail role="member" />
      </div>
    </div>
  );
}