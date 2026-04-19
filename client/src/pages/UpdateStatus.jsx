import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applicationUpdateStatus } from "../api/applicationApi";

export default function UpdateStatusPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("reviewing");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await applicationUpdateStatus(applicationId, status, reason);
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
          <h1 className="text-2xl font-bold text-slate-900">Update Status</h1>
          <p className="mt-2 text-sm text-slate-500">
            Change the current status of this application.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">New Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#0A66C2] focus:ring-4 focus:ring-[#0A66C2]/10"
              >
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#0A66C2] focus:ring-4 focus:ring-[#0A66C2]/10"
                placeholder="Optional recruiter rationale..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0A66C2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Status"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}