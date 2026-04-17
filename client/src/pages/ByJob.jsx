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
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cfd8e3",
    marginBottom: "16px",
    fontSize: "14px",
    minHeight: "110px",
    boxSizing: "border-box",
    resize: "vertical",
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

export default function ByJob() {
  const [job, setJob] = useState("job_001");
  const [response, setResponse] = useState("");

  async function fetchData() {
    const res = await fetch(`${API}/applications/byJob`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ job_id: job, page: 1, page_size: 10 }),
    });
    setResponse(await res.text());
  }

  return (
    <PageShell title="By Job" response={response}>
      <input value={job} onChange={e => setJob(e.target.value)} />
      <button onClick={fetchData}>Fetch</button>
    </PageShell>
  );
}