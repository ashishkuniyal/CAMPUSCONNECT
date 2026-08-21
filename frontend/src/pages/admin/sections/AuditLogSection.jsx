import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/api";
import { ScrollText, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_COLORS = {
  DELETE_USER:          { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Deleted User" },
  DELETE_EVENT:         { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Deleted Event" },
  DELETE_ANNOUNCEMENT:  { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Deleted Announcement" },
  SUSPEND_USER:         { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", label: "Suspended User" },
  UNSUSPEND_USER:       { color: "#34d399", bg: "rgba(16,185,129,0.12)", label: "Unsuspended User" },
  CHANGE_ROLE:          { color: "#a78bfa", bg: "rgba(139,92,246,0.12)", label: "Changed Role" },
  APPROVE_EVENT:        { color: "#34d399", bg: "rgba(16,185,129,0.12)", label: "Approved Event" },
  REJECT_EVENT:         { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Rejected Event" },
  CREATE_ANNOUNCEMENT:  { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", label: "Created Announcement" },
};

const ACTION_TYPES = ["all", ...Object.keys(ACTION_COLORS)];
const PER_PAGE = 20;

export default function AuditLogSection() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/auth/audit-log?limit=200`, { headers: getAuthHeaders() });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.action === filter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div className="al-header">
        <div>
          <h2 className="um-title">Audit Log</h2>
          <p className="um-sub">{total} total actions recorded</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchLogs} className="em-btn-outline"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Filter */}
      <div className="al-filters">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "DELETE_USER", "SUSPEND_USER", "CHANGE_ROLE", "APPROVE_EVENT", "REJECT_EVENT", "CREATE_ANNOUNCEMENT"].map(a => {
            const info = ACTION_COLORS[a];
            return (
              <button
                key={a}
                onClick={() => { setFilter(a); setPage(1); }}
                className={`al-filter-chip ${filter === a ? "active" : ""}`}
                style={filter === a && info ? { background: info.bg, borderColor: info.color, color: info.color } : {}}
              >
                {info?.label || "All Actions"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ height: 64, background: "rgba(255,255,255,0.03)", borderRadius: 10 }} />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="al-empty">
          <ScrollText size={40} color="#374151" />
          <p>No activity logged yet</p>
          <p style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>Admin actions will appear here</p>
        </div>
      ) : (
        <div className="al-list">
          {paged.map((log, i) => {
            const info = ACTION_COLORS[log.action] || { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", label: log.action };
            return (
              <div key={log._id || i} className="al-entry">
                <div className="al-dot" style={{ background: info.color, boxShadow: `0 0 8px ${info.color}50` }} />
                <div className="al-entry-body">
                  <div className="al-entry-top">
                    <span className="al-action-tag" style={{ color: info.color, background: info.bg }}>
                      {info.label}
                    </span>
                    <span className="al-time">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="al-entry-text">
                    <strong style={{ color: "#e5e7eb" }}>{log.adminName}</strong>
                    {" → "}
                    {log.targetType && <span style={{ color: "#9ca3af" }}>{log.targetType}: </span>}
                    <strong style={{ color: "#d1d5db" }}>{log.targetName || log.targetId}</strong>
                    {log.details && <span style={{ color: "#6b7280" }}> · {log.details}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="um-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="um-page-btn"><ChevronLeft size={15} /></button>
          <span className="um-page-info">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="um-page-btn"><ChevronRight size={15} /></button>
        </div>
      )}

      <style>{`
        .al-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .al-filters { margin-bottom:18px; }
        .al-filter-chip { padding:5px 14px; border-radius:99px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#6b7280; transition:all .2s; }
        .al-filter-chip:hover:not(.active) { background:rgba(255,255,255,0.06); color:#9ca3af; }
        .al-list { display:flex; flex-direction:column; gap:0; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); }
        .al-entry { display:flex; align-items:flex-start; gap:14px; padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background .15s; }
        .al-entry:last-child { border-bottom:none; }
        .al-entry:hover { background:rgba(255,255,255,0.02); }
        .al-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:5px; }
        .al-entry-body { flex:1; min-width:0; }
        .al-entry-top { display:flex; align-items:center; gap:10px; margin-bottom:5px; flex-wrap:wrap; }
        .al-action-tag { padding:2px 9px; border-radius:99px; font-size:11px; font-weight:800; }
        .al-time { font-size:11.5px; color:#4b5563; margin-left:auto; white-space:nowrap; }
        .al-entry-text { font-size:13px; color:#9ca3af; margin:0; line-height:1.5; }
        .al-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:70px 20px; text-align:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; gap:10px; color:#6b7280; font-size:15px; font-weight:700; }
      `}</style>
    </div>
  );
}
