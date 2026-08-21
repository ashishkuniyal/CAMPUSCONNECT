import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/api";
import {
  Users, Calendar, Activity, Shield, BanIcon,
  Megaphone, TrendingUp, RefreshCw, Clock, CheckCircle
} from "lucide-react";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/auth/stats", { headers: getAuthHeaders() });
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <AdminLoadingSkeleton />;

  const kpis = [
    { label: "Total Users",     value: stats?.totalUsers ?? 0,         icon: Users,     color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { label: "Total Events",    value: stats?.totalEvents ?? 0,        icon: Calendar,  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    { label: "Total Attendees", value: stats?.totalAttendees ?? 0,     icon: Activity,  color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "Active (30d)",    value: stats?.activeUsers ?? 0,        icon: TrendingUp,color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { label: "Suspended",       value: stats?.suspendedUsers ?? 0,     icon: BanIcon,   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "Pending Events",  value: stats?.pendingEvents ?? 0,      icon: Clock,     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="ah-header">
        <div>
          <h1 className="ah-title">Admin Dashboard</h1>
          <p className="ah-subtitle">
            Platform overview · {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
        </div>
        <button onClick={fetchStats} className="ah-refresh-btn">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="ah-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="ah-kpi-card" style={{ "--kpi-color": kpi.color, "--kpi-bg": kpi.bg }}>
              <div className="ah-kpi-icon-wrap">
                <Icon size={20} color={kpi.color} />
              </div>
              <div className="ah-kpi-value">{kpi.value.toLocaleString()}</div>
              <div className="ah-kpi-label">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="ah-charts-row">
        {/* Registration Trend */}
        <div className="ah-chart-card">
          <h3 className="ah-chart-title">
            <TrendingUp size={16} color="#6366f1" /> User Registrations (Last 30 Days)
          </h3>
          <LineChart data={stats?.registrationTrend || []} color="#6366f1" />
        </div>

        {/* Events by Category */}
        <div className="ah-chart-card">
          <h3 className="ah-chart-title">
            <Calendar size={16} color="#8b5cf6" /> Events by Category
          </h3>
          <BarChart data={stats?.eventsByCategory || []} color="#8b5cf6" />
        </div>
      </div>

      {/* User Role Breakdown */}
      <div className="ah-bottom-row">
        <div className="ah-chart-card">
          <h3 className="ah-chart-title"><Users size={16} color="#3b82f6" /> Users by Role</h3>
          <div className="ah-role-bars">
            {[
              { role: "student",   color: "#3b82f6", count: stats?.usersByRole?.student ?? 0 },
              { role: "organizer", color: "#8b5cf6", count: stats?.usersByRole?.organizer ?? 0 },
              { role: "admin",     color: "#ef4444", count: stats?.usersByRole?.admin ?? 0 },
            ].map(r => {
              const pct = stats?.totalUsers ? Math.round((r.count / stats.totalUsers) * 100) : 0;
              return (
                <div key={r.role} className="ah-role-row">
                  <span className="ah-role-name" style={{ color: r.color }}>{r.role}</span>
                  <div className="ah-role-bar-bg">
                    <div className="ah-role-bar-fill" style={{ width: `${pct}%`, background: r.color }} />
                  </div>
                  <span className="ah-role-count">{r.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ah-chart-card">
          <h3 className="ah-chart-title"><CheckCircle size={16} color="#10b981" /> Platform Health</h3>
          <div className="ah-health-items">
            {[
              { label: "Approval Rate",    value: stats?.totalEvents ? `${Math.round(((stats.totalEvents - (stats.pendingEvents || 0)) / stats.totalEvents) * 100)}%` : "N/A", color: "#10b981" },
              { label: "Active User Rate", value: stats?.totalUsers ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` : "N/A", color: "#6366f1" },
              { label: "Suspension Rate",  value: stats?.totalUsers ? `${Math.round((stats.suspendedUsers / stats.totalUsers) * 100)}%` : "N/A", color: "#f59e0b" },
              { label: "Avg Attendees/Event", value: stats?.totalEvents ? Math.round(stats.totalAttendees / stats.totalEvents) : 0, color: "#8b5cf6" },
              { label: "Active Announcements", value: stats?.activeAnnouncements ?? 0, color: "#ef4444" },
            ].map(h => (
              <div key={h.label} className="ah-health-item">
                <span className="ah-health-label">{h.label}</span>
                <span className="ah-health-value" style={{ color: h.color }}>{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ah-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .ah-title { font-size:26px; font-weight:900; color:#fff; margin:0; }
        .ah-subtitle { font-size:13px; color:#6b7280; margin:4px 0 0; }
        .ah-refresh-btn {
          display:flex; align-items:center; gap:6px; padding:8px 16px;
          border-radius:10px; border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04); color:#9ca3af;
          font-size:13px; font-weight:600; cursor:pointer; transition:all .2s;
        }
        .ah-refresh-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }

        .ah-kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; margin-bottom:24px; }
        .ah-kpi-card {
          background: var(--kpi-bg);
          border: 1px solid color-mix(in srgb, var(--kpi-color) 25%, transparent);
          border-radius:16px; padding:20px;
          transition:all .25s; cursor:default;
        }
        .ah-kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 30px rgba(0,0,0,0.3); }
        .ah-kpi-icon-wrap {
          width:38px; height:38px; border-radius:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center; margin-bottom:14px;
        }
        .ah-kpi-value { font-size:30px; font-weight:900; color:#fff; line-height:1; margin-bottom:6px; }
        .ah-kpi-label { font-size:11.5px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.6px; }

        .ah-charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .ah-bottom-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media(max-width:900px) { .ah-charts-row, .ah-bottom-row { grid-template-columns:1fr; } }

        .ah-chart-card {
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:16px; padding:22px;
        }
        .ah-chart-title {
          display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700;
          color:#e5e7eb; margin:0 0 20px; padding-bottom:12px;
          border-bottom:1px solid rgba(255,255,255,0.06);
        }

        .ah-role-bars { display:flex; flex-direction:column; gap:14px; }
        .ah-role-row { display:flex; align-items:center; gap:12px; }
        .ah-role-name { font-size:12px; font-weight:700; text-transform:capitalize; width:70px; }
        .ah-role-bar-bg { flex:1; height:8px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden; }
        .ah-role-bar-fill { height:100%; border-radius:99px; transition:width .5s ease; }
        .ah-role-count { font-size:12px; color:#9ca3af; width:90px; text-align:right; }

        .ah-health-items { display:flex; flex-direction:column; gap:12px; }
        .ah-health-item { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; }
        .ah-health-label { font-size:13px; color:#9ca3af; font-weight:500; }
        .ah-health-value { font-size:15px; font-weight:800; }
      `}</style>
    </div>
  );
}

/* ── SVG Line Chart ── */
function LineChart({ data, color }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: 13 }}>
        No data yet
      </div>
    );
  }

  const W = 400, H = 130, PAD = 20;
  const vals = data.map(d => d.count);
  const max = Math.max(...vals, 1);
  const min = 0;
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.count - min) / (max - min)) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `M${PAD},${H - PAD} L${pts.join(" L")} L${PAD + (W - PAD * 2)},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg-${color.replace("#","")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - ((d.count - min) / (max - min)) * (H - PAD * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

/* ── SVG Bar Chart ── */
function BarChart({ data, color }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: 13 }}>
        No events yet
      </div>
    );
  }

  const W = 400, H = 130, PAD = 20;
  const max = Math.max(...data.map(d => d.count), 1);
  const barW = Math.max(10, ((W - PAD * 2) / data.length) - 6);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }} preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const x = PAD + i * ((W - PAD * 2) / data.length) + 3;
          const barH = ((d.count / max) * (H - PAD * 2 - 14));
          const y = H - PAD - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} fillOpacity="0.7" />
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill="#6b7280" fontSize="8">
                {d.name?.slice(0, 7)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Loading Skeleton ── */
function AdminLoadingSkeleton() {
  return (
    <div>
      <div style={{ height: 40, background: "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 28, width: 260 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 110, background: "rgba(255,255,255,0.03)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1, 2].map(i => <div key={i} style={{ height: 200, background: "rgba(255,255,255,0.03)", borderRadius: 16 }} />)}
      </div>
    </div>
  );
}
