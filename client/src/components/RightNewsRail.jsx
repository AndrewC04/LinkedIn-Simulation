import React from "react";
import { brand } from "../styles/theme.js";

export default function RightNewsRail({ role }) {
  const items =
    role === "member"
      ? [
          "New backend engineer roles this week",
          "Application tracking dashboard updated",
          "Recruiters are actively reviewing candidates",
        ]
      : [
          "Applications increased 18% this week",
          "Two jobs have low applicant counts",
          "Member dashboard analytics ready for review",
        ];

  const styles = {
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    title: {
      fontWeight: 700,
      fontSize: "18px",
      marginBottom: "14px",
      color: brand.text,
    },
    item: {
      fontSize: "14px",
      color: brand.muted,
      lineHeight: 1.5,
      marginBottom: "12px",
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>LinkedIn Simulation Highlights</div>
      {items.map((item) => (
        <div key={item} style={styles.item}>
          • {item}
        </div>
      ))}
    </div>
  );
}