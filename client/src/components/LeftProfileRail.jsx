import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { getConnectionCount } from "../api/connectionApi.js";
import { getMemberProfile } from "../api/profileApi.js";

export default function LeftProfileRail({ role }) {
  const { user } = useAuth();
  const [connectionCount, setConnectionCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);

  const name = user?.displayName || (role === "member" ? "Member User" : "Recruiter User");
  const headline =
    role === "member"
      ? "Software Engineer | Open to work"
      : user?.companyName
        ? `Recruiter at ${user.companyName}`
        : "Recruiter";

  const initials = (name || "U")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let cancelled = false;

    async function loadConnectionCount() {
      if (role !== "member" || !user?.userId) {
        setConnectionCount(0);
        return;
      }

      try {
        const res = await getConnectionCount(user.userId);
        if (!cancelled) {
          setConnectionCount(Number(res?.total_connections) || 0);
        }
      } catch {
        if (!cancelled) {
          setConnectionCount(0);
        }
      }
    }

    function handleConnectionsUpdated() {
      loadConnectionCount();
    }

    window.addEventListener("connections:updated", handleConnectionsUpdated);
    loadConnectionCount();

    return () => {
      cancelled = true;
      window.removeEventListener("connections:updated", handleConnectionsUpdated);
    };
  }, [role, user?.userId]);

  function refreshProfile() {
    if (role !== "member" || !user?.userId) return;
    getMemberProfile(user.userId)
      .then((p) => {
        setPhotoUrl(p?.profile_photo_url || null);
        setBannerUrl(p?.banner_photo_url || null);
        setProfileViews(Number(p?.profile_views) || 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshProfile();
  }, [role, user?.userId]);

  useEffect(() => {
    function handleViewReceived(e) {
      if (e.detail?.viewed_member_id === user?.userId) {
        setProfileViews((v) => v + 1);
      }
    }
    function handleFocus() {
      refreshProfile();
    }
    window.addEventListener("profile:viewReceived", handleViewReceived);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("profile:viewReceived", handleViewReceived);
      window.removeEventListener("focus", handleFocus);
    };
  }, [role, user?.userId]);

  useEffect(() => {
    function handlePhotoUpdated(e) {
      setPhotoUrl(e.detail?.url || null);
    }
    function handleBannerUpdated(e) {
      setBannerUrl(e.detail?.url || null);
    }
    window.addEventListener("profile:photoUpdated", handlePhotoUpdated);
    window.addEventListener("profile:bannerUpdated", handleBannerUpdated);
    return () => {
      window.removeEventListener("profile:photoUpdated", handlePhotoUpdated);
      window.removeEventListener("profile:bannerUpdated", handleBannerUpdated);
    };
  }, []);

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
      height: "52px",
      backgroundColor: brand.blue,
      overflow: "hidden",
    },
    coverImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    body: {
      padding: "0 18px 18px",
    },
    avatarWrap: {
      display: "inline-block",
      marginTop: "-34px",
      borderRadius: "50%",
    },
    avatar: {
      width: "68px",
      height: "68px",
      borderRadius: "50%",
      backgroundColor: "#e8f3ff",
      border: "4px solid white",
      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: brand.blue,
      fontWeight: 800,
      fontSize: "22px",
      textDecoration: "none",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    name: {
      marginTop: "12px",
      fontWeight: 700,
      fontSize: "18px",
      color: brand.text,
      paddingLeft: "8px",
    },
    nameLink: {
      display: "inline-block",
      marginTop: "12px",
      fontWeight: 700,
      fontSize: "18px",
      color: brand.text,
      textDecoration: "none",
      cursor: "pointer",
      paddingLeft: "8px",
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
    navSection: {
      borderTop: `1px solid ${brand.border}`,
      marginTop: "14px",
      paddingTop: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    navLink: {
      display: "block",
      textDecoration: "none",
      color: brand.text,
      fontSize: "14px",
      fontWeight: 700,
      padding: "10px 12px",
      borderRadius: "10px",
      backgroundColor: "#f8fafc",
    },
  };

  const avatarContent = (
    <div style={styles.avatar}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} style={styles.avatarImage} />
      ) : (
        initials
      )}
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={styles.cover}>
        {bannerUrl && <img src={bannerUrl} alt="" style={styles.coverImg} />}
      </div>
      <div style={styles.body}>
        {role === "member" ? (
          <Link to={`/member/profile/${user?.userId}`} style={styles.avatarWrap}>
            {avatarContent}
          </Link>
        ) : (
          <div style={styles.avatarWrap}>{avatarContent}</div>
        )}

        {role === "member" ? (
          <Link to={`/member/profile/${user?.userId}`} style={styles.nameLink}>
            {name}
          </Link>
        ) : (
          <div style={styles.name}>{name}</div>
        )}

        <div style={styles.headline}>{headline}</div>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span>Profile viewers</span>
            <span style={styles.value}>{profileViews}</span>
          </div>
          <div style={styles.statRow}>
            {role === "member" ? (
              <Link
                to="/member/connections"
                style={{ color: "inherit", textDecoration: "none" }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >Connections</Link>
            ) : (
              <span>Connections</span>
            )}
            <span style={styles.value}>{connectionCount}</span>
          </div>
        </div>

        {role === "member" && (
          <div style={styles.navSection}>
            <Link to="/member/analytics" style={styles.navLink}>
              Analytics
            </Link>
            <Link to="/member/jobs/saved" style={styles.navLink}>
              Saved Jobs
            </Link>
          </div>
        )}

        {role === "recruiter" && (
          <div style={styles.navSection}>
            <Link to="/recruiter/analytics" style={styles.navLink}>
              Analytics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}