import React from "react";

export default function JobFilters({ filters, onChange, onSearch, onClear }) {
  const handleChange = (e) => {
    onChange({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9dee3",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
        marginBottom: "18px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Search Filters</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <input name="keyword" placeholder="Keyword" value={filters.keyword || ""} onChange={handleChange} />
        <input name="location" placeholder="Location" value={filters.location || ""} onChange={handleChange} />

        <select name="employment_type" value={filters.employment_type || ""} onChange={handleChange}>
          <option value="">Employment Type</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>

        <input name="industry" placeholder="Industry" value={filters.industry || ""} onChange={handleChange} />

        <select name="work_mode" value={filters.work_mode || ""} onChange={handleChange}>
          <option value="">Work Mode</option>
          <option value="remote">remote</option>
          <option value="hybrid">hybrid</option>
          <option value="onsite">onsite</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
        <button onClick={onSearch}>Search Jobs</button>
        <button onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}