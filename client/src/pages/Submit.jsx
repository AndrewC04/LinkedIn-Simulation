import React, { useState } from "react";
import PageShell from "../components/PageShell";

const API = "http://localhost:8005";

const fieldStyles = {
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cfd8e3",
    marginBottom: "16px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    backgroundColor: "#0a66c2",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default function Submit() {
  const [response, setResponse] = useState("");
  const [jobId, setJobId] = useState("job_001");
  const [memberId, setMemberId] = useState("mem_001");
  const [idempotencyKey, setIdempotencyKey] = useState(crypto.randomUUID());
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);

  async function submit() {
    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("member_id", memberId);
    formData.append("idempotency_key", idempotencyKey);

    if (resumeFile) {
      formData.append("resume_file", resumeFile);
    }

    if (coverLetterFile) {
      formData.append("cover_letter_file", coverLetterFile);
    }

    const res = await fetch(`${API}/applications/submit`, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    setResponse(text);
  }

  return (
    <PageShell title="Submit Application" response={response}>
      <label style={fieldStyles.label}>Job ID</label>
      <input
        style={fieldStyles.input}
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
      />

      <label style={fieldStyles.label}>Member ID</label>
      <input
        style={fieldStyles.input}
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
      />

      <label style={fieldStyles.label}>Resume File</label>
      <input
        style={fieldStyles.input}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
      />

      <label style={fieldStyles.label}>Cover Letter File</label>
      <input
        style={fieldStyles.input}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
      />

      <label style={fieldStyles.label}>Idempotency Key</label>
      <input
        style={fieldStyles.input}
        value={idempotencyKey}
        onChange={(e) => setIdempotencyKey(e.target.value)}
      />

      <button style={fieldStyles.button} onClick={submit}>
        Submit Application
      </button>
    </PageShell>
  );
}