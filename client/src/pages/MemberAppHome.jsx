import React from "react";
import { Link } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";

export default function MemberAppHome() {
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
    heroCard: {
      backgroundColor: "#ffffff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
      marginBottom: "22px",
    },
    heroTitle: {
      margin: 0,
      fontSize: "32px",
      fontWeight: 700,
      color: "#1d2226",
      letterSpacing: "-0.02em",
    },
    heroText: {
      marginTop: "10px",
      fontSize: "15px",
      color: "#5e6a75",
      lineHeight: 1.6,
      maxWidth: "720px",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#1d2226",
      margin: "0 0 14px 2px",
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
    },
    actionCard: {
      backgroundColor: "#ffffff",
      border: "1px solid #d9dee3",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      textDecoration: "none",
      color: "inherit",
      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      display: "block",
    },
    actionTop: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "14px",
    },
    actionIcon: {
      width: "46px",
      height: "46px",
      borderRadius: "12px",
      backgroundColor: "#e8f3ff",
      color: "#0a66c2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: "18px",
      flexShrink: 0,
    },
    actionTitle: {
      margin: 0,
      fontSize: "20px",
      fontWeight: 700,
      color: "#1d2226",
    },
    actionText: {
      margin: 0,
      color: "#5e6a75",
      fontSize: "14px",
      lineHeight: 1.6,
    },
    actionFooter: {
      marginTop: "18px",
      color: "#0a66c2",
      fontSize: "14px",
      fontWeight: 700,
    },
  };

  const hoverIn = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.10)";
    e.currentTarget.style.borderColor = "#b9d6f2";
  };

  const hoverOut = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.07)";
    e.currentTarget.style.borderColor = "#d9dee3";
  };

  return (
    <div style={styles.page}>
      <LinkedInNav userType="member" />

      <div style={styles.container}>
        <div style={styles.heroCard}>
          <h1 style={styles.heroTitle}>My Applications</h1>
          <p style={styles.heroText}>
            View your submitted applications, open details, and filter by status
            with a clean application workflow.
          </p>
        </div>

        <div>
          <div style={styles.sectionTitle}>Application tools</div>

          <div style={styles.cardGrid}>
            <Link
              to="/member/applications/view"
              style={styles.actionCard}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <div style={styles.actionTop}>
                <div style={styles.actionIcon}>VA</div>
                <h2 style={styles.actionTitle}>View My Applications</h2>
              </div>
              <p style={styles.actionText}>
                See every application you’ve submitted, along with company,
                status, and submission date.
              </p>
              <div style={styles.actionFooter}>Open applications list</div>
            </Link>

            <Link
              to="/member/applications/filter"
              style={styles.actionCard}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <div style={styles.actionTop}>
                <div style={styles.actionIcon}>FS</div>
                <h2 style={styles.actionTitle}>Filter by Status</h2>
              </div>
              <p style={styles.actionText}>
                Focus on just the applications you want to review, such as
                submitted, reviewing, interview, offer, or rejected.
              </p>
              <div style={styles.actionFooter}>Filter application statuses</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}