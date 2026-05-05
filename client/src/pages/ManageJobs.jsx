import React, { useState } from "react";
import { brand } from "../styles/theme.js";
import LinkedInNav from "../components/LinkedInNav.jsx";
import LeftProfileRail from "../components/LeftProfileRail.jsx";
import RightNewsRail from "../components/RightNewsRail.jsx";

const SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal", "director", "vp"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];

const emptyForm = {
  title: "", description: "", seniority_level: "mid",
  employment_type: "full-time", location: "", remote: "onsite",
  skills_required: "", salary_range: ""
};

export default function ManageJobs({ onNavigate }) {
  const [jobs, setJobs]           = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState(null);

  const recruiter_id = "recruiter-001"; // replace with auth context later

  const s = {
    page:      { minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" },
    layout:    { maxWidth: "1150px", margin: "0 auto", padding: "24px 16px",
                 display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" },
    centerCol: { display: "flex", flexDirection: "column", gap: "16px" },
    card:      { backgroundColor: "white", border: `1px solid ${brand.border}`,
                 borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    title:     { fontSize: "20px", fontWeight: 800, color: brand.text },
    primaryBtn:{ backgroundColor: brand.blue, color: "white", border: "none",
                 borderRadius: "999px", padding: "10px 20px", fontWeight: 700,
                 cursor: "pointer", fontSize: "14px" },
    secondaryBtn:{ backgroundColor: "white", color: brand.text,
                   border: `1px solid ${brand.border}`, borderRadius: "999px",
                   padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    dangerBtn: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
                 borderRadius: "999px", padding: "8px 16px", fontWeight: 600,
                 cursor: "pointer", fontSize: "14px" },
    input:     { width: "100%", padding: "10px 12px", border: `1px solid ${brand.border}`,
                 borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
    label:     { fontSize: "13px", fontWeight: 600, color: brand.text, marginBottom: "4px", display: "block" },
    grid2:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
    jobRow:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                 padding: "16px 0", borderBottom: `1px solid ${brand.border}` },
    badge:     { display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                 fontSize: "12px", fontWeight: 700 },
    toast:     { padding: "12px 16px", borderRadius: "8px", fontSize: "14px",
                 marginBottom: "12px", fontWeight: 600 },
  };

  const notify = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.title || !form.location) return notify("Title and location are required.", "error");
    setLoading(true);
    const payload = {
      ...form,
      recruiter_id,
      skills_required: form.skills_required.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        const res = await fetch(`http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com:8002/jobs/update`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: editingId, ...payload })
        });
        if (res.ok) {
          setJobs(jobs.map(j => j.job_id === editingId ? { ...j, ...payload } : j));
          notify("Job updated successfully!");
        }
      } else {
        const res = await fetch(`http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com:8002/jobs/create`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          setJobs([data, ...jobs]);
          notify("Job created successfully!");
        }
      }
    } catch {
      notify("Failed to connect to job service.", "error");
    }
    setLoading(false);
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (job) => {
    setForm({
      title: job.title, description: job.description,
      seniority_level: job.seniority_level, employment_type: job.employment_type,
      location: job.location, remote: job.remote,
      skills_required: (job.skills_required || []).join(", "),
      salary_range: job.salary_range || ""
    });
    setEditingId(job.job_id);
    setShowForm(true);
  };

  const handleClose = async (job_id) => {
    try {
      await fetch(`http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com:8002/jobs/close`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id })
      });
      setJobs(jobs.map(j => j.job_id === job_id ? { ...j, status: "closed" } : j));
      notify("Job closed.");
    } catch {
      notify("Failed to close job.", "error");
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://a646a4c5e82b9472997248fb7c128493-a29f34db7d83c969.elb.us-east-2.amazonaws.com:8002/jobs/byRecruiter`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiter_id })
      });
      const data = await res.json();
      setJobs(data.jobs || data);
    } catch {
      notify("Could not load jobs.", "error");
    }
    setLoading(false);
  };

  // Load jobs on mount
  React.useEffect(() => { loadJobs(); }, []);

  return (
    <div style={s.page}>
      <LinkedInNav userType="recruiter" onNavigate={onNavigate} />
      <div style={s.layout}>
        <LeftProfileRail role="recruiter" />

        <div style={s.centerCol}>
          {/* Toast */}
          {message && (
            <div style={{ ...s.toast,
              backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#dc2626" : "#15803d"
            }}>
              {message.msg}
            </div>
          )}

          {/* Header card */}
          <div style={s.card}>
            <div style={s.header}>
              <div>
                <div style={s.title}>Manage Job Postings</div>
                <div style={{ color: brand.muted, fontSize: "14px", marginTop: "4px" }}>
                  {jobs.length} posting{jobs.length !== 1 ? "s" : ""} found
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={s.secondaryBtn} onClick={() => onNavigate("recruiterHome")}>← Back</button>
                <button style={s.primaryBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>
                  {showForm ? "Cancel" : "+ Post a Job"}
                </button>
              </div>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
              <div style={{ borderTop: `1px solid ${brand.border}`, paddingTop: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "16px", color: brand.text }}>
                  {editingId ? "Edit Job Posting" : "New Job Posting"}
                </div>
                <div style={s.grid2}>
                  <div>
                    <label style={s.label}>Job Title *</label>
                    <input style={s.input} name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Software Engineer" />
                  </div>
                  <div>
                    <label style={s.label}>Location *</label>
                    <input style={s.input} name="location" value={form.location} onChange={handleChange} placeholder="e.g. San Francisco, CA" />
                  </div>
                  <div>
                    <label style={s.label}>Seniority Level</label>
                    <select style={s.input} name="seniority_level" value={form.seniority_level} onChange={handleChange}>
                      {SENIORITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Employment Type</label>
                    <select style={s.input} name="employment_type" value={form.employment_type} onChange={handleChange}>
                      {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Work Style</label>
                    <select style={s.input} name="remote" value={form.remote} onChange={handleChange}>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Salary Range (optional)</label>
                    <input style={s.input} name="salary_range" value={form.salary_range} onChange={handleChange} placeholder="e.g. $120k - $160k" />
                  </div>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <label style={s.label}>Required Skills (comma separated)</label>
                  <input style={s.input} name="skills_required" value={form.skills_required} onChange={handleChange} placeholder="e.g. python, react, kafka" />
                </div>
                <div style={{ marginTop: "14px" }}>
                  <label style={s.label}>Job Description</label>
                  <textarea style={{ ...s.input, minHeight: "100px", resize: "vertical" }}
                    name="description" value={form.description} onChange={handleChange}
                    placeholder="Describe the role, responsibilities, and requirements..." />
                </div>
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button style={s.primaryBtn} onClick={handleSubmit} disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update Job" : "Post Job"}
                  </button>
                  <button style={s.secondaryBtn} onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Jobs List */}
          <div style={s.card}>
            <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px", color: brand.text }}>Your Postings</div>
            {loading && <div style={{ color: brand.muted, fontSize: "14px", padding: "20px 0" }}>Loading...</div>}
            {!loading && jobs.length === 0 && (
              <div style={{ color: brand.muted, fontSize: "14px", padding: "20px 0", textAlign: "center" }}>
                No job postings yet. Click "+ Post a Job" to get started.
              </div>
            )}
            {jobs.map((job) => (
              <div key={job.job_id} style={s.jobRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: brand.text }}>{job.title}</div>
                  <div style={{ fontSize: "13px", color: brand.muted, marginTop: "2px" }}>
                    {job.location} · {job.seniority_level} · {job.employment_type} · {job.remote}
                  </div>
                  {job.skills_required?.length > 0 && (
                    <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {job.skills_required.slice(0, 5).map(skill => (
                        <span key={skill} style={{ ...s.badge, backgroundColor: "#EEF3FB", color: brand.blue }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "16px" }}>
                  <span style={{ ...s.badge,
                    backgroundColor: job.status === "open" ? "#f0fdf4" : "#f3f4f6",
                    color: job.status === "open" ? "#15803d" : brand.muted }}>
                    {job.status || "open"}
                  </span>
                  <button style={s.secondaryBtn} onClick={() => handleEdit(job)}>Edit</button>
                  {job.status !== "closed" && (
                    <button style={s.dangerBtn} onClick={() => handleClose(job.job_id)}>Close</button>
                  )}
                  <button style={s.secondaryBtn} onClick={() => onNavigate("applicants")}>View Applicants</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <RightNewsRail role="recruiter" />
      </div>
    </div>
  );
}