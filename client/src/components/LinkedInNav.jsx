import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { brand } from "../styles/theme.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { searchMembers } from "../api/profileApi.js";

function MemberSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();
  const containerRef          = useRef(null);
  const timerRef              = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchMembers({ name: query.trim() }, 1, 8);
        setResults(res.results || []);
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
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(memberId) {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/member/profile/${memberId}`);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "240px" }}>
      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f3f2ef", border: "1px solid #ddd", borderRadius: "6px", padding: "6px 10px", gap: "6px" }}>
        <span style={{ color: "#777", fontSize: "14px" }}>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search members…"
          style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", width: "100%", color: "#1d2226" }}
        />
        {loading && <span style={{ fontSize: "11px", color: "#999" }}>…</span>}
      </div>

      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
          {results.map((m) => (
            <div
              key={m.member_id}
              onMouseDown={() => handleSelect(m.member_id)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f2ef" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f2ef"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e8f3ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: brand.blue, overflow: "hidden" }}>
                {m.profile_photo_url
                  ? <img src={m.profile_photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (m.full_name || "").split(" ").slice(0, 2).map((w) => w[0] || "").join("")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1d2226", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.full_name}</div>
                <div style={{ fontSize: "12px", color: "#5e6a75", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.headline || "Looking for work"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, padding: "12px 14px", fontSize: "13px", color: "#5e6a75" }}>
          No members found
        </div>
      )}
    </div>
  );
}

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
          ["/member/analytics", "Analytics"],
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
          {resolvedUserType === "member" && <MemberSearch />}
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
