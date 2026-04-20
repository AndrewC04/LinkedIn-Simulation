import React, { useMemo, useState } from "react";

const defaultForm = {
  recruiter_id: "",
  company_id: "",
  title: "",
  description: "",
  seniority_level: "",
  employment_type: "",
  location: "",
  work_mode: "hybrid",
  industry: "",
  skills_required: "",
  salary_min: "",
  salary_max: "",
  currency: "USD",
};

export default function JobForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save Job",
  includeOwnerFields = true,
  loading = false,
}) {
  const mergedInitial = useMemo(
    () => ({
      ...defaultForm,
      ...initialValues,
      skills_required: Array.isArray(initialValues.skills_required)
        ? initialValues.skills_required.join(", ")
        : initialValues.skills_required || "",
      salary_min: initialValues?.salary_range?.min ?? initialValues.salary_min ?? "",
      salary_max: initialValues?.salary_range?.max ?? initialValues.salary_max ?? "",
      currency: initialValues?.salary_range?.currency ?? initialValues.currency ?? "USD",
    }),
    [initialValues]
  );

  const [form, setForm] = useState(mergedInitial);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      ...(includeOwnerFields && {
        recruiter_id: form.recruiter_id.trim(),
        company_id: form.company_id.trim(),
      }),
      title: form.title.trim(),
      description: form.description.trim(),
      seniority_level: form.seniority_level.trim(),
      employment_type: form.employment_type.trim(),
      location: form.location.trim(),
      work_mode: form.work_mode.trim(),
      industry: form.industry.trim(),
      skills_required: form.skills_required
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      salary_range: {
        min: Number(form.salary_min),
        max: Number(form.salary_max),
        currency: form.currency || "USD",
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: "1px solid #d9dee3",
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {includeOwnerFields && (
          <>
            <input name="recruiter_id" placeholder="Recruiter ID" value={form.recruiter_id} onChange={handleChange} required />
            <input name="company_id" placeholder="Company ID" value={form.company_id} onChange={handleChange} required />
          </>
        )}

        <input name="title" placeholder="Job Title" value={form.title} onChange={handleChange} required />
        <input name="seniority_level" placeholder="Seniority Level" value={form.seniority_level} onChange={handleChange} required />
        <input name="employment_type" placeholder="Employment Type" value={form.employment_type} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />

        <select name="work_mode" value={form.work_mode} onChange={handleChange}>
          <option value="remote">remote</option>
          <option value="hybrid">hybrid</option>
          <option value="onsite">onsite</option>
        </select>

        <input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} required />
        <input name="skills_required" placeholder="Skills, comma separated" value={form.skills_required} onChange={handleChange} required />
        <input name="salary_min" type="number" placeholder="Salary Min" value={form.salary_min} onChange={handleChange} required />
        <input name="salary_max" type="number" placeholder="Salary Max" value={form.salary_max} onChange={handleChange} required />
        <input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} />
      </div>

      <textarea
        name="description"
        placeholder="Job Description"
        value={form.description}
        onChange={handleChange}
        required
        rows={8}
        style={{ width: "100%", marginTop: "12px" }}
      />

      <button type="submit" disabled={loading} style={{ marginTop: "14px" }}>
        {loading ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
}