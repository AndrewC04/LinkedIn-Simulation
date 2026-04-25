import React from "react";
import { useNavigate } from "react-router-dom";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

export default function RecruiterHome({ onNavigate }) {
  const navigate = useNavigate();

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
    subtitle: {
      color: brand.muted,
      fontSize: "14px",
      lineHeight: 1.5,
      marginBottom: "16px",
    },
    badge: {
      backgroundColor: "#E8F3FF",
      color: brand.blue,
      padding: "7px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      display: "inline-flex",
      marginBottom: "18px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
    },
    sectionTitle: {
      fontWeight: 800,
      fontSize: "20px",
      marginBottom: "10px",
      color: brand.text,
    },
    postInput: {
      width: "100%",
      minHeight: "90px",
      border: `1px solid ${brand.border}`,
      borderRadius: "12px",
      padding: "14px",
      fontSize: "14px",
      outline: "none",
      resize: "none",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: "border-box",
    },
    postButtonRow: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "14px",
    },
    primaryBtn: {
      backgroundColor: brand.blue,
      color: "white",
      border: "none",
      borderRadius: "999px",
      padding: "12px 18px",
      fontWeight: 800,
      cursor: "pointer",
    },
    secondaryBtn: {
      backgroundColor: "white",
      color: brand.text,
      border: `1px solid ${brand.border}`,
      borderRadius: "999px",
      padding: "12px 16px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
    },
    aiBtn: {
      backgroundColor: "#eff6ff",
      color: brand.blue,
      border: `1px solid #bfdbfe`,
      borderRadius: "999px",
      padding: "12px 16px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
    },
    actionsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px",
      marginTop: "16px",
    },
    postHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "14px",
    },
    avatar: {
      width: "52px",
      height: "52px",
      borderRadius: "50%",
      backgroundColor: "#e8f3ff",
      color: brand.blue,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: "18px",
      flexShrink: 0,
    },
    postName: {
      fontWeight: 800,
      fontSize: "16px",
      color: brand.text,
    },
    postMeta: {
      fontSize: "13px",
      color: brand.muted,
      marginTop: "3px",
    },
    postText: {
      fontSize: "15px",
      color: brand.text,
      lineHeight: 1.7,
      marginBottom: "14px",
    },
    postActions: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      paddingTop: "12px",
      borderTop: `1px solid ${brand.border}`,
    },
    actionBtn: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "999px",
      padding: "10px 14px",
      fontWeight: 700,
      color: "#374151",
      cursor: "pointer",
    },
    rightCardTitle: {
      fontSize: "18px",
      fontWeight: 800,
      color: brand.text,
      marginBottom: "14px",
    },
    newsList: {
      display: "grid",
      gap: "14px",
    },
    newsItem: {
      paddingBottom: "12px",
      borderBottom: `1px solid ${brand.border}`,
    },
    newsHeadline: {
      fontSize: "14px",
      fontWeight: 700,
      color: brand.text,
      lineHeight: 1.4,
      marginBottom: "4px",
    },
    newsMeta: {
      fontSize: "12px",
      color: brand.muted,
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.page}>
      <LinkedInNav userType="recruiter" />

      <div style={styles.layout}>
        <div style={{ position: "sticky", top: "80px", alignSelf: "start", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LeftProfileRail role="recruiter" />
          <div style={styles.card}>
            <div style={styles.sectionTitle}>AI Tools</div>
            <div style={{ ...styles.actionsGrid, gridTemplateColumns: "1fr" }}>
              <button
                style={styles.aiBtn}
                onClick={() => navigate("/recruiter/ai-request")}
              >
                🤖 AI Hiring Assistant
              </button>
              <button
                style={styles.aiBtn}
                onClick={() => navigate("/recruiter/ai-review")}
              >
                📋 AI Review Center
              </button>
            </div>
          </div>
        </div>

        <div style={styles.centerCol}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Make a post</div>
            <div style={styles.subtitle}>
              Share an update with your hiring network.
            </div>
            <textarea
              style={styles.postInput}
              placeholder="Share a hiring update, role opening, or recruiting tip..."
            />
            <div style={styles.postButtonRow}>
              <button style={styles.primaryBtn}>Post</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>RC</div>
              <div>
                <div style={styles.postName}>Recruiter Central</div>
                <div style={styles.postMeta}>Hiring Team • 3h ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              We are actively reviewing applications for backend, frontend, and full-stack
              roles this week. Candidates with polished resumes, strong project work, and
              clear communication are standing out early in the process.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>JW</div>
              <div>
                <div style={styles.postName}>Jess Wu</div>
                <div style={styles.postMeta}>Technical Recruiter • 6h ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Reminder to all candidates: a personalized cover letter still makes a real difference.
              We read them. When someone explains exactly why they want this specific role at this
              specific company, it moves them up the list every time.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>MB</div>
              <div>
                <div style={styles.postName}>Marcus Bell</div>
                <div style={styles.postMeta}>Head of Talent • 1d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              We just opened three new engineering roles across backend and platform infrastructure.
              If you have experience with distributed systems or cloud-native tooling, I would love
              to connect. DMs are open.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>NR</div>
              <div>
                <div style={styles.postName}>Nina Rao</div>
                <div style={styles.postMeta}>Campus Recruiter • 2d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Wrapping up our spring internship cycle. The quality of applicants this year was
              genuinely impressive. A few things that stood out: clear GitHub projects, concise
              resumes, and candidates who could explain their trade-offs in technical screens.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>TH</div>
              <div>
                <div style={styles.postName}>Tom Haines</div>
                <div style={styles.postMeta}>Recruiting Lead • 3d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Feedback loops matter. If a candidate takes time to interview with your team,
              they deserve a clear and timely response. Ghosting damages your employer brand
              more than most companies realize. Let us do better.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>
        </div>

        <div style={{ position: "sticky", top: "80px", alignSelf: "start" }}>
          <div style={styles.card}>
            <div style={styles.rightCardTitle}>LinkedIn News</div>

            <div style={styles.newsList}>
              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>
                  Recruiters are prioritizing candidates with project-based experience
                </div>
                <div style={styles.newsMeta}>Top story • 1d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>
                  Hiring teams continue to balance speed with candidate experience
                </div>
                <div style={styles.newsMeta}>Hiring trends • 2d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>
                  Internship and new grad pipelines remain competitive in tech
                </div>
                <div style={styles.newsMeta}>Campus recruiting • 3d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>
                  More employers are asking recruiters to improve feedback turnaround time
                </div>
                <div style={styles.newsMeta}>Workplace news • 4d ago</div>
              </div>

              <div style={{ ...styles.newsItem, borderBottom: "none", paddingBottom: 0 }}>
                <div style={styles.newsHeadline}>
                  Application review workflows are becoming more data-driven
                </div>
                <div style={styles.newsMeta}>Industry update • 5d ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}