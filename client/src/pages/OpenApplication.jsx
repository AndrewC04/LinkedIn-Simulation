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

export default function OpenApplicationPage() {
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Open Application</h1>
          <p className="mt-2 text-sm text-slate-500">Review one candidate submission in detail.</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading application...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
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
              </div>
            </div>

            <div className="space-y-4">
              <Link
                to={`/recruiter/applications/update-status/${application.application_id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="text-lg font-semibold text-slate-900">Update Status</div>
                <div className="mt-1 text-sm text-slate-500">
                  Move candidate to reviewing, interview, offer, or rejected.
                </div>
              </Link>

              <Link
                to={`/recruiter/applications/add-note/${application.application_id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="text-lg font-semibold text-slate-900">Add Note</div>
                <div className="mt-1 text-sm text-slate-500">
                  Record hiring notes or interview feedback.
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}