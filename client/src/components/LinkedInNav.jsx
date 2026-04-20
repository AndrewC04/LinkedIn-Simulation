import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LinkedInNav({ userType }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const resolvedUserType = userType || user?.role || "member";

  const items =
    resolvedUserType === "member"
      ? [
          ["/member/home", "Home"],
          ["/member/profile", "Profile"],
          ["/member/jobs", "Jobs"],
          ["/member/applications", "My Applications"],
          ["/member/messages", "Messages"],
        ]
      : [
          ["/recruiter/home", "Home"],
          ["/recruiter/jobs", "Jobs"],
          ["/recruiter/applications", "Applicants"],
          ["/recruiter/analytics", "Analytics"],
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
    link: {
      textDecoration: "none",
      padding: "10px 12px",
      borderRadius: "999px",
      fontWeight: 600,
      color: "#4b5563",
      transition: "all 0.2s ease",
    },
    activeLink: {
      backgroundColor: "#e8f3ff",
      color: brand.blue,
    },
    userPill: {
      border: `1px solid ${brand.border}`,
      padding: "10px 14px",
      borderRadius: "999px",
      color: "#4b5563",
      fontWeight: 600,
      fontSize: "14px",
    },
    logoutButton: {
      border: `1px solid ${brand.border}`,
      padding: "10px 14px",
      borderRadius: "999px",
      color: "#4b5563",
      fontWeight: 600,
      fontSize: "14px",
      background: "white",
      cursor: "pointer",
    },
  };

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <div style={styles.brandBox}>in</div>
          <div style={styles.label}>LinkedIn Simulation</div>
        </div>

        <div style={styles.right}>
          {items.map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {label}
            </NavLink>
          ))}

          <div style={styles.userPill}>
            {user?.displayName || user?.email || "User"}
          </div>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}