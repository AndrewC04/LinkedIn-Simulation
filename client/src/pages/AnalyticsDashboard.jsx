import React, { useEffect, useState } from "react";
import LinkedInNav from "../components/LinkedInNav.jsx";
import { getTopJobs, getFunnel, getGeo, getMemberDashboard } from "../api/analyticsApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

const brand = {
  blue: "#0a66c2",
  bg: "#f3f2ef",
  border: "#d9dee3",
  text: "#191919",
  muted: "#666",
};

const card = {
  backgroundColor: "white",
  border: `1px solid ${brand.border}`,
  borderRadius: "16px",
  padding: "22px",
  marginBottom: "20px",
};

export default function AnalyticsDashboard({ onNavigate }) {
  const { user } = useAuth();
  const memberId = user?.userId || "mem_001";

  const [topJobs, setTopJobs] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [geo, setGeo] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [metric, setMetric] = useState("applications");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [topRes, memberRes] = await Promise.all([
          getTopJobs(metric, 30, 10),
          getMemberDashboard(memberId),
        ]);
        setTopJobs(topRes?.data || []);
        setMemberStats(memberRes?.data || null);

        // Load funnel + geo for first job if available
        if (topRes?.data?.length > 0) {
          const firstJobId = topRes.data[0].job_id;
          const [funnelRes, geoRes] = await Promise.all([
            getFunnel(firstJobId, 30),
            getGeo(firstJobId, 30),
          ]);
          setFunnel(funnelRes?.data || null);
          setGeo(geoRes?.data || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [metric, memberId]);

  const maxCount = topJobs.length > 0 ? Math.max(...topJobs.map((j) => j.count)) : 1;
  const funnelSteps = funnel ? ["viewed", "saved", "applied", "submitted"] : [];
  const funnelMax = funnel ? Math.max(...funnelSteps.map((s) => funnel[s] || 0), 1) : 1;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: brand.bg, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <LinkedInNav userType={user?.role || "member"} onNavigate={onNavigate} onLogout={() => onNavigate("auth")} />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: brand.text, marginBottom: "4px" }}>
          Analytics Dashboard
        </h1>
        <p style={{ color: brand.muted, marginBottom: "24px", fontSize: "14px" }}>
          Live data from Kafka event pipeline
        </p>

        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            {error} — make sure the analytics service is running on port 8005.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: brand.muted }}>Loading analytics...</div>
        ) : (
          <>
            {/* ── Top Jobs Bar Chart ── */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Top Jobs</h2>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  style={{ border: `1px solid ${brand.border}`, borderRadius: "8px", padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="applications">By Applications</option>
                  <option value="views">By Views</option>
                  <option value="saves">By Saves</option>
                </select>
              </div>
              {topJobs.length === 0 ? (
                <p style={{ color: brand.muted }}>No data yet.</p>
              ) : (
                topJobs.map((job, i) => (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span style={{ color: brand.text, fontWeight: 600 }}>{job.job_id}</span>
                      <span style={{ color: brand.muted }}>{job.count}</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "10px" }}>
                      <div style={{
                        background: brand.blue,
                        borderRadius: "999px",
                        height: "10px",
                        width: `${(job.count / maxCount) * 100}%`,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Funnel Chart ── */}
            {funnel && (
              <div style={card}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
                  Application Funnel — {funnel.job_id}
                </h2>
                {funnelSteps.map((step, i) => (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{step}</span>
                      <span style={{ color: brand.muted }}>{funnel[step] || 0}</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "10px" }}>
                      <div style={{
                        background: ["#0a66c2", "#0891b2", "#059669", "#7c3aed"][i],
                        borderRadius: "999px",
                        height: "10px",
                        width: `${((funnel[step] || 0) / funnelMax) * 100}%`,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Geo Distribution ── */}
            {geo.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
                  Applicant City Distribution
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                  {geo.slice(0, 10).map((item, i) => (
                    <div key={i} style={{
                      background: "#f0f7ff",
                      borderRadius: "10px",
                      padding: "12px",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: brand.blue }}>{item.count}</div>
                      <div style={{ fontSize: "12px", color: brand.muted }}>{item.city || "Unknown"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Member Dashboard ── */}
            {memberStats && (
              <div style={card}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
                  My Activity
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "#f0f7ff", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: brand.blue }}>
                      {memberStats.profile_views_last_30_days || 0}
                    </div>
                    <div style={{ fontSize: "13px", color: brand.muted }}>Profile Views (30 days)</div>
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Application Status</div>
                    {Object.entries(memberStats.application_status_breakdown || {}).length === 0 ? (
                      <p style={{ color: brand.muted, fontSize: "13px" }}>No applications yet.</p>
                    ) : (
                      Object.entries(memberStats.application_status_breakdown).map(([status, count]) => (
                        <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                          <span style={{ textTransform: "capitalize" }}>{status}</span>
                          <span style={{ fontWeight: 700 }}>{count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}