import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  acceptConnectionRequest,
  listConnections,
  listPendingReceived,
  listPendingSent,
  rejectConnectionRequest,
  withdrawConnectionRequest,
} from "../api/connectionApi.js";
import { brand } from "../styles/theme.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberName(item) {
  return `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown member";
}

export default function MemberConnections() {
  const { user } = useAuth();
  const memberId = user?.userId || "";

  const [connections, setConnections] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionMap, setActionMap] = useState({});

  const totalConnections = useMemo(() => connections.length, [connections]);
  const totalPending = useMemo(
    () => pendingReceived.length + pendingSent.length,
    [pendingReceived.length, pendingSent.length]
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredConnections = useMemo(() => {
    if (!normalizedSearchQuery) return connections;

    return connections.filter((item) => {
      const name = memberName(item).toLowerCase();
      const meta = [item.headline, item.location].filter(Boolean).join(" ").toLowerCase();
      return name.includes(normalizedSearchQuery) || meta.includes(normalizedSearchQuery);
    });
  }, [connections, normalizedSearchQuery]);

  const filteredPendingReceived = useMemo(() => {
    if (!normalizedSearchQuery) return pendingReceived;

    return pendingReceived.filter((item) => {
      const name = memberName(item).toLowerCase();
      const meta = [item.headline, item.location].filter(Boolean).join(" ").toLowerCase();
      return name.includes(normalizedSearchQuery) || meta.includes(normalizedSearchQuery);
    });
  }, [pendingReceived, normalizedSearchQuery]);

  const filteredPendingSent = useMemo(() => {
    if (!normalizedSearchQuery) return pendingSent;

    return pendingSent.filter((item) => {
      const name = memberName(item).toLowerCase();
      const meta = [item.headline, item.location].filter(Boolean).join(" ").toLowerCase();
      return name.includes(normalizedSearchQuery) || meta.includes(normalizedSearchQuery);
    });
  }, [pendingSent, normalizedSearchQuery]);

  async function loadData() {
    if (!memberId) return;

    try {
      setLoading(true);
      setError("");

      const [accepted, received, sent] = await Promise.all([
        listConnections(memberId),
        listPendingReceived(memberId),
        listPendingSent(memberId),
      ]);

      setConnections(Array.isArray(accepted) ? accepted : []);
      setPendingReceived(Array.isArray(received) ? received : []);
      setPendingSent(Array.isArray(sent) ? sent : []);
    } catch (err) {
      setConnections([]);
      setPendingReceived([]);
      setPendingSent([]);
      setError(err?.message || "Failed to load connections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [memberId]);

  async function handleAccept(connectionId) {
    if (!connectionId || !memberId) return;

    const key = `${connectionId}:accept`;
    try {
      setActionMap((current) => ({ ...current, [key]: true }));
      setError("");
      await acceptConnectionRequest(connectionId, memberId);
      await loadData();
      setSuccess("Connection request accepted.");
      window.dispatchEvent(new Event("connections:updated"));
    } catch (err) {
      setError(err?.message || "Failed to accept request.");
    } finally {
      setActionMap((current) => ({ ...current, [key]: false }));
    }
  }

  async function handleReject(connectionId) {
    if (!connectionId || !memberId) return;

    const key = `${connectionId}:reject`;
    try {
      setActionMap((current) => ({ ...current, [key]: true }));
      setError("");
      await rejectConnectionRequest(connectionId, memberId);
      await loadData();
      setSuccess("Connection request rejected.");
      window.dispatchEvent(new Event("connections:updated"));
    } catch (err) {
      setError(err?.message || "Failed to reject request.");
    } finally {
      setActionMap((current) => ({ ...current, [key]: false }));
    }
  }

  async function handleWithdraw(connectionId) {
    if (!connectionId || !memberId) return;

    const key = `${connectionId}:withdraw`;
    try {
      setActionMap((current) => ({ ...current, [key]: true }));
      setError("");
      await withdrawConnectionRequest(connectionId, memberId);
      await loadData();
      setSuccess("Connection request withdrawn.");
      window.dispatchEvent(new Event("connections:updated"));
    } catch (err) {
      setError(err?.message || "Failed to withdraw request.");
    } finally {
      setActionMap((current) => ({ ...current, [key]: false }));
    }
  }

  function handleMessageConnection(item) {
    if (!item?.member_id) return;

    window.dispatchEvent(
      new CustomEvent("messaging:open", {
        detail: {
          targetMemberId: item.member_id,
          targetName: memberName(item),
        },
      })
    );
  }

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
      gridTemplateColumns: "260px 1fr",
      gap: "20px",
      alignItems: "start",
    },
    main: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    card: {
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    titleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "8px",
    },
    title: {
      margin: 0,
      fontSize: "28px",
      fontWeight: 800,
      color: brand.text,
    },
    subtitle: {
      margin: 0,
      color: brand.muted,
      fontSize: "14px",
      lineHeight: 1.5,
    },
    chipRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "12px",
    },
    searchBox: {
      marginTop: "14px",
      width: "100%",
      border: `1px solid ${brand.border}`,
      borderRadius: "12px",
      padding: "12px 14px",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "inherit",
      backgroundColor: "#ffffff",
    },
    chip: {
      backgroundColor: "#e8f3ff",
      color: brand.blue,
      borderRadius: "999px",
      padding: "7px 12px",
      fontSize: "12px",
      fontWeight: 800,
    },
    columns: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    },
    columnTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
      color: brand.text,
    },
    scrollPane: {
      marginTop: "12px",
      maxHeight: "420px",
      overflowY: "auto",
      border: `1px solid ${brand.border}`,
      borderRadius: "12px",
      padding: "8px",
      backgroundColor: "#fafafa",
    },
    listItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "white",
      border: `1px solid ${brand.border}`,
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "8px",
    },
    listItemText: {
      minWidth: 0,
    },
    nameLink: {
      color: brand.text,
      textDecoration: "none",
      fontSize: "15px",
      fontWeight: 700,
    },
    meta: {
      marginTop: "4px",
      color: brand.muted,
      fontSize: "12px",
      lineHeight: 1.4,
    },
    actionButton: {
      border: "none",
      borderRadius: "999px",
      backgroundColor: brand.blue,
      color: "white",
      fontWeight: 700,
      fontSize: "12px",
      padding: "9px 14px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    buttonRow: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    ghostButton: {
      border: `1px solid ${brand.border}`,
      borderRadius: "999px",
      backgroundColor: "white",
      color: "#374151",
      fontWeight: 700,
      fontSize: "12px",
      padding: "9px 14px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    emptyState: {
      color: brand.muted,
      fontSize: "14px",
      textAlign: "center",
      padding: "22px 10px",
    },
    secondaryTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
      color: brand.text,
    },
    sentPane: {
      marginTop: "10px",
      maxHeight: "220px",
      overflowY: "auto",
      border: `1px solid ${brand.border}`,
      borderRadius: "12px",
      padding: "8px",
      backgroundColor: "#fafafa",
    },
    errorBox: {
      border: "1px solid #fecaca",
      backgroundColor: "#fff1f2",
      color: "#b91c1c",
      padding: "10px 12px",
      borderRadius: "10px",
      fontSize: "13px",
    },
    successBox: {
      border: "1px solid #bbf7d0",
      backgroundColor: "#f0fdf4",
      color: "#166534",
      padding: "10px 12px",
      borderRadius: "10px",
      fontSize: "13px",
    },
  };

  return (
    <div style={styles.page}>
      <LinkedInNav />

      <div style={styles.layout}>
        <LeftProfileRail role={user?.role || "member"} />

        <main style={styles.main}>
          <section style={styles.card}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>My Connections</h1>
            </div>
            <p style={styles.subtitle}>
              Browse your network and manage incoming connection requests.
            </p>

            <input
              style={styles.searchBox}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search connections or requests by name, headline, or location"
            />

            <div style={styles.chipRow}>
              <span style={styles.chip}>{totalConnections} total connections</span>
              <span style={styles.chip}>{pendingReceived.length} requests to review</span>
              <span style={styles.chip}>{totalPending} total pending</span>
            </div>
          </section>

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          {success ? <div style={styles.successBox}>{success}</div> : null}

          <section style={styles.card}>
            <div style={styles.columns}>
              <div>
                <h2 style={styles.columnTitle}>All Connections</h2>
                <div style={styles.scrollPane}>
                  {!loading && filteredConnections.length === 0 ? (
                    <div style={styles.emptyState}>No accepted connections yet.</div>
                  ) : (
                    filteredConnections.map((item) => (
                      <div key={item.connection_id} style={styles.listItem}>
                        <div style={styles.listItemText}>
                          <Link to={`/member/profile/${item.member_id}`} style={styles.nameLink}>
                            {memberName(item)}
                          </Link>
                          <div style={styles.meta}>Connected on {formatDate(item.resolved_at)}</div>
                        </div>

                        <button
                          type="button"
                          style={styles.ghostButton}
                          onClick={() => handleMessageConnection(item)}
                        >
                          Message
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 style={styles.columnTitle}>Incoming Requests</h2>
                <div style={styles.scrollPane}>
                  {!loading && filteredPendingReceived.length === 0 ? (
                    <div style={styles.emptyState}>No incoming requests.</div>
                  ) : (
                    filteredPendingReceived.map((item) => {
                      const accepting = !!actionMap[`${item.connection_id}:accept`];
                      const rejecting = !!actionMap[`${item.connection_id}:reject`];
                      return (
                        <div key={item.connection_id} style={styles.listItem}>
                          <div style={styles.listItemText}>
                            <Link to={`/member/profile/${item.member_id}`} style={styles.nameLink}>
                              {memberName(item)}
                            </Link>
                            <div style={styles.meta}>Requested on {formatDate(item.requested_at)}</div>
                          </div>

                          <div style={styles.buttonRow}>
                            <button
                              type="button"
                              style={styles.actionButton}
                              disabled={accepting || rejecting}
                              onClick={() => handleAccept(item.connection_id)}
                            >
                              {accepting ? "Accepting..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              style={styles.ghostButton}
                              disabled={accepting || rejecting}
                              onClick={() => handleReject(item.connection_id)}
                            >
                              {rejecting ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.secondaryTitle}>Sent Requests</h2>
            <div style={styles.sentPane}>
              {!loading && filteredPendingSent.length === 0 ? (
                <div style={styles.emptyState}>No outgoing requests.</div>
              ) : (
                filteredPendingSent.map((item) => {
                  const withdrawing = !!actionMap[`${item.connection_id}:withdraw`];
                  return (
                    <div key={item.connection_id} style={styles.listItem}>
                      <div style={styles.listItemText}>
                        <Link to={`/member/profile/${item.member_id}`} style={styles.nameLink}>
                          {memberName(item)}
                        </Link>
                        <div style={styles.meta}>Sent on {formatDate(item.requested_at)}</div>
                      </div>

                      <button
                        type="button"
                        style={styles.ghostButton}
                        disabled={withdrawing}
                        onClick={() => handleWithdraw(item.connection_id)}
                      >
                        {withdrawing ? "Withdrawing..." : "Withdraw"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
