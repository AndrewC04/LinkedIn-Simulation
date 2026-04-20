import React from "react";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LinkedInNav({ userType, onNavigate }) {
  const { logout, user } = useAuth();

  const items =
    userType === "member"
      ? [
          ["memberHome", "Home"],
          ["jobListings", "Browse Jobs"],
          ["myApplications", "My Applications"],
          ["savedJobs", "Saved Jobs"],
        ]
      : [
          ["recruiterHome", "Home"],
          ["manageJobs", "Jobs"],
          ["applicants", "Applicants"],
          ["analytics", "Analytics"],
        ];

  const styles = {
    nav: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      backgroundColor: "white",
      borderBottom: `1px solid ${brand.border}`,
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    inner: {
      maxWidth: "1150px",
      margin: "0 auto",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    },
    left: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    brandBox: {
      width: "40px",
      height: "40px",
      borderRadius: "8px",
      backgroundColor: brand.blue,
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: "22px",
    },
    label: {
      color: "#555",
      fontSize: "14px",
    },
    right: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    },
    button: {
      background: "transparent",
      border: "none",
      padding: "10px 12px",
      borderRadius: "999px",
      cursor: "pointer",
      fontWeight: 600,
      color: "#4b5563",
    },
    userPill: {
      border: `1px solid ${brand.border}`,
      padding: "10px 14px",
      borderRadius: "999px",
      color: "#4b5563",
      fontWeight: 600,
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <div style={styles.brandBox}>in</div>
          <div style={styles.label}>LinkedIn Simulation</div>
        </div>

        <div style={styles.right}>
          {items.map(([key, label]) => (
            <button key={key} style={styles.button} onClick={() => onNavigate(key)}>
              {label}
            </button>
          ))}
          <div style={styles.userPill}>{user?.displayName || user?.email}</div>
          <button
            style={styles.userPill}
            onClick={() => {
              logout();
              onNavigate("home");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}