import React, { useMemo, useState } from "react";

const defaultForm = {
  recruiter_id: "",
  company_id: "",
  company_name: "",
  title: "",
  description: "",
  seniority_level: "",
  employment_type: "",
  location: "",
  work_mode: "",
  industry: "",
  skills_required: "",
  salary_min: "",
  salary_max: "",
  currency: "",
};

export default function JobForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save Job",
  includeOwnerFields = true,
  showCompanyName = true,
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
      currency: initialValues?.salary_range?.currency ?? initialValues.currency ?? "",
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
      company_name: form.company_name.trim(),
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
            <input type="hidden" name="recruiter_id" value={form.recruiter_id} readOnly />
            <input type="hidden" name="company_id" value={form.company_id} readOnly />
          </>
        )}

        {showCompanyName && (
          <input
            name="company_name"
            placeholder="Company Name"
            value={form.company_name}
            onChange={handleChange}
            required
          />
        )}

        <input
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <select name="seniority_level" value={form.seniority_level} onChange={handleChange} required>
          <option value="">Seniority Level</option>
          <option value="Intern">Intern</option>
          <option value="Entry Level">Entry Level</option>
          <option value="Associate">Associate</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
          <option value="Manager">Manager</option>
          <option value="Director">Director</option>
        </select>

        <select name="employment_type" value={form.employment_type} onChange={handleChange} required>
          <option value="">Employment Type</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Temporary">Temporary</option>
        </select>

        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />

        <select name="work_mode" value={form.work_mode} onChange={handleChange} required>
          <option value="">Work Mode</option>
          <option value="remote">remote</option>
          <option value="hybrid">hybrid</option>
          <option value="onsite">onsite</option>
        </select>

        <select name="industry" value={form.industry} onChange={handleChange} required>
          <option value="">Industry</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Retail">Retail</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Media">Media</option>
          <option value="Consulting">Consulting</option>
          <option value="Government">Government</option>
          <option value="Other">Other</option>
        </select>

        <input
          name="skills_required"
          placeholder="Skills, comma separated"
          value={form.skills_required}
          onChange={handleChange}
          required
        />

        <input
          name="salary_min"
          type="number"
          placeholder="Salary Min"
          value={form.salary_min}
          onChange={handleChange}
          required
        />

        <input
          name="salary_max"
          type="number"
          placeholder="Salary Max"
          value={form.salary_max}
          onChange={handleChange}
          required
        />

        <input
          name="currency"
          placeholder="Currency"
          value={form.currency}
          onChange={handleChange}
          required
        />
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