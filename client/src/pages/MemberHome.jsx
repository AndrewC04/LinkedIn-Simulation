import React from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
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
      <LinkedInNav userType="member" onNavigate={onNavigate} />

      <div style={styles.layout}>
        <div style={{ position: "sticky", top: "80px", alignSelf: "start" }}>
          <LeftProfileRail role="member" />
        </div>

        <div style={styles.centerCol}>
          <div style={styles.card}>
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "10px" }}>
              Make a post
            </div>
            <div style={{ color: brand.muted, fontSize: "14px", marginBottom: "16px" }}>
              Share an update with your network.
            </div>

            <textarea
              style={styles.postInput}
              placeholder="What do you want to talk about?"
            />

            <div style={styles.postButtonRow}>
              <button style={styles.primaryBtn}>Post</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>RJ</div>
              <div>
                <div style={styles.postName}>Reesh Jain</div>
                <div style={styles.postMeta}>Software Engineer • 2h ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Excited to keep building projects and applying what I have learned in full-stack development.
              Recently worked on improving my job application tracker and polishing the UI to make it feel more like a real platform.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>AM</div>
              <div>
                <div style={styles.postName}>Anika Mehta</div>
                <div style={styles.postMeta}>Data Analyst • 5h ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Just completed my SQL and data visualization course. It is amazing how much clearer
              dashboards become when you think carefully about what story the data is actually telling.
              Excited to apply this in my next role.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>KP</div>
              <div>
                <div style={styles.postName}>Karan Patel</div>
                <div style={styles.postMeta}>Frontend Developer • 1d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Shipped my personal portfolio site today. Built with React, deployed on Vercel.
              It took about three weeks of evenings but I am really proud of how the animations turned out.
              Always good to have a place that is fully yours.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>SL</div>
              <div>
                <div style={styles.postName}>Sara Liu</div>
                <div style={styles.postMeta}>ML Engineer • 2d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Hot take: the most underrated skill for any engineer is knowing how to write a clear one-pager.
              You can build the best model in the world but if you cannot explain why it matters,
              it will not make it past the first stakeholder meeting.
            </div>
            <div style={styles.postActions}>
              <button style={styles.actionBtn}>Like</button>
              <button style={styles.actionBtn}>Comment</button>
              <button style={styles.actionBtn}>Repost</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>DT</div>
              <div>
                <div style={styles.postName}>Dev Tran</div>
                <div style={styles.postMeta}>Backend Engineer • 3d ago</div>
              </div>
            </div>
            <div style={styles.postText}>
              Grateful to share that I accepted an offer for a backend role at a fintech startup.
              Six months of consistent side projects, mock interviews, and networking really paid off.
              To anyone still in the grind — keep going. The right opportunity does come.
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
                <div style={styles.newsHeadline}>Tech hiring picks up for entry-level backend roles</div>
                <div style={styles.newsMeta}>Top story • 1d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>Recruiters say strong portfolios are helping candidates stand out</div>
                <div style={styles.newsMeta}>Career trends • 2d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>Remote and hybrid internships remain popular among students</div>
                <div style={styles.newsMeta}>Workplace news • 3d ago</div>
              </div>

              <div style={styles.newsItem}>
                <div style={styles.newsHeadline}>More applicants are tailoring resumes for each application</div>
                <div style={styles.newsMeta}>Job search • 4d ago</div>
              </div>

              <div style={{ ...styles.newsItem, borderBottom: "none", paddingBottom: 0 }}>
                <div style={styles.newsHeadline}>Frontend and full-stack roles continue to attract high interest</div>
                <div style={styles.newsMeta}>Industry update • 5d ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}