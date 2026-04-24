import React, { useEffect, useMemo, useState } from "react";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getMemberProfile, searchMembers } from "../api/profileApi.js";
import {
  createThread,
  listThreads,
  listThreadMessages,
  markThreadRead,
  sendThreadMessage,
} from "../api/messagingApi.js";

export default function MemberMessages() {
  const { user } = useAuth();
  const memberId = user?.userId || "";

  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [threadProfiles, setThreadProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
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
      const participants = threadParticipantIds(thread);
      const label = participants.map(participantLabel).join(" ").toLowerCase();
      const preview = (thread.last_message_preview || "").toLowerCase();
      return label.includes(query) || preview.includes(query);
    });
  }, [threads, searchQuery, threadProfiles]);

  const unreadCount = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unread_count || 0), 0),
    [threads]
  );

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

  function threadParticipantIds(thread) {
    return (thread?.participant_ids || []).filter((participantId) => participantId !== memberId);
  }

  function participantLabel(participantId) {
    const profile = threadProfiles[participantId];
    if (profile?.full_name) return profile.full_name;
    return participantId ? `Member ${participantId.slice(0, 8)}` : "Unknown member";
  }

  function threadTitle(thread) {
    const participants = threadParticipantIds(thread);
    if (!participants.length) return "New conversation";
    return participants.map(participantLabel).join(", ");
  }

  async function hydrateProfiles(nextThreads) {
    const ids = Array.from(
      new Set(nextThreads.flatMap((thread) => threadParticipantIds(thread)))
    ).filter((participantId) => participantId && !threadProfiles[participantId]);

    if (!ids.length) return;

    const resolved = await Promise.all(
      ids.map(async (participantId) => {
        try {
          const profile = await getMemberProfile(participantId);
          return [participantId, profile];
        } catch {
          return [participantId, null];
        }
      })
    );

    setThreadProfiles((current) => {
      const next = { ...current };
      resolved.forEach(([participantId, profile]) => {
        if (profile) next[participantId] = profile;
      });
      return next;
    });
  }

  async function loadThreads() {
    if (!memberId) return;

    try {
      setLoadingThreads(true);
      setError("");
      const nextThreads = await listThreads(memberId);
      setThreads(nextThreads || []);
      await hydrateProfiles(nextThreads || []);

      if (!selectedThreadId && nextThreads?.length) {
        setSelectedThreadId(nextThreads[0].thread_id);
      }
    } catch (err) {
      setThreads([]);
      setError(err?.message || "Failed to load conversations");
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(threadId) {
    if (!threadId) return;

    try {
      setLoadingMessages(true);
      setError("");
      const nextMessages = await listThreadMessages(threadId);
      setMessages(nextMessages || []);
      await markThreadRead(threadId, memberId);
      setThreads((current) =>
        current.map((thread) =>
          thread.thread_id === threadId ? { ...thread, unread_count: 0 } : thread
        )
      );
    } catch (err) {
      setMessages([]);
      setError(err?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadThreads();
  }, [memberId]);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    } else {
      setMessages([]);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const result = await searchMembers({ name: query }, 1, 6);
        setSearchResults(
          (result?.results || []).filter((member) => member.member_id !== memberId)
        );
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  async function openConversationWithMember(targetMemberId) {
    const trimmedId = targetMemberId?.trim();
    if (!trimmedId || trimmedId === memberId) return;

    try {
      setError("");
      const existingThread = threads.find((thread) =>
        (thread.participant_ids || []).includes(trimmedId)
      );

      if (existingThread) {
        setSelectedThreadId(existingThread.thread_id);
      } else {
        const thread = await createThread([memberId, trimmedId]);
        await loadThreads();
        setSelectedThreadId(thread.thread_id);
      }

      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err?.message || "Failed to open conversation");
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedThreadId || !draft.trim() || sending) return;

    try {
      setSending(true);
      setError("");
      await sendThreadMessage(selectedThreadId, memberId, draft.trim());
      setDraft("");
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch (err) {
      setError(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f5f7fb 0%, #eef3f8 100%)",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#1d2226",
    },
    shell: {
      maxWidth: "1240px",
      margin: "0 auto",
      padding: "24px 16px 40px",
    },
    hero: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    title: {
      fontSize: "32px",
      fontWeight: 800,
      marginBottom: "8px",
    },
    subtitle: {
      color: "#5e6a75",
      lineHeight: 1.5,
      maxWidth: "760px",
    },
    stat: {
      background: "#ffffff",
      border: "1px solid #e0dfdc",
      borderRadius: "18px",
      padding: "14px 18px",
      minWidth: "180px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    },
    statLabel: {
      fontSize: "12px",
      color: "#5e6a75",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: "6px",
    },
    statValue: {
      fontSize: "28px",
      fontWeight: 800,
      color: "#0a66c2",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "320px minmax(0, 1fr)",
      gap: "18px",
      alignItems: "start",
    },
    panel: {
      background: "#ffffff",
      border: "1px solid #e0dfdc",
      borderRadius: "16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      overflow: "hidden",
    },
    panelHeader: {
      padding: "18px 18px 14px",
      borderBottom: "1px solid #eceae7",
    },
    panelTitle: {
      fontSize: "16px",
      fontWeight: 800,
      marginBottom: "8px",
    },
    panelCopy: {
      fontSize: "14px",
      color: "#5e6a75",
      lineHeight: 1.5,
    },
    searchBoxWrap: {
      padding: "10px 12px",
      background: "#fbfcfe",
      borderBottom: "1px solid #eceae7",
    },
    searchInput: {
      width: "100%",
      borderRadius: "10px",
      border: "1px solid #d7dee6",
      padding: "10px 12px",
      fontSize: "13px",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "inherit",
      background: "#fff",
    },
    searchResultsPane: {
      maxHeight: "200px",
      overflowY: "auto",
      borderBottom: "1px solid #eceae7",
      background: "#ffffff",
    },
    searchResultItem: {
      width: "100%",
      textAlign: "left",
      border: "none",
      borderBottom: "1px solid #f1efed",
      background: "transparent",
      padding: "12px 14px",
      cursor: "pointer",
    },
    composer: {
      padding: "18px",
      borderBottom: "1px solid #eceae7",
      background: "#fbfcfe",
    },
    field: {
      width: "100%",
      borderRadius: "14px",
      border: "1px solid #d9dee3",
      padding: "12px 14px",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "inherit",
      marginBottom: "10px",
      background: "#fff",
    },
    button: {
      border: "none",
      borderRadius: "999px",
      padding: "11px 16px",
      background: "#0a66c2",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    threadList: {
      maxHeight: "calc(100vh - 332px)",
      overflowY: "auto",
    },
    threadItem: {
      padding: "16px 18px",
      borderBottom: "1px solid #f1efed",
      cursor: "pointer",
      transition: "background 0.15s ease",
    },
    threadItemActive: {
      background: "#eef6ff",
    },
    threadRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      marginBottom: "6px",
    },
    threadName: {
      fontSize: "15px",
      fontWeight: 800,
      color: "#1d2226",
    },
    threadMeta: {
      fontSize: "12px",
      color: "#5e6a75",
    },
    preview: {
      fontSize: "13px",
      color: "#5e6a75",
      lineHeight: 1.5,
    },
    badge: {
      background: "#0a66c2",
      color: "#ffffff",
      borderRadius: "999px",
      minWidth: "24px",
      height: "24px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: 800,
      padding: "0 8px",
    },
    conversation: {
      display: "flex",
      flexDirection: "column",
      minHeight: "calc(100vh - 180px)",
    },
    conversationHeader: {
      padding: "18px",
      borderBottom: "1px solid #eceae7",
    },
    conversationName: {
      fontSize: "20px",
      fontWeight: 800,
      marginBottom: "6px",
    },
    conversationMeta: {
      color: "#5e6a75",
      fontSize: "14px",
    },
    messageStream: {
      flex: 1,
      padding: "18px",
      overflowY: "auto",
      background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    },
    messageRow: {
      display: "flex",
      marginBottom: "12px",
    },
    messageBubble: {
      maxWidth: "72%",
      padding: "12px 14px",
      borderRadius: "18px",
      lineHeight: 1.5,
      fontSize: "14px",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    composerBottom: {
      padding: "16px 18px 18px",
      borderTop: "1px solid #eceae7",
      background: "#ffffff",
    },
    messageInput: {
      width: "100%",
      minHeight: "96px",
      resize: "vertical",
      borderRadius: "16px",
      border: "1px solid #d9dee3",
      padding: "12px 14px",
      fontFamily: "inherit",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      marginBottom: "10px",
    },
    emptyState: {
      padding: "32px 18px",
      textAlign: "center",
      color: "#5e6a75",
      lineHeight: 1.6,
    },
    error: {
      marginBottom: "16px",
      padding: "12px 14px",
      borderRadius: "14px",
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
    searchResults: {
      marginTop: "10px",
      border: "1px solid #e0dfdc",
      borderRadius: "14px",
      overflow: "hidden",
      background: "#fff",
    },
    searchItem: {
      padding: "12px 14px",
      borderBottom: "1px solid #f1efed",
      cursor: "pointer",
    },
    searchName: {
      fontWeight: 700,
      color: "#1d2226",
      marginBottom: "4px",
    },
    searchMeta: {
      fontSize: "12px",
      color: "#5e6a75",
    },
  };

  return (
    <div style={styles.page}>
      <LinkedInNav userType="member" />

      <div style={styles.shell}>
        <div style={styles.hero}>
          <div>
            <div style={styles.title}>Conversations</div>
            <div style={styles.subtitle}>
              Follow up with recruiters, candidates, and connections from a single inbox backed by the messaging service.
            </div>
          </div>

          <div style={styles.stat}>
            <div style={styles.statLabel}>Unread messages</div>
            <div style={styles.statValue}>{unreadCount}</div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.grid}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Find people or conversations</div>
              <div style={styles.panelCopy}>
                Search by name to start a new thread or filter your existing inbox.
              </div>
            </div>

            <div style={styles.composer}>
              <input
                style={styles.field}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search members by name"
              />

              {searchQuery.trim() && (
                <div style={styles.searchResultsPane}>
                  {loadingSearch ? (
                    <div style={styles.searchResultItem}>Searching…</div>
                  ) : searchResults.length ? (
                    searchResults.map((result) => (
                      <button
                        key={result.member_id}
                        type="button"
                        style={styles.searchResultItem}
                        onClick={() => openConversationWithMember(result.member_id)}
                      >
                        <div style={styles.searchName}>{result.full_name}</div>
                        <div style={styles.searchMeta}>
                          {result.headline || "No headline"} · {result.location || "No location"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div style={styles.searchResultItem}>No matches found.</div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.threadList}>
              {loadingThreads ? (
                <div style={styles.emptyState}>Loading conversations…</div>
              ) : filteredThreads.length === 0 ? (
                <div style={styles.emptyState}>
                  No conversations yet. Start a message by searching for a member.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.thread_id === selectedThreadId;

                  return (
                    <div
                      key={thread.thread_id}
                      style={{
                        ...styles.threadItem,
                        ...(isActive ? styles.threadItemActive : {}),
                      }}
                      onClick={() => setSelectedThreadId(thread.thread_id)}
                    >
                      <div style={styles.threadRow}>
                        <div style={styles.threadName}>{threadTitle(thread)}</div>
                        {thread.unread_count > 0 && <div style={styles.badge}>{thread.unread_count}</div>}
                      </div>
                      <div style={styles.preview}>{thread.last_message_preview || "No messages yet"}</div>
                      <div style={styles.threadMeta}>
                        {formatTime(thread.last_message_at || thread.updated_at || thread.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.conversation}>
              <div style={styles.conversationHeader}>
                <div style={styles.conversationName}>
                  {selectedThread ? threadTitle(selectedThread) : "Select a conversation"}
                </div>
                <div style={styles.conversationMeta}>
                  {selectedThread
                    ? `${selectedThread.participant_ids?.length || 0} participants · ${formatTime(
                        selectedThread.last_message_at || selectedThread.updated_at || selectedThread.created_at
                      )}`
                    : "Choose a thread from the inbox to see the message history."}
                </div>
              </div>

              <div style={styles.messageStream}>
                {selectedThreadId && loadingMessages ? (
                  <div style={styles.emptyState}>Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyState}>
                    {selectedThread
                      ? "No messages in this thread yet. Send the first note below."
                      : "Pick a conversation on the left to review the thread."}
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === memberId;

                    return (
                      <div
                        key={message.message_id}
                        style={{
                          ...styles.messageRow,
                          justifyContent: isMine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...styles.messageBubble,
                            background: isMine ? "#0a66c2" : "#f3f6f9",
                            color: isMine ? "#ffffff" : "#1d2226",
                            borderTopRightRadius: isMine ? "6px" : "18px",
                            borderTopLeftRadius: isMine ? "18px" : "6px",
                          }}
                        >
                          <div style={{ fontSize: "12px", opacity: 0.78, marginBottom: "6px" }}>
                            {isMine ? "You" : participantLabel(message.sender_id)} · {formatTime(message.created_at)}
                          </div>
                          {message.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form style={styles.composerBottom} onSubmit={handleSendMessage}>
                <textarea
                  style={styles.messageInput}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={selectedThread ? "Write a message..." : "Select a conversation first"}
                  disabled={!selectedThreadId}
                />
                <button style={styles.button} type="submit" disabled={!selectedThreadId || sending}>
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <LinkedInNav userType="member" />
      <PlaceholderScreen
        title="Messages"
        description="Messaging UI is not wired yet in this integration branch."
        onBack={() => navigate("/member/home")}
      />
    </>
  );
}
