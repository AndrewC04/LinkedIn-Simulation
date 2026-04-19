import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applicationAddNote, session } from "../api/applicationApi";

export default function AddNotePage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim()) return;

    setSaving(true);
    try {
      await applicationAddNote(applicationId, session.recruiterId, note.trim());
      navigate(`/recruiter/applications/open/${applicationId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f2ef] p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Add Note</h1>
          <p className="mt-2 text-sm text-slate-500">
            Save recruiter notes, rationale, or interview feedback for this application.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Recruiter Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#0A66C2] focus:ring-4 focus:ring-[#0A66C2]/10"
                placeholder="Write a note about the candidate..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-[#0A66C2] px-5 py-2.5 text-sm font-semibold text-[#0A66C2] hover:bg-[#E8F3FF] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Note"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}