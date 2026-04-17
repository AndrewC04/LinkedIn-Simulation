import React from "react";
import { brand } from "../styles/theme.js";

export default function FeatureCard({ title, description, badge }) {
  const styles = {
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "16px",
      padding: "18px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "10px",
    },
    title: {
      fontWeight: 700,
      fontSize: "16px",
      color: brand.text,
    },
    badge: {
      backgroundColor: "#E8F3FF",
      color: brand.blue,
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
    },
    text: {
      color: brand.muted,
      fontSize: "14px",
      lineHeight: 1.5,
      margin: 0,
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div style={styles.title}>{title}</div>
        {badge ? <div style={styles.badge}>{badge}</div> : null}
      </div>
      <p style={styles.text}>{description}</p>
    </div>
  );
}