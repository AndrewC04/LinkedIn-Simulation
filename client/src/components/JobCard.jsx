import React from "react";

const COMPANY_NAMES_KEY = "companyNames";

function formatSalary(salaryRange) {
  if (!salaryRange?.min && !salaryRange?.max) return "Salary not listed";

  const currency = salaryRange?.currency || "USD";
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (salaryRange?.min && salaryRange?.max) {
    return `${fmt.format(salaryRange.min)} - ${fmt.format(salaryRange.max)}`;
  }

  if (salaryRange?.min) return `From ${fmt.format(salaryRange.min)}`;
  return `Up to ${fmt.format(salaryRange.max)}`;
}

function getCompanyDisplay(job) {
  const companyNames = JSON.parse(localStorage.getItem(COMPANY_NAMES_KEY) || "{}");

  return (
    job.company_name ||
    companyNames[job.job_id] ||
    "Company not listed"
  );
}

export default function JobCard({
  job,
  onView,
  onEdit,
  onClose,
  onToggleSave,
  onApply,
  isSaved = false,
  showRecruiterActions = false,
}) {
  const companyDisplay = getCompanyDisplay(job);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9dee3",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
        marginBottom: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "20px", color: "#1d2226" }}>{job.title}</h3>

          <div style={{ marginTop: "8px", color: "#5e6a75", fontSize: "14px" }}>
            {companyDisplay} · {job.location}
          </div>

          <div style={{ marginTop: "8px", fontSize: "14px", color: "#334155" }}>
            {job.employment_type} · {job.work_mode} · {job.seniority_level}
          </div>

          <div style={{ marginTop: "8px", fontSize: "14px", color: "#334155" }}>
            {formatSalary(job.salary_range)}
          </div>

          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {(job.skills_required || []).map((skill) => (
              <span
                key={skill}
                style={{
                  background: "#e8f3ff",
                  color: "#0a66c2",
                  border: "1px solid #cfe5ff",
                  borderRadius: "999px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {skill}
              </span>
            ))}
          </div>

          <div style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
            Status: <b>{job.status}</b> · Views: {job.views_count ?? 0} · Applicants: {job.applicants_count ?? 0}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "150px" }}>
          <button onClick={() => onView?.(job.job_id)}>View Details</button>

          {!showRecruiterActions && (
            <>
              <button onClick={() => onApply?.(job.job_id)}>Apply</button>
              <button onClick={() => onToggleSave?.(job)}>
                {isSaved ? "Unsave Job" : "Save Job"}
              </button>
            </>
          )}

          {showRecruiterActions && (
            <>
              <button onClick={() => onEdit?.(job.job_id)}>Edit Job</button>
              {job.status !== "closed" && (
                <button onClick={() => onClose?.(job)}>Close Job</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}