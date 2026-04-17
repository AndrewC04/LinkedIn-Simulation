import React from "react";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LeftProfileRail({ role }) {
  const { user } = useAuth();

  const name = user?.displayName || (role === "member" ? "Member User" : "Recruiter User");
  const headline =
    role === "member"
      ? "Software Engineer | Open to work"
      : "Senior Recruiter at TechCorp";

  const styles = {
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    cover: {
      height: "84px",
      backgroundColor: brand.blue,
    },
    body: {
      padding: "0 18px 18px",
    },
    avatar: {
      width: "68px",
      height: "68px",
      borderRadius: "50%",
      backgroundColor: "white",
      border: "4px solid white",
      marginTop: "-34px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    },
    name: {
      marginTop: "12px",
      fontWeight: 700,
      fontSize: "18px",
      color: brand.text,
    },
    headline: {
      marginTop: "6px",
      fontSize: "14px",
      color: brand.muted,
      lineHeight: 1.5,
    },
    stats: {
      borderTop: `1px solid ${brand.border}`,
      marginTop: "16px",
      paddingTop: "14px",
      fontSize: "14px",
      color: "#4b5563",
    },
    statRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    value: {
      fontWeight: 700,
      color: brand.text,
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.cover} />
      <div style={styles.body}>
        <div style={styles.avatar} />
        <div style={styles.name}>{name}</div>
        <div style={styles.headline}>{headline}</div>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span>Profile viewers</span>
            <span style={styles.value}>42</span>
          </div>
          <div style={styles.statRow}>
            <span>Connections</span>
            <span style={styles.value}>128</span>
          </div>
        </div>
      </div>
    </div>
  );
}