import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";

const TASK_TYPES = ["shortlist", "outreach_draft", "match_score"];

const taskColors = {
  shortlist:      { backgroundColor: "#EEF3FB", color: brand.blue },
  outreach_draft: { backgroundColor: "#fefce8", color: "#a16207" },
  match_score:    { backgroundColor: "#f5f3ff", color: "#7c3aed" },
  pending:        { backgroundColor: "#fefce8", color: "#a16207" },
  running:        { backgroundColor: "#eff6ff", color: "#1d4ed8" },
  completed:      { backgroundColor: "#f0fdf4", color: "#15803d" },
  approved:       { backgroundColor: "#f0fdf4", color: "#15803d" },
  rejected:       { backgroundColor: "#fef2f2", color: "#dc2626" },
  edited:         { backgroundColor: "#EEF3FB", color: brand.blue },
  failed:         { backgroundColor: "#fef2f2", color: "#dc2626" },
};

const WS_BASE = "ws://localhost:8006/ws";
const API_BASE = "http://localhost:8006";

export default function AIReview({ onNavigate }) {
  const navigate = useNavigate();
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [editContent, setEditContent] = useState("");
  const [filter, setFilter]           = useState("all");
  const [liveStatus, setLiveStatus]   = useState({}); // task_id → { status, steps_completed }

  // Track open WebSockets so we can clean them up
  const socketRefs = useRef({});

  const recruiter_id = "recruiter-001";

  const s = {
    page:        { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout:      { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
                   display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px" },
    centerCol:   { display: "flex", flexDirection: "column", gap: "16px" },
    card:        { backgroundColor: "white", border: `1px solid ${brand.border}`,
                   borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    title:       { fontSize: "20px", fontWeight: 800, color: brand.text, marginBottom: "6px" },
    label:       { fontSize: "13px", fontWeight: 600, color: brand.text, marginBottom: "6px", display: "block" },
    input:       { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`,
                   borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
    primaryBtn:  { backgroundColor: brand.blue, color: "white", border: "none",
                   borderRadius: "999px", padding: "8px 18px", fontWeight: 700,
                   cursor: "pointer", fontSize: "14px" },
    approveBtn:  { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0",
                   borderRadius: "999px", padding: "8px 16px", fontWeight: 700,
                   cursor: "pointer", fontSize: "13px" },
    rejectBtn:   { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
                   borderRadius: "999px", padding: "8px 16px", fontWeight: 700,
                   cursor: "pointer", fontSize: "13px" },
    editBtn:     { backgroundColor: "#EEF3FB", color: brand.blue, border: `1px solid #bfdbfe`,
                   borderRadius: "999px", padding: "8px 16px", fontWeight: 700,
                   cursor: "pointer", fontSize: "13px" },
    secondaryBtn:{ backgroundColor: "white", color: brand.text, border: `1px solid ${brand.border}`,
                   borderRadius: "999px", padding: "8px 18px", fontWeight: 600,
                   cursor: "pointer", fontSize: "14px" },
    badge:       { display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                   fontSize: "12px", fontWeight: 700 },
    toast:       { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600 },
    taskCard:    { border: `1px solid ${brand.border}`, borderRadius: "10px",
                   padding: "18px", marginBottom: "14px" },
    filterChip:  { padding: "6px 14px", borderRadius: "999px", fontSize: "13px",
                   fontWeight: 600, cursor: "pointer", border: `1px solid ${brand.border}` },
    liveBar:     { fontSize: "12px", color: "#1d4ed8", backgroundColor: "#eff6ff",
                   borderRadius: "6px", padding: "6px 10px", marginTop: "10px",
                   display: "flex", alignItems: "center", gap: "6px" },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3500);
  };

  // ── WebSocket connection for a single task ─────────────────────────────────
  const connectWebSocket = (task_id) => {
    // Don't open a duplicate socket
    if (socketRefs.current[task_id]) return;

    const ws = new WebSocket(`${WS_BASE}/task/${task_id}`);
    socketRefs.current[task_id] = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "task_update") {
        setLiveStatus(prev => ({
          ...prev,
          [task_id]: {
            status: data.status,
            steps_completed: data.steps_completed || [],
          }
        }));

        // If result arrived, update the task's ai_output too
        if (data.result) {
          setTasks(prev => prev.map(t =>
            t.task_id === task_id
              ? { ...t, status: data.status, ai_output: data.result?.outreach_draft || data.result?.summary || t.ai_output }
              : t
          ));
        }
      }

      if (data.event === "task_done") {
        setLiveStatus(prev => ({
          ...prev,
          [task_id]: { status: data.status, steps_completed: [] }
        }));
        if (data.result) {
          setTasks(prev => prev.map(t =>
            t.task_id === task_id
              ? { ...t, status: "pending", ai_output: data.result?.outreach_draft || data.result?.summary || t.ai_output }
              : t
          ));
        }
        // Close and clean up — task is terminal
        ws.close();
        delete socketRefs.current[task_id];
      }

      if (data.event === "error") {
        ws.close();
        delete socketRefs.current[task_id];
      }
    };

    ws.onerror = () => {
      delete socketRefs.current[task_id];
    };

    ws.onclose = () => {
      delete socketRefs.current[task_id];
    };
  };

  // ── Load tasks on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/ai/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recruiter_id })
        });
        const data = await res.json();
        const fetched = data.tasks || (Array.isArray(data) ? data : []);
        setTasks(fetched);

        // Open a WebSocket for every task that is still in-progress
        fetched.forEach(task => {
          if (["pending", "running", "submitted"].includes(task.status)) {
            connectWebSocket(task.task_id);
          }
        });
      } catch {
        setTasks([
          {
            task_id: "task-001", task_type: "shortlist", job_title: "Senior Software Engineer",
            status: "pending",
            ai_output: "Top 3 candidates shortlisted: Alice Chen (92%), Bob Kumar (88%), Carol Davis (84%).",
            created_at: new Date().toISOString(),
          },
          {
            task_id: "task-002", task_type: "outreach_draft", job_title: "Data Engineer",
            status: "pending",
            ai_output: "Hi Alice,\n\nI came across your profile and was impressed by your Python and distributed systems experience...\n\nBest,\nThe Recruiting Team",
            created_at: new Date().toISOString(),
          },
          {
            task_id: "task-003", task_type: "match_score", job_title: "ML Engineer",
            status: "approved",
            ai_output: "Match analysis complete. Score: 91/100. Key strengths: PyTorch, MLOps, system design.",
            created_at: new Date().toISOString(),
          },
        ]);
        notify("AI service offline — showing demo data.", "error");
      }
      setLoading(false);
    };
    load();

    // Cleanup all sockets on unmount
    return () => {
      Object.values(socketRefs.current).forEach(ws => ws.close());
      socketRefs.current = {};
    };
  }, []);

  // ── HITL Actions ───────────────────────────────────────────────────────────
  const handleApprove = async (task_id) => {
    try {
      await fetch(`${API_BASE}/ai/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id, recruiter_id, action: "approve" })
      });
    } catch { }
    setTasks(tasks.map(t => t.task_id === task_id ? { ...t, status: "approved" } : t));
    notify("Task approved!");
  };

  const handleReject = async (task_id) => {
    try {
      await fetch(`${API_BASE}/ai/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id, recruiter_id, action: "reject" })
      });
    } catch { }
    setTasks(tasks.map(t => t.task_id === task_id ? { ...t, status: "rejected" } : t));
    notify("Task rejected.");
  };

  const handleEditSave = async (task_id) => {
    try {
      await fetch(`${API_BASE}/ai/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id, recruiter_id, action: "edit", edited_output: editContent })
      });
    } catch { }
    setTasks(tasks.map(t =>
      t.task_id === task_id ? { ...t, status: "edited", ai_output: editContent } : t
    ));
    setEditingId(null);
    setEditContent("");
    notify("Edit saved and approved!");
  };

  const filteredTasks = filter === "all"
    ? tasks
    : tasks.filter(t => t.status === filter || t.task_type === filter);

  const pendingCount = tasks.filter(t => t.status === "pending").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="recruiter" />

        <div style={s.centerCol}>
          {message && (
            <div style={{
              ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          {/* Header */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={s.title}>AI Review Center</div>
                <div style={{ color: brand.muted, fontSize: "14px", marginTop: "4px" }}>
                  Review, approve, edit, or reject AI-generated outputs before they take effect
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {pendingCount > 0 && (
                  <span style={{ ...s.badge, backgroundColor: "#fefce8", color: "#a16207", fontSize: "13px", padding: "5px 12px" }}>
                    {pendingCount} pending review
                  </span>
                )}
                <button style={s.secondaryBtn} onClick={() => navigate("/recruiter/home")}>← Back</button>
              </div>
            </div>

            {/* Filter chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "pending", "approved", "rejected", ...TASK_TYPES].map(f => (
                <button
                  key={f}
                  style={{
                    ...s.filterChip,
                    backgroundColor: filter === f ? brand.blue : "white",
                    color: filter === f ? "white" : brand.text,
                    borderColor: filter === f ? brand.blue : brand.border,
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ ...s.card, color: brand.muted, fontSize: "14px" }}>Loading AI tasks...</div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <div style={{ ...s.card, textAlign: "center", color: brand.muted, fontSize: "14px", padding: "40px" }}>
              No tasks found for this filter.
            </div>
          )}

          {filteredTasks.map(task => {
            const live = liveStatus[task.task_id];
            const displayStatus = live?.status || task.status;
            const isLive = !!socketRefs.current[task.task_id];

            return (
              <div key={task.task_id} style={{
                ...s.taskCard,
                borderColor: isLive ? "#93c5fd" : brand.border,
                boxShadow: isLive ? "0 0 0 2px #dbeafe" : "none",
              }}>
                {/* Task header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: brand.text }}>
                      {task.job_title || "Untitled Job"}
                    </div>
                    <div style={{ fontSize: "12px", color: brand.muted, marginTop: "2px" }}>
                      Task ID: {task.task_id} · {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ ...s.badge, ...(taskColors[task.task_type] || {}) }}>
                      {task.task_type}
                    </span>
                    <span style={{ ...s.badge, ...(taskColors[displayStatus] || {}) }}>
                      {isLive && "🔴 "}{displayStatus}
                    </span>
                  </div>
                </div>

                {/* Live step progress */}
                {isLive && live?.steps_completed?.length > 0 && (
                  <div style={s.liveBar}>
                    <span>⚡ Live:</span>
                    {live.steps_completed.map((step, i) => (
                      <span key={i} style={{ backgroundColor: "#dbeafe", borderRadius: "4px", padding: "1px 6px" }}>
                        {step}
                      </span>
                    ))}
                  </div>
                )}

                {isLive && (!live?.steps_completed || live.steps_completed.length === 0) && (
                  <div style={s.liveBar}>
                    ⚡ Agent working...
                  </div>
                )}

                {/* AI Output */}
                {editingId === task.task_id ? (
                  <div style={{ marginTop: "10px" }}>
                    <label style={s.label}>Edit AI Output</label>
                    <textarea
                      style={{ ...s.input, minHeight: "120px", resize: "vertical", lineHeight: 1.6 }}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#F9F9F9", borderRadius: "8px", padding: "14px",
                    fontSize: "14px", color: brand.text, lineHeight: 1.7, whiteSpace: "pre-wrap",
                    border: `1px solid ${brand.border}`, marginTop: "10px" }}>
                    {task.ai_output}
                  </div>
                )}

                {/* Actions */}
                {task.status === "pending" && !isLive && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                    {editingId === task.task_id ? (
                      <>
                        <button style={s.approveBtn} onClick={() => handleEditSave(task.task_id)}>
                          ✓ Save & Approve Edit
                        </button>
                        <button style={s.secondaryBtn} onClick={() => { setEditingId(null); setEditContent(""); }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button style={s.approveBtn} onClick={() => handleApprove(task.task_id)}>✓ Approve</button>
                        <button style={s.editBtn} onClick={() => { setEditingId(task.task_id); setEditContent(task.ai_output); }}>✎ Edit & Approve</button>
                        <button style={s.rejectBtn} onClick={() => handleReject(task.task_id)}>✕ Reject</button>
                      </>
                    )}
                  </div>
                )}

                {task.status !== "pending" && (
                  <div style={{ marginTop: "12px", fontSize: "13px", color: brand.muted }}>
                    {task.status === "approved" && "✓ You approved this output."}
                    {task.status === "edited"   && "✎ You edited and approved this output."}
                    {task.status === "rejected" && "✕ You rejected this output."}
                    {task.status === "failed"   && "⚠ This task failed."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}