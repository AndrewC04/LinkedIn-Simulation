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

export default function Note() {
  const [data, setData] = useState({
    application_id: "",
    recruiter_id: "rec_001",
    note: ""
  });
  const [response, setResponse] = useState("");

  async function addNote() {
    const res = await fetch(`${API}/applications/addNote`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data),
    });
    setResponse(await res.text());
  }

  return (
    <PageShell title="Add Note" response={response}>
      <input placeholder="application_id" onChange={e => setData({...data, application_id: e.target.value})}/>
      <input placeholder="note" onChange={e => setData({...data, note: e.target.value})}/>
      <button onClick={addNote}>Add</button>
    </PageShell>
  );
}