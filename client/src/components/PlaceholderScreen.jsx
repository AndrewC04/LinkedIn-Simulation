import React from "react";
import { brand } from "../styles/theme.js";

export default function PlaceholderScreen({ title, description, onBack }) {
  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: brand.bg,
      padding: "40px 16px",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    container: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "24px",
      padding: "28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    title: {
      fontSize: "30px",
      fontWeight: 700,
      marginBottom: "10px",
      color: brand.text,
    },
    desc: {
      fontSize: "15px",
      color: brand.muted,
      marginBottom: "22px",
    },
    box: {
      backgroundColor: "#F8FAFD",
      border: "1px dashed #cbd5e1",
      borderRadius: "18px",
      padding: "24px",
      color: brand.muted,
      lineHeight: 1.6,
      marginBottom: "18px",
    },
    button: {
      backgroundColor: brand.blue,
      color: "white",
      border: "none",
      borderRadius: "999px",
      padding: "12px 18px",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>{title}</div>
          <div style={styles.desc}>{description}</div>
          <div style={styles.box}>
            This page is intentionally frontend-only for now. You can wire it later to your service
            endpoints like <code>/applications/submit</code>, <code>/applications/byMember</code>,
            <code>/applications/byJob</code>, <code>/applications/updateStatus</code>, and
            <code>/applications/addNote</code>.
          </div>
          <button style={styles.button} onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}