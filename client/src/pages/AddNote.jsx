import React, { useState } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

export default function AddNote({ onNavigate }) {
  const [applicationId, setApplicationId] = useState("");
  const [note, setNote]                   = useState("");
  const [notes, setNotes]                 = useState([]);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState(null);

  const recruiter_id = "recruiter-001"; // replace with auth context later

  const s = {
    page:      { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout:    { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
                 display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card:      { backgroundColor: "white", border: `1px solid ${brand.border}`,
                 borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    title:     { fontSize: "20px", fontWeight: 800, color: brand.text, marginBottom: "6px" },
    label:     { fontSize: "13px", fontWeight: 600, color: brand.text, marginBottom: "6px", display: "block" },
    input:     { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`,
                 borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
    primaryBtn:{ backgroundColor: brand.blue, color: "white", border: "none",
                 borderRadius: "999px", padding: "10px 24px", fontWeight: 700,
                 cursor: "pointer", fontSize: "14px" },
    secondaryBtn: { backgroundColor: "white", color: brand.text,
                    border: `1px solid ${brand.border}`, borderRadius: "999px",
                    padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    toast:     { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600 },
    noteCard:  { backgroundColor: "#F9F9F9", border: `1px solid ${brand.border}`,
                 borderRadius: "10px", padding: "14px 16px", marginTop: "12px" },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSubmit = async () => {
    if (!applicationId.trim()) return notify("Please enter an application ID.", "error");
    if (!note.trim()) return notify("Note cannot be empty.", "error");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8005/applications/addNote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId.trim(),
          recruiter_id,
          note: note.trim()
        })
      });
      if (res.ok) {
        const newNote = {
          id: Date.now(),
          application_id: applicationId.trim(),
          note: note.trim(),
          created_at: new Date().toISOString(),
        };
        setNotes([newNote, ...notes]);
        notify("Note saved successfully!");
        setNote("");
        setApplicationId("");
      } else {
        notify("Failed to save note.", "error");
      }
    } catch {
      notify("Could not connect to application service.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="recruiter" />

        <div style={s.centerCol}>
          {message && (
            <div style={{ ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={s.title}>Add Recruiter Note</div>
                <div style={{ color: brand.muted, fontSize: "14px" }}>
                  Capture internal decision rationale for an application
                </div>
              </div>
              <button style={s.secondaryBtn} onClick={() => onNavigate("recruiterHome")}>← Back</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={s.label}>Application ID *</label>
                <input
                  style={s.input}
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="e.g. app-abc123"
                />
                <div style={{ fontSize: "12px", color: brand.muted, marginTop: "4px" }}>
                  Find this on the Applicants page next to each candidate.
                </div>
              </div>

              <div>
                <label style={s.label}>Note *</label>
                <textarea
                  style={{ ...s.input, minHeight: "120px", resize: "vertical", lineHeight: 1.6 }}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Strong Python background, good culture fit. Schedule technical interview."
                />
                <div style={{ fontSize: "12px", color: brand.muted, marginTop: "4px" }}>
                  {note.length} / 1000 characters
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button style={s.primaryBtn} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Save Note"}
                </button>
                <button style={s.secondaryBtn} onClick={() => onNavigate("applicants")}>
                  Back to Applicants
                </button>
              </div>
            </div>
          </div>

          {/* Notes logged this session */}
          {notes.length > 0 && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: brand.text, marginBottom: "4px" }}>
                Notes added this session
              </div>
              <div style={{ color: brand.muted, fontSize: "13px", marginBottom: "8px" }}>
                These are saved to the backend — this is just a local confirmation view.
              </div>
              {notes.map(n => (
                <div key={n.id} style={s.noteCard}>
                  <div style={{ fontSize: "12px", color: brand.muted, marginBottom: "6px" }}>
                    Application: <strong>{n.application_id}</strong> · {new Date(n.created_at).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: "14px", color: brand.text, lineHeight: 1.6 }}>{n.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RightNewsRail role="recruiter" />
      </div>
    </div>
  );
}