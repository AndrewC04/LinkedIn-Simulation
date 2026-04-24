import React, { useEffect, useMemo, useState } from "react";

import { getMemberProfile, searchMembers } from "../api/profileApi.js";
import {
  createThread,
  listThreadMessages,
  listThreads,
  markThreadRead,
  sendThreadMessage,
} from "../api/messagingApi.js";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function findOtherParticipant(thread, currentMemberId) {
  return (thread?.participant_ids || []).find((id) => id !== currentMemberId) || "";
}

function findThreadForTarget(threads, currentMemberId, targetMemberId) {
  return (threads || []).find((thread) => {
    const participants = thread?.participant_ids || [];
    return participants.includes(currentMemberId) && participants.includes(targetMemberId);
  });
}

export default function MessagingWidget({ currentMemberId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [profilesById, setProfilesById] = useState({});
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.thread_id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter((thread) => {
      const targetId = findOtherParticipant(thread, currentMemberId);
      const profile = profilesById[targetId];
      const title = profile?.full_name?.toLowerCase() || "";
      const preview = (thread.last_message_preview || "").toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [threads, profilesById, searchQuery, currentMemberId]);

  function threadTitle(thread) {
    const targetId = findOtherParticipant(thread, currentMemberId);
    const profile = profilesById[targetId];
    return profile?.full_name || `Member ${targetId.slice(0, 8)}`;
  }

  async function hydrateProfiles(nextThreads) {
    const ids = Array.from(
      new Set(nextThreads.map((thread) => findOtherParticipant(thread, currentMemberId)))
    ).filter((id) => id && !profilesById[id]);

    if (!ids.length) return;

    const resolved = await Promise.all(
      ids.map(async (id) => {
        try {
          const profile = await getMemberProfile(id);
          return [id, profile];
        } catch {
          return [id, null];
        }
      })
    );

    setProfilesById((current) => {
      const next = { ...current };
      resolved.forEach(([id, profile]) => {
        if (profile) next[id] = profile;
      });
      return next;
    });
  }

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await searchMembers({ name: query }, 1, 8);
        setSearchResults(
          (res?.results || []).filter((member) => member.member_id !== currentMemberId)
        );
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, currentMemberId]);

  async function loadThreads(preferredThreadId = "") {
    if (!currentMemberId) return [];

    try {
      setLoadingThreads(true);
      setError("");

      const nextThreads = await listThreads(currentMemberId, 100);
      const safeThreads = Array.isArray(nextThreads) ? nextThreads : [];
      setThreads(safeThreads);
      await hydrateProfiles(safeThreads);

      if (preferredThreadId) {
        setSelectedThreadId(preferredThreadId);
      } else if (!selectedThreadId && safeThreads.length) {
        setSelectedThreadId(safeThreads[0].thread_id);
      } else if (
        selectedThreadId &&
        !safeThreads.some((thread) => thread.thread_id === selectedThreadId)
      ) {
        setSelectedThreadId(safeThreads[0]?.thread_id || "");
      }

      window.dispatchEvent(new Event("messaging:updated"));

      return safeThreads;
    } catch (err) {
      setThreads([]);
      setSelectedThreadId("");
      setMessages([]);
      setError(err?.message || "Failed to load conversations.");
      return [];
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(threadId) {
    if (!threadId || !currentMemberId) return;

    try {
      setLoadingMessages(true);
      setError("");

      const nextMessages = await listThreadMessages(threadId, 100);
      setMessages(nextMessages || []);
      await markThreadRead(threadId, currentMemberId);

      setThreads((current) =>
        current.map((thread) =>
          thread.thread_id === threadId ? { ...thread, unread_count: 0 } : thread
        )
      );
      window.dispatchEvent(new Event("messaging:updated"));
    } catch (err) {
      setMessages([]);
      setError(err?.message || "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function openThreadWithTarget(targetMemberId) {
    if (!targetMemberId || !currentMemberId || targetMemberId === currentMemberId) return;

    setIsOpen(true);
    const currentThreads = await loadThreads();
    let thread = findThreadForTarget(currentThreads, currentMemberId, targetMemberId);

    if (!thread) {
      try {
        thread = await createThread([currentMemberId, targetMemberId]);
      } catch (err) {
        setError(err?.message || "Failed to open conversation.");
        return;
      }
      await loadThreads(thread.thread_id);
    } else {
      setSelectedThreadId(thread.thread_id);
    }

    setSearchQuery("");
    setSearchResults([]);
  }

  useEffect(() => {
    if (isOpen) {
      loadThreads();
    }
  }, [isOpen, currentMemberId]);

  useEffect(() => {
    if (!isOpen || !selectedThreadId) return;
    loadMessages(selectedThreadId);
  }, [isOpen, selectedThreadId, currentMemberId]);

  useEffect(() => {
    if (!isOpen || !currentMemberId) return;
    const poll = window.setInterval(() => {
      loadThreads();
      if (selectedThreadId) loadMessages(selectedThreadId);
    }, 6000);

    return () => window.clearInterval(poll);
  }, [isOpen, currentMemberId, selectedThreadId]);

  useEffect(() => {
    function handleOpenEvent(event) {
      const targetMemberId = event?.detail?.targetMemberId;
      openThreadWithTarget(targetMemberId);
    }

    window.addEventListener("messaging:open", handleOpenEvent);
    return () => window.removeEventListener("messaging:open", handleOpenEvent);
  }, [currentMemberId, selectedThreadId]);

  async function handleSend(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || !selectedThreadId || !currentMemberId || sending) return;

    try {
      setSending(true);
      setError("");
      await sendThreadMessage(selectedThreadId, currentMemberId, text);
      setDraft("");
      await loadMessages(selectedThreadId);
      await loadThreads(selectedThreadId);
      window.dispatchEvent(new Event("messaging:updated"));
    } catch (err) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  const styles = {
    launcher: {
      position: "fixed",
      right: "22px",
      bottom: "22px",
      zIndex: 1200,
      border: "none",
      borderRadius: "999px",
      padding: "12px 18px",
      backgroundColor: "#0a66c2",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 8px 20px rgba(10, 102, 194, 0.3)",
    },
    popup: {
      position: "fixed",
      right: "22px",
      bottom: "22px",
      width: "760px",
      maxWidth: "calc(100vw - 24px)",
      height: "560px",
      maxHeight: "calc(100vh - 24px)",
      zIndex: 1200,
      border: "1px solid #d7dee6",
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    header: {
      padding: "12px 14px",
      borderBottom: "1px solid #eceff3",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      backgroundColor: "#f8fbff",
    },
    title: {
      fontSize: "15px",
      fontWeight: 800,
      color: "#1d2226",
      margin: 0,
    },
    closeButton: {
      border: "1px solid #d7dee6",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      padding: "4px 10px",
      cursor: "pointer",
      color: "#4b5563",
      fontWeight: 700,
    },
    content: {
      display: "grid",
      gridTemplateColumns: "260px minmax(0, 1fr)",
      minHeight: 0,
      flex: 1,
    },
    threadListPane: {
      borderRight: "1px solid #eceff3",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    },
    searchBoxWrap: {
      padding: "10px 12px",
      borderBottom: "1px solid #eceff3",
      backgroundColor: "#ffffff",
    },
    searchInput: {
      width: "100%",
      border: "1px solid #d7dee6",
      borderRadius: "10px",
      padding: "9px 10px",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "inherit",
      fontSize: "13px",
    },
    searchResultsPane: {
      maxHeight: "180px",
      overflowY: "auto",
      borderBottom: "1px solid #eceff3",
      backgroundColor: "#fbfdff",
    },
    searchResultItem: {
      width: "100%",
      textAlign: "left",
      border: "none",
      borderBottom: "1px solid #f2f4f7",
      backgroundColor: "transparent",
      padding: "10px 12px",
      cursor: "pointer",
    },
    threadListHeader: {
      padding: "10px 12px",
      fontSize: "13px",
      color: "#5e6a75",
      borderBottom: "1px solid #eceff3",
    },
    threadList: {
      overflowY: "auto",
      flex: 1,
    },
    threadItem: {
      padding: "10px 12px",
      borderBottom: "1px solid #f2f4f7",
      cursor: "pointer",
    },
    threadActive: {
      backgroundColor: "#eef6ff",
    },
    threadName: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#1d2226",
      marginBottom: "4px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    threadPreview: {
      fontSize: "12px",
      color: "#5e6a75",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    threadMeta: {
      marginTop: "4px",
      fontSize: "11px",
      color: "#6b7280",
    },
    chatPane: {
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    },
    chatHeader: {
      borderBottom: "1px solid #eceff3",
      padding: "10px 12px",
      fontSize: "14px",
      fontWeight: 800,
      color: "#1d2226",
    },
    body: {
      flex: 1,
      overflowY: "auto",
      padding: "12px",
      backgroundColor: "#ffffff",
    },
    row: {
      display: "flex",
      marginBottom: "8px",
    },
    bubble: {
      maxWidth: "78%",
      borderRadius: "14px",
      padding: "10px 12px",
      fontSize: "13px",
      lineHeight: 1.45,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    incoming: {
      backgroundColor: "#f2f5f9",
      color: "#1d2226",
      borderBottomLeftRadius: "6px",
    },
    outgoing: {
      marginLeft: "auto",
      backgroundColor: "#0a66c2",
      color: "#ffffff",
      borderBottomRightRadius: "6px",
    },
    stamp: {
      marginTop: "5px",
      fontSize: "11px",
      opacity: 0.75,
      textAlign: "right",
    },
    footer: {
      borderTop: "1px solid #eceff3",
      padding: "10px",
      backgroundColor: "#ffffff",
    },
    input: {
      width: "100%",
      minHeight: "70px",
      resize: "none",
      border: "1px solid #d7dee6",
      borderRadius: "10px",
      padding: "10px",
      boxSizing: "border-box",
      fontSize: "13px",
      fontFamily: "inherit",
      outline: "none",
    },
    actions: {
      marginTop: "8px",
      display: "flex",
      justifyContent: "flex-end",
    },
    sendButton: {
      border: "none",
      borderRadius: "999px",
      backgroundColor: "#0a66c2",
      color: "#ffffff",
      fontWeight: 800,
      fontSize: "12px",
      padding: "8px 14px",
      cursor: "pointer",
    },
    helper: {
      color: "#5e6a75",
      fontSize: "13px",
      lineHeight: 1.55,
      textAlign: "center",
      padding: "20px 8px",
    },
    error: {
      color: "#b91c1c",
      backgroundColor: "#fff1f2",
      border: "1px solid #fecaca",
      fontSize: "12px",
      borderRadius: "8px",
      padding: "8px 10px",
      marginBottom: "8px",
    },
  };

  if (!currentMemberId) return null;

  if (!isOpen) {
    return (
      <button type="button" style={styles.launcher} onClick={() => setIsOpen(true)}>
        Open messages
      </button>
    );
  }

  return (
    <div style={styles.popup}>
      <div style={styles.header}>
        <h3 style={styles.title}>Messages</h3>
        <button type="button" style={styles.closeButton} onClick={() => setIsOpen(false)}>
          Close
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.threadListPane}>
          <div style={styles.threadListHeader}>Find people or conversations</div>
          <div style={styles.searchBoxWrap}>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name..."
              style={styles.searchInput}
            />
          </div>

          {searchQuery.trim() ? (
            <div style={styles.searchResultsPane}>
              {loadingSearch ? (
                <div style={styles.helper}>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((member) => (
                  <button
                    key={member.member_id}
                    type="button"
                    style={styles.searchResultItem}
                    onClick={() => openThreadWithTarget(member.member_id)}
                  >
                    <div style={styles.threadName}>{member.full_name}</div>
                    <div style={styles.threadPreview}>{member.headline || "No headline"}</div>
                    <div style={styles.threadMeta}>{member.location || "No location"}</div>
                  </button>
                ))
              ) : (
                <div style={styles.helper}>No matches found.</div>
              )}
            </div>
          ) : null}

          <div style={styles.threadListHeader}>Conversations</div>
          <div style={styles.threadList}>
            {loadingThreads ? (
              <div style={styles.helper}>Loading...</div>
            ) : filteredThreads.length === 0 ? (
              <div style={styles.helper}>No conversations yet.</div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.thread_id}
                  style={{
                    ...styles.threadItem,
                    ...(thread.thread_id === selectedThreadId ? styles.threadActive : {}),
                  }}
                  onClick={() => setSelectedThreadId(thread.thread_id)}
                >
                  <div style={styles.threadName}>{threadTitle(thread)}</div>
                  <div style={styles.threadPreview}>
                    {thread.last_message_preview || "No messages yet"}
                  </div>
                  <div style={styles.threadMeta}>{formatTime(thread.last_message_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.chatPane}>
          <div style={styles.chatHeader}>
            {selectedThread ? threadTitle(selectedThread) : "Select a conversation"}
          </div>

          <div style={styles.body}>
            {error ? <div style={styles.error}>{error}</div> : null}

            {!selectedThread ? (
              <div style={styles.helper}>Choose a conversation from the left.</div>
            ) : loadingMessages ? (
              <div style={styles.helper}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={styles.helper}>No messages yet. Send the first one.</div>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === currentMemberId;
                return (
                  <div key={message.message_id} style={styles.row}>
                    <div style={{ ...styles.bubble, ...(mine ? styles.outgoing : styles.incoming) }}>
                      <div>{message.text}</div>
                      <div style={styles.stamp}>{formatTime(message.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form style={styles.footer} onSubmit={handleSend}>
            <textarea
              style={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedThread ? "Write a message..." : "Select a conversation"}
              disabled={!selectedThread || sending || loadingMessages}
            />
            <div style={styles.actions}>
              <button
                type="submit"
                style={styles.sendButton}
                disabled={!selectedThread || sending || loadingMessages || !draft.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
