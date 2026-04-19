import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applicationGet } from "../api/applicationApi";

function StatusBadge({ status }) {
  const styles = {
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    reviewing: "bg-amber-50 text-amber-700 border-amber-200",
    interview: "bg-violet-50 text-violet-700 border-violet-200",
    offer: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {status}
    </span>
  );
}

export default function ViewApplicationDetailsPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await applicationGet(applicationId);
        setApplication(data);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-[#f3f2ef] p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">View Application Details</h1>
            <p className="mt-2 text-sm text-slate-500">
              Open one application and review files and status.
            </p>
          </div>
          <Link
            to="/member/applications/view"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading application...</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Application ID</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {application.application_id}
                  </div>
                </div>
                <StatusBadge status={application.status} />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="text-sm text-slate-500">Job ID</div>
                  <div className="mt-1 font-medium text-slate-900">{application.job_id}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Member ID</div>
                  <div className="mt-1 font-medium text-slate-900">{application.member_id}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Submitted</div>
                  <div className="mt-1 text-slate-900">
                    {new Date(application.submitted_at).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Resume</div>
                  <a
                    href={`http://localhost:8000${application.resume_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-semibold text-[#0A66C2] hover:underline"
                  >
                    Open Resume
                  </a>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Cover Letter</div>
                  {application.cover_letter ? (
                    <a
                      href={`http://localhost:8000${application.cover_letter}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block font-semibold text-[#0A66C2] hover:underline"
                    >
                      Open Cover Letter
                    </a>
                  ) : (
                    <div className="mt-1 text-slate-500">Not provided</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              {!application.notes || application.notes.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No notes available.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {application.notes.map((note) => (
                    <div key={note.note_id} className="rounded-xl bg-slate-50 p-4">
                      <div className="text-sm font-medium text-slate-800">{note.note}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        {note.recruiter_id} • {new Date(note.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}