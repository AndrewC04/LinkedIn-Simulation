import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { searchMembers, getMemberProfile } from "../api/profileApi.js";
import { listPendingReceived } from "../api/connectionApi.js";
import { listThreads } from "../api/messagingApi.js";

const NAV_ICONS = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ),
  jobs: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.99 16.21 1 14 1c-1.3 0-2.43.63-3.17 1.59L10 4.1l-.83-1.51A3.985 3.985 0 0 0 6 1C3.79 1 2 2.99 2 4.7c0 .44.11.86.18 1.3H0v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-3c.83 0 1.5.74 1.5 1.7 0 .44-.18.86-.45 1.3H13V4.7C13 3.74 13.17 3 14 3zM8.95 5c-.27-.44-.45-.86-.45-1.3C8.5 2.74 9.17 2 10 2s1.5.74 1.5 1.7V6H9.4l-.45-1z"/>
    </svg>
  ),
  applications: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h3v1.5H8V10z"/>
    </svg>
  ),
  connections: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
  messages: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
    </svg>
  ),
  analytics: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2v-8h2v8zm4 0h-2v-3h2v3z"/>
    </svg>
  ),
  applicants: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
};

function pathToIcon(path) {
  if (path.includes("home"))        return NAV_ICONS.home;
  if (path.includes("connections")) return NAV_ICONS.connections;
  if (path.includes("messages"))    return NAV_ICONS.messages;
  if (path.includes("analytics"))   return NAV_ICONS.analytics;
  if (path.includes("applicants"))  return NAV_ICONS.applicants;
  if (path.includes("applications"))return NAV_ICONS.applications;
  if (path.includes("jobs"))        return NAV_ICONS.jobs;
  return null;
}

function MemberSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchMembers({ name: query.trim() }, 1, 8);
        setResults((res.results || []).filter((m) => m.member_id !== user?.userId));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(memberId) {
    setQuery("");
    setResults([]);
    setOpen(false);
    const base = user?.role === "recruiter" ? "/recruiter/profile" : "/member/profile";
    navigate(`${base}/${memberId}`);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "200px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f3f2ef",
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "6px 10px",
          gap: "6px",
        }}
      >
        <span style={{ color: "#777", fontSize: "14px" }}>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search members..."
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "14px",
            width: "100%",
            color: "#1d2226",
          }}
        />
        {loading && <span style={{ fontSize: "11px", color: "#999" }}>...</span>}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {results.map((m) => (
            <div
              key={m.member_id}
              onMouseDown={() => handleSelect(m.member_id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #f3f2ef",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f2ef";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#e8f3ff",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: brand.blue,
                  overflow: "hidden",
                }}
              >
                {m.profile_photo_url ? (
                  <img
                    src={m.profile_photo_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (m.full_name || "")
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0] || "")
                    .join("")
                    .toUpperCase()
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#1d2226",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.full_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#5e6a75",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.headline || "Looking for work"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 100,
            padding: "12px 14px",
            fontSize: "13px",
            color: "#5e6a75",
          }}
        >
          No members found
        </div>
      )}
    </div>
  );
}

export default function LinkedInNav({ userType }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [connectionBadgeCount, setConnectionBadgeCount] = useState(0);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0);
  const [navPhotoUrl, setNavPhotoUrl] = useState(null);

  const resolvedUserType = userType || user?.role || "member";

  const items =
    resolvedUserType === "member"
      ? [
          ["/member/home", "Home"],
          ["/member/jobs", "Jobs"],
          ["/member/applications", "My Applications"],
          ["/member/connections", "Connections"],
          ["/member/messages", "Messages"],
          ["/member/analytics", "Analytics"],
        ]
      : [
          ["/recruiter/home", "Home"],
          ["/recruiter/jobs", "Jobs"],
          ["/recruiter/applications", "Applicants"],
          ["/recruiter/messages", "Messages"],
          ["/recruiter/analytics", "Analytics"],
        ];

  const initials = (user?.displayName || user?.email || "U")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function refreshBadges() {
    if (!user?.userId) {
      setConnectionBadgeCount(0);
      setMessageBadgeCount(0);
      return;
    }

    try {
      const [pendingConnections, threads] = await Promise.all([
        listPendingReceived(user.userId, 100, 0),
        listThreads(user.userId, 100),
      ]);

      setConnectionBadgeCount(Array.isArray(pendingConnections) ? pendingConnections.length : 0);
      setMessageBadgeCount(
        Array.isArray(threads)
          ? threads.reduce((sum, thread) => sum + (thread.unread_count || 0), 0)
          : 0
      );
    } catch {
      setConnectionBadgeCount(0);
      setMessageBadgeCount(0);
    }
  }

  useEffect(() => {
    refreshBadges();
  }, [resolvedUserType, user?.userId]);

  useEffect(() => {
    if (resolvedUserType !== "member" || !user?.userId) return;
    getMemberProfile(user.userId)
      .then((p) => setNavPhotoUrl(p?.profile_photo_url || null))
      .catch(() => {});
  }, [resolvedUserType, user?.userId]);

  useEffect(() => {
    function handlePhotoUpdated(e) {
      setNavPhotoUrl(e.detail?.url || null);
    }
    window.addEventListener("profile:photoUpdated", handlePhotoUpdated);
    return () => window.removeEventListener("profile:photoUpdated", handlePhotoUpdated);
  }, []);

  useEffect(() => {
    function handleConnectionsUpdated() {
      refreshBadges();
    }

    function handleMessagingUpdated() {
      refreshBadges();
    }

    window.addEventListener("connections:updated", handleConnectionsUpdated);
    window.addEventListener("messaging:updated", handleMessagingUpdated);

    return () => {
      window.removeEventListener("connections:updated", handleConnectionsUpdated);
      window.removeEventListener("messaging:updated", handleMessagingUpdated);
    };
  }, [resolvedUserType, user?.userId]);

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
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    left: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0,
      marginLeft: "24px",
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
      textDecoration: "none",
      flexShrink: 0,
    },
    label: {
      color: "#555",
      fontSize: "14px",
      fontWeight: 700,
      textDecoration: "none",
    },
    tabs: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      flex: 1,
      justifyContent: "flex-end",
    },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0,
    },
    link: {
      textDecoration: "none",
      padding: "8px 14px",
      borderRadius: "12px",
      fontWeight: 600,
      color: "#4b5563",
      transition: "all 0.2s ease",
    },
    activeLink: {
      backgroundColor: "#e8f3ff",
      color: brand.blue,
    },
    linkContent: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "3px",
    },
    linkLabel: {
      fontSize: "12px",
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: "nowrap",
    },
    badge: {
      minWidth: "20px",
      height: "20px",
      borderRadius: "999px",
      padding: "0 6px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      fontWeight: 800,
      backgroundColor: brand.blue,
      color: "white",
      lineHeight: 1,
    },
    userPill: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: `1px solid ${brand.border}`,
      padding: "8px 12px",
      borderRadius: "999px",
      color: "#4b5563",
      fontWeight: 600,
      fontSize: "14px",
      backgroundColor: "white",
    },
    clickableUserPill: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: `1px solid ${brand.border}`,
      padding: "8px 12px",
      borderRadius: "999px",
      color: "#4b5563",
      fontWeight: 600,
      fontSize: "14px",
      backgroundColor: "white",
      textDecoration: "none",
      cursor: "pointer",
    },
    avatar: {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: "#e8f3ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: 700,
      color: brand.blue,
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
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

  const userContent = (
    <>
      <div style={styles.avatar}>
        {navPhotoUrl ? (
          <img
            src={navPhotoUrl}
            alt={user?.displayName || "User"}
            style={styles.avatarImage}
          />
        ) : (
          initials
        )}
      </div>
      <span>{user?.displayName || user?.email || "User"}</span>
    </>
  );

  return (
    <div style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <Link
            to={resolvedUserType === "member" ? "/member/home" : "/recruiter/home"}
            style={styles.brandBox}
          >
            in
          </Link>

          <Link
            to={resolvedUserType === "member" ? "/member/home" : "/recruiter/home"}
            style={styles.label}
          >
            LinkedIn
          </Link>

          <MemberSearch />
        </div>

        <div style={styles.tabs}>
          {items.map(([path, label]) => {
            const badgeValue =
              path === "/member/connections" || path === "/recruiter/connections"
                ? connectionBadgeCount
                : path === "/member/messages" || path === "/recruiter/messages"
                  ? messageBadgeCount
                  : 0;

            return (
              <NavLink
                key={path}
                to={path}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                })}
              >
                <span style={styles.linkContent}>
                  <span style={{ position: "relative", display: "inline-flex" }}>
                    {pathToIcon(path)}
                    {badgeValue > 0 && (
                      <span style={{ ...styles.badge, position: "absolute", top: "-6px", right: "-8px" }}>
                        {badgeValue}
                      </span>
                    )}
                  </span>
                  <span style={styles.linkLabel}>{label}</span>
                </span>
              </NavLink>
            );
          })}
        </div>

        <div style={styles.actions}>
          {resolvedUserType === "member" ? (
            <Link to={`/member/profile/${user?.userId}`} style={styles.clickableUserPill}>
              {userContent}
            </Link>
          ) : (
            <div style={styles.userPill}>{userContent}</div>
          )}

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}