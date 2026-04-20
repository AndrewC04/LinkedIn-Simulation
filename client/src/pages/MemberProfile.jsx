import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getMemberProfile, updateMemberProfile, searchMembers,
  getExperience, addExperience, deleteExperience,
  getEducation, addEducation, deleteEducation,
} from "../api/profileApi.js";
import { applicationsByMember } from "../api/applicationApi.js";

/* ─── Design tokens (match existing pages) ─────────────────────── */
const C = {
  bg: "#f3f2ef",
  white: "#ffffff",
  blue: "#0a66c2",
  blueLight: "#e8f3ff",
  text: "#1d2226",
  muted: "#5e6a75",
  border: "#e0dfdc",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
  radius: "12px",
  font: "Arial, Helvetica, sans-serif",
};

/* ─── Status badge colours ──────────────────────────────────────── */
const STATUS_STYLE = {
  submitted: { bg: "#e8f3ff", color: "#0a66c2" },
  reviewing: { bg: "#fff7e6", color: "#b26b00" },
  interview: { bg: "#f3e8ff", color: "#7c3aed" },
  offer:     { bg: "#e8f7ee", color: "#15803d" },
  rejected:  { bg: "#fff1f2", color: "#be123c" },
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

function fmt(dateStr) {
  if (!dateStr) return "Present";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* ─── Small reusable pieces ─────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        boxShadow: C.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: "20px",
        fontWeight: 800,
        color: C.text,
        marginBottom: "18px",
        paddingBottom: "12px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = {
    border: "none",
    borderRadius: "999px",
    padding: "9px 20px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "opacity 0.15s",
    opacity: disabled ? 0.6 : 1,
    fontFamily: C.font,
    ...style,
  };
  const variants = {
    primary: { backgroundColor: C.blue, color: "#fff" },
    outline: { backgroundColor: "#fff", color: C.blue, border: `1.5px solid ${C.blue}` },
    ghost:   { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, multiline = false, placeholder = "" }) {
  const inputStyle = {
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: C.font,
    color: C.text,
    boxSizing: "border-box",
    outline: "none",
    resize: multiline ? "vertical" : "none",
    minHeight: multiline ? "100px" : "auto",
  };
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.muted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {multiline ? (
        <textarea style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, borderRadius: "999px", padding: "4px 10px", fontSize: "12px", fontWeight: 700, textTransform: "capitalize", display: "inline-block" }}>
      {status}
    </span>
  );
}

/* ─── Mini bar chart for app status ────────────────────────────── */
function StatusChart({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const statuses = ["submitted", "reviewing", "interview", "offer", "rejected"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {statuses.map((s) => {
        const pct = Math.round(((counts[s] || 0) / total) * 100);
        const col = STATUS_STYLE[s]?.color || C.muted;
        const bg  = STATUS_STYLE[s]?.bg || "#f3f4f6";
        return (
          <div key={s}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{s}</span>
              <span style={{ color: C.muted }}>{counts[s] || 0}</span>
            </div>
            <div style={{ height: "10px", borderRadius: "999px", backgroundColor: "#f0f0f0", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: col, borderRadius: "999px", transition: "width 0.5s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Recommended member card ───────────────────────────────────── */
function RecommendedCard({ member }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: C.blueLight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.blue, fontSize: "16px" }}>
        {initials(member.full_name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.full_name}</div>
        <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.headline || "Member"}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════════ */
export default function MemberProfile() {
  const { memberId: paramId } = useParams();
  const { user } = useAuth();

  const viewingId = paramId || user?.userId;
  const isOwnProfile = !paramId || paramId === user?.userId;

  const [profile, setProfile]       = useState(null);
  const [experience, setExperience] = useState([]);
  const [education, setEducation]   = useState([]);
  const [appCounts, setAppCounts]   = useState({});
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveErr, setSaveErr]       = useState(null);
  const [draft, setDraft]           = useState({});

  const [skillSearch, setSkillSearch] = useState("");

  // Experience add form
  const blankExp = { title: "", company_name: "", location: "", start_date: "", end_date: "", description: "" };
  const [showExpForm, setShowExpForm] = useState(false);
  const [expDraft, setExpDraft]       = useState(blankExp);
  const [expSaving, setExpSaving]     = useState(false);

  // Education add form
  const blankEdu = { school_name: "", degree: "", field_of_study: "", start_year: "", end_year: "" };
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduDraft, setEduDraft]       = useState(blankEdu);
  const [eduSaving, setEduSaving]     = useState(false);

  /* fetch all data */
  useEffect(() => {
    if (!viewingId) return;

    setLoading(true);
    setError(null);

    Promise.allSettled([
      getMemberProfile(viewingId),
      getExperience(viewingId),
      getEducation(viewingId),
      isOwnProfile ? applicationsByMember(viewingId, 1, 200) : Promise.resolve(null),
      searchMembers({}, 1, 8),
    ]).then(([profileRes, expRes, eduRes, appsRes, searchRes]) => {
      if (profileRes.status === "fulfilled") {
        const p = profileRes.value;
        setProfile(p);
        setDraft({
          headline: p.headline || "",
          location: p.location || "",
          summary:  p.summary  || "",
          skills:   (p.skills  || []).join(", "),
        });
      } else {
        setError("Profile not found or profile service is offline (port 8001).");
      }

      if (expRes.status === "fulfilled") setExperience(expRes.value.experience || []);
      if (eduRes.status === "fulfilled") setEducation(eduRes.value.education || []);

      if (appsRes.status === "fulfilled" && appsRes.value) {
        const apps = appsRes.value.applications || [];
        const counts = {};
        apps.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
        setAppCounts(counts);
      }

      if (searchRes.status === "fulfilled") {
        const all = searchRes.value.results || [];
        setRecommended(all.filter((m) => m.member_id !== viewingId).slice(0, 5));
      }

      setLoading(false);
    });
  }, [viewingId, isOwnProfile]);

  async function handleAddExperience() {
    if (!expDraft.title || !expDraft.company_name) return;
    setExpSaving(true);
    try {
      const res = await addExperience({ member_id: viewingId, ...expDraft });
      setExperience(res.experience || []);
      setShowExpForm(false);
      setExpDraft(blankExp);
    } finally {
      setExpSaving(false);
    }
  }

  async function handleDeleteExperience(id) {
    await deleteExperience(id);
    setExperience((prev) => prev.filter((e) => e.experience_id !== id));
  }

  async function handleAddEducation() {
    if (!eduDraft.school_name) return;
    setEduSaving(true);
    try {
      const res = await addEducation({
        member_id: viewingId,
        ...eduDraft,
        start_year: eduDraft.start_year ? Number(eduDraft.start_year) : null,
        end_year:   eduDraft.end_year   ? Number(eduDraft.end_year)   : null,
      });
      setEducation(res.education || []);
      setShowEduForm(false);
      setEduDraft(blankEdu);
    } finally {
      setEduSaving(false);
    }
  }

  async function handleDeleteEducation(id) {
    await deleteEducation(id);
    setEducation((prev) => prev.filter((e) => e.education_id !== id));
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const skillsArr = draft.skills.split(",").map((s) => s.trim()).filter(Boolean);
      await updateMemberProfile(viewingId, {
        headline: draft.headline,
        location: draft.location,
        summary:  draft.summary,
        skills:   skillsArr,
      });
      setProfile((p) => ({ ...p, headline: draft.headline, location: draft.location, summary: draft.summary, skills: skillsArr }));
      setEditing(false);
    } catch (e) {
      setSaveErr(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [draft, viewingId]);

  /* ── render states ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: C.font }}>
        <LinkedInNav userType="member" />
        <div style={{ textAlign: "center", padding: "80px 0", color: C.muted, fontSize: "16px" }}>
          Loading profile…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: C.font }}>
        <LinkedInNav userType="member" />
        <div style={{ maxWidth: "640px", margin: "60px auto", padding: "0 16px" }}>
          <Card style={{ padding: "40px", textAlign: "center", color: "#b91c1c" }}>
            {error || "Could not load profile."}
          </Card>
        </div>
      </div>
    );
  }

  const filteredSkills = (profile.skills || []).filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const totalApps = Object.values(appCounts).reduce((a, b) => a + b, 0);

  /* ── layout ── */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: C.font }}>
      <LinkedInNav userType="member" />

      <div style={{ maxWidth: "1128px", margin: "0 auto", padding: "24px 16px 48px", display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>

        {/* ─── LEFT COLUMN ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* ── Header card ── */}
          <Card>
            {/* Cover */}
            <div style={{ height: "128px", background: "linear-gradient(135deg, #0a66c2 0%, #0056a3 100%)", borderRadius: `${C.radius} ${C.radius} 0 0` }} />

            <div style={{ padding: "0 28px 28px", position: "relative" }}>
              {/* Avatar */}
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "4px solid white", marginTop: "-50px", backgroundColor: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: 800, color: C.blue, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", userSelect: "none" }}>
                {initials(profile.full_name)}
              </div>

              {/* Edit / Save buttons */}
              {isOwnProfile && (
                <div style={{ position: "absolute", top: "16px", right: "28px", display: "flex", gap: "8px" }}>
                  {editing ? (
                    <>
                      <Btn variant="ghost" onClick={() => { setEditing(false); setSaveErr(null); }}>Cancel</Btn>
                      <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
                    </>
                  ) : (
                    <Btn variant="outline" onClick={() => setEditing(true)}>Edit profile</Btn>
                  )}
                </div>
              )}

              {/* Name + headline + location */}
              <div style={{ marginTop: "14px" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: C.text }}>{profile.full_name}</div>

                {editing ? (
                  <div style={{ marginTop: "16px" }}>
                    {saveErr && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", color: "#b91c1c", fontSize: "13px", marginBottom: "12px" }}>{saveErr}</div>}
                    <Field label="Headline" value={draft.headline} onChange={(v) => setDraft((d) => ({ ...d, headline: v }))} placeholder="e.g. Software Engineer at Acme" />
                    <Field label="Location" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} placeholder="e.g. San Francisco, CA" />
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "16px", color: C.muted, marginTop: "4px" }}>{profile.headline || <span style={{ fontStyle: "italic" }}>No headline</span>}</div>
                    <div style={{ fontSize: "14px", color: C.muted, marginTop: "4px" }}>{profile.location || ""}</div>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "24px", marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: C.blue }}>{profile.connections ?? 0}</div>
                  <div style={{ fontSize: "13px", color: C.muted }}>Connections</div>
                </div>
                {isOwnProfile && totalApps > 0 && (
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: C.blue }}>{totalApps}</div>
                    <div style={{ fontSize: "13px", color: C.muted }}>Applications</div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── About ── */}
          <Card style={{ padding: "24px" }}>
            <SectionTitle>About</SectionTitle>
            {editing ? (
              <Field label="Summary" value={draft.summary} onChange={(v) => setDraft((d) => ({ ...d, summary: v }))} multiline placeholder="Tell your professional story…" />
            ) : (
              <div style={{ fontSize: "15px", color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {profile.summary || <span style={{ color: C.muted, fontStyle: "italic" }}>No summary added yet.</span>}
              </div>
            )}
          </Card>

          {/* ── Experience ── */}
          <Card style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Experience</div>
              {isOwnProfile && (
                <Btn variant="outline" onClick={() => setShowExpForm((v) => !v)} style={{ padding: "6px 14px", fontSize: "13px" }}>
                  {showExpForm ? "Cancel" : "+ Add"}
                </Btn>
              )}
            </div>

            {showExpForm && (
              <div style={{ backgroundColor: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label="Title *" value={expDraft.title} onChange={(v) => setExpDraft((d) => ({ ...d, title: v }))} placeholder="e.g. Software Engineer" />
                  <Field label="Company *" value={expDraft.company_name} onChange={(v) => setExpDraft((d) => ({ ...d, company_name: v }))} placeholder="e.g. Acme Corp" />
                  <Field label="Location" value={expDraft.location} onChange={(v) => setExpDraft((d) => ({ ...d, location: v }))} placeholder="e.g. San Francisco, CA" />
                  <div />
                  <Field label="Start Date" value={expDraft.start_date} onChange={(v) => setExpDraft((d) => ({ ...d, start_date: v }))} placeholder="YYYY-MM-DD" />
                  <Field label="End Date" value={expDraft.end_date} onChange={(v) => setExpDraft((d) => ({ ...d, end_date: v }))} placeholder="YYYY-MM-DD or leave blank" />
                </div>
                <Field label="Description" value={expDraft.description} onChange={(v) => setExpDraft((d) => ({ ...d, description: v }))} multiline placeholder="Describe your role…" />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Btn onClick={handleAddExperience} disabled={expSaving || !expDraft.title || !expDraft.company_name}>
                    {expSaving ? "Saving…" : "Save Experience"}
                  </Btn>
                </div>
              </div>
            )}

            {experience.length === 0 ? (
              <div style={{ color: C.muted, fontSize: "14px", fontStyle: "italic" }}>No experience entries yet.</div>
            ) : (
              experience.map((exp) => (
                <div key={exp.experience_id} style={{ display: "flex", gap: "14px", paddingBottom: "18px", marginBottom: "18px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "8px", backgroundColor: C.blueLight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: C.blue }}>
                    {exp.company_name?.[0] || "C"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: C.text }}>{exp.title}</div>
                    <div style={{ fontSize: "14px", color: C.muted, marginTop: "2px" }}>{exp.company_name}</div>
                    <div style={{ fontSize: "13px", color: C.muted, marginTop: "2px" }}>{fmt(exp.start_date)} – {fmt(exp.end_date)}{exp.location ? ` · ${exp.location}` : ""}</div>
                    {exp.description && <div style={{ fontSize: "14px", color: C.text, marginTop: "8px", lineHeight: 1.6 }}>{exp.description}</div>}
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => handleDeleteExperience(exp.experience_id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "18px", alignSelf: "flex-start", padding: "0 4px" }} title="Remove">×</button>
                  )}
                </div>
              ))
            )}
          </Card>

          {/* ── Education ── */}
          <Card style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Education</div>
              {isOwnProfile && (
                <Btn variant="outline" onClick={() => setShowEduForm((v) => !v)} style={{ padding: "6px 14px", fontSize: "13px" }}>
                  {showEduForm ? "Cancel" : "+ Add"}
                </Btn>
              )}
            </div>

            {showEduForm && (
              <div style={{ backgroundColor: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label="School *" value={eduDraft.school_name} onChange={(v) => setEduDraft((d) => ({ ...d, school_name: v }))} placeholder="e.g. UC Berkeley" />
                  <Field label="Degree" value={eduDraft.degree} onChange={(v) => setEduDraft((d) => ({ ...d, degree: v }))} placeholder="e.g. B.S." />
                  <Field label="Field of Study" value={eduDraft.field_of_study} onChange={(v) => setEduDraft((d) => ({ ...d, field_of_study: v }))} placeholder="e.g. Computer Science" />
                  <div />
                  <Field label="Start Year" value={eduDraft.start_year} onChange={(v) => setEduDraft((d) => ({ ...d, start_year: v }))} placeholder="e.g. 2018" />
                  <Field label="End Year" value={eduDraft.end_year} onChange={(v) => setEduDraft((d) => ({ ...d, end_year: v }))} placeholder="e.g. 2022" />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Btn onClick={handleAddEducation} disabled={eduSaving || !eduDraft.school_name}>
                    {eduSaving ? "Saving…" : "Save Education"}
                  </Btn>
                </div>
              </div>
            )}

            {education.length === 0 ? (
              <div style={{ color: C.muted, fontSize: "14px", fontStyle: "italic" }}>No education entries yet.</div>
            ) : (
              education.map((edu) => (
                <div key={edu.education_id} style={{ display: "flex", gap: "14px", paddingBottom: "18px", marginBottom: "18px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "8px", backgroundColor: "#fef3c7", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: C.text }}>{edu.school_name}</div>
                    <div style={{ fontSize: "14px", color: C.muted, marginTop: "2px" }}>{edu.degree}{edu.field_of_study ? ` · ${edu.field_of_study}` : ""}</div>
                    <div style={{ fontSize: "13px", color: C.muted, marginTop: "2px" }}>{edu.start_year || ""}{edu.end_year ? ` – ${edu.end_year}` : ""}</div>
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => handleDeleteEducation(edu.education_id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "18px", alignSelf: "flex-start", padding: "0 4px" }} title="Remove">×</button>
                  )}
                </div>
              ))
            )}
          </Card>

          {/* ── Skills ── */}
          <Card style={{ padding: "24px" }}>
            <SectionTitle>Skills</SectionTitle>

            {editing ? (
              <Field
                label="Skills (comma-separated)"
                value={draft.skills}
                onChange={(v) => setDraft((d) => ({ ...d, skills: v }))}
                placeholder="e.g. Python, React, SQL, Docker"
              />
            ) : (
              <>
                {(profile.skills || []).length > 6 && (
                  <input
                    placeholder="Search skills…"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "9px 12px", fontSize: "14px", fontFamily: C.font, boxSizing: "border-box", marginBottom: "16px", outline: "none" }}
                  />
                )}
                {filteredSkills.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: "14px", fontStyle: "italic" }}>No skills added yet.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {filteredSkills.map((s) => (
                      <span key={s} style={{ backgroundColor: C.blueLight, color: C.blue, borderRadius: "999px", padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: "default" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── Application dashboard (own profile only) ── */}
          {isOwnProfile && (
            <Card style={{ padding: "24px" }}>
              <SectionTitle>Application Dashboard</SectionTitle>
              {totalApps === 0 ? (
                <div style={{ color: C.muted, fontSize: "14px", fontStyle: "italic" }}>No applications yet. Start applying to jobs!</div>
              ) : (
                <>
                  <div style={{ fontSize: "14px", color: C.muted, marginBottom: "20px" }}>
                    {totalApps} total application{totalApps !== 1 ? "s" : ""} across all statuses
                  </div>
                  <StatusChart counts={appCounts} />

                  {/* Legend */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
                    {Object.entries(appCounts).map(([status, count]) => (
                      <span key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <StatusBadge status={status} />
                        <span style={{ fontSize: "13px", color: C.muted }}>{count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Quick stats */}
          <Card style={{ padding: "20px" }}>
            <div style={{ fontWeight: 800, fontSize: "16px", color: C.text, marginBottom: "14px" }}>Profile Overview</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                ["Connections", profile.connections ?? 0],
                ["Skills listed", (profile.skills || []).length],
                ...(isOwnProfile ? [["Applications", totalApps]] : []),
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: C.muted }}>{label}</span>
                  <span style={{ fontWeight: 700, color: C.text }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Not own profile: action buttons */}
          {!isOwnProfile && (
            <Card style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Btn style={{ width: "100%", textAlign: "center" }}>Connect</Btn>
                <Btn variant="outline" style={{ width: "100%", textAlign: "center" }}>Message</Btn>
              </div>
            </Card>
          )}

          {/* Recommended connections */}
          {recommended.length > 0 && (
            <Card style={{ padding: "20px" }}>
              <div style={{ fontWeight: 800, fontSize: "16px", color: C.text, marginBottom: "4px" }}>People you may know</div>
              <div style={{ fontSize: "13px", color: C.muted, marginBottom: "14px" }}>Based on your profile</div>
              {recommended.map((m) => (
                <RecommendedCard key={m.member_id} member={m} />
              ))}
            </Card>
          )}

          {/* Member since */}
          <Card style={{ padding: "20px" }}>
            <div style={{ fontWeight: 800, fontSize: "16px", color: C.text, marginBottom: "10px" }}>Member since</div>
            <div style={{ fontSize: "14px", color: C.muted }}>
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
