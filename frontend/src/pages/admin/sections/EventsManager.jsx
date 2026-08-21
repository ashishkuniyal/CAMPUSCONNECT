import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/api";
import toast from "react-hot-toast";
import {
  Search, Trash2, Eye, CheckCircle, XCircle,
  RefreshCw, Download, Filter, ChevronDown,
  ChevronLeft, ChevronRight, LayoutGrid, List, X
} from "lucide-react";

const STATUSES = ["all", "approved", "pending", "rejected"];
const PER_PAGE = 12;

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/events?limit=1000", { headers: getAuthHeaders() });
      const all = Array.isArray(res.data) ? res.data : res.data?.events || [];
      setEvents(all);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── Derived ── */
  const filtered = events.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (e.approvalStatus || "approved") === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Handlers ── */
  const handleApprove = async (eventId) => {
    try {
      const res = await axios.patch(`/api/events/${eventId}/approve`, { approvalStatus: "approved" }, { headers: getAuthHeaders() });
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, approvalStatus: "approved" } : e));
      toast.success("Event approved");
    } catch { toast.error("Failed to approve event"); }
  };

  const openRejectModal = (event) => { setRejectModal(event); setRejectReason(""); };

  const confirmReject = async () => {
    if (!rejectModal) return;
    try {
      await axios.patch(`/api/events/${rejectModal._id}/approve`, { approvalStatus: "rejected", rejectionReason: rejectReason }, { headers: getAuthHeaders() });
      setEvents(prev => prev.map(e => e._id === rejectModal._id ? { ...e, approvalStatus: "rejected", rejectionReason: rejectReason } : e));
      toast.success("Event rejected");
      setRejectModal(null);
    } catch { toast.error("Failed to reject event"); }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event permanently?")) return;
    try {
      await axios.delete(`/api/events/${eventId}`, { headers: getAuthHeaders() });
      setEvents(prev => prev.filter(e => e._id !== eventId));
      setSelected(prev => { const s = new Set(prev); s.delete(eventId); return s; });
      toast.success("Event deleted");
    } catch { toast.error("Failed to delete event"); }
  };

  const toggleSelect = id => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => selected.size === paged.length ? setSelected(new Set()) : setSelected(new Set(paged.map(e => e._id)));

  const bulkApprove = async () => {
    const ids = [...selected];
    try {
      await Promise.all(ids.map(id => axios.patch(`/api/events/${id}/approve`, { approvalStatus: "approved" }, { headers: getAuthHeaders() })));
      setEvents(prev => prev.map(e => ids.includes(e._id) ? { ...e, approvalStatus: "approved" } : e));
      setSelected(new Set());
      toast.success(`Approved ${ids.length} events`);
    } catch { toast.error("Bulk approve failed"); }
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (!window.confirm(`Delete ${ids.length} events?`)) return;
    try {
      await Promise.all(ids.map(id => axios.delete(`/api/events/${id}`, { headers: getAuthHeaders() })));
      setEvents(prev => prev.filter(e => !ids.includes(e._id)));
      setSelected(new Set());
      toast.success(`Deleted ${ids.length} events`);
    } catch { toast.error("Bulk delete failed"); }
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get("/api/events/export", { headers: getAuthHeaders() });
      const rows = [["Title", "Date", "Location", "Category", "Attendees", "Creator", "Status"]];
      res.data.forEach(e => rows.push([
        e.title, new Date(e.date).toLocaleDateString(), e.location, e.category || "",
        e.attendees?.length || 0, e.creator?.name || "", e.approvalStatus || "approved"
      ]));
      const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "events.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const statusColor = (s) => {
    if (!s || s === "approved") return { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" };
    if (s === "pending") return { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" };
    return { color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.2)" };
  };

  return (
    <div>
      {/* Header */}
      <div className="em-header">
        <div>
          <h2 className="em-title">Event Management</h2>
          <p className="em-sub">{filtered.length} events · {events.filter(e => (e.approvalStatus || "approved") === "pending").length} pending approval</p>
        </div>
        <div className="em-header-actions">
          <button onClick={exportCSV} className="em-btn-outline"><Download size={14} /> Export CSV</button>
          <button onClick={fetchEvents} className="em-btn-outline"><RefreshCw size={14} /> Refresh</button>
          <div className="em-view-toggle">
            <button onClick={() => setView("grid")} className={`em-view-btn ${view === "grid" ? "active" : ""}`}><LayoutGrid size={15} /></button>
            <button onClick={() => setView("list")} className={`em-view-btn ${view === "list" ? "active" : ""}`}><List size={15} /></button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="em-filters">
        <div className="em-search-wrap">
          <Search size={15} className="em-search-icon" />
          <input
            className="em-search"
            placeholder="Search events…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button onClick={() => setSearch("")} className="em-search-clear"><X size={14} /></button>}
        </div>
        <FilterDropdown label="Status" value={statusFilter} options={STATUSES} onChange={v => { setStatusFilter(v); setPage(1); }} />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="em-bulk-bar">
          <span className="em-bulk-count">{selected.size} selected</span>
          <button onClick={bulkApprove} className="em-bulk-btn success"><CheckCircle size={13} /> Approve All</button>
          <button onClick={bulkDelete} className="em-bulk-btn danger"><Trash2 size={13} /> Delete All</button>
          <button onClick={() => setSelected(new Set())} className="em-bulk-btn ghost"><X size={13} /> Clear</button>
        </div>
      )}

      {/* Content */}
      {loading ? <EventSkeleton view={view} /> : paged.length === 0 ? (
        <div className="em-empty">No events found</div>
      ) : view === "grid" ? (
        <div className="em-grid">
          {paged.map(event => {
            const sc = statusColor(event.approvalStatus);
            return (
              <div key={event._id} className={`em-card ${selected.has(event._id) ? "selected" : ""}`}>
                <div className="em-card-select">
                  <input type="checkbox" checked={selected.has(event._id)} onChange={() => toggleSelect(event._id)} className="um-checkbox" />
                  <span className="em-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {event.approvalStatus || "approved"}
                  </span>
                </div>
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.title} className="em-card-img" onError={e => e.target.style.display = "none"} />
                )}
                <h3 className="em-card-title">{event.title}</h3>
                <div className="em-card-meta">
                  <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                  <span>👥 {event.attendees?.length || 0}</span>
                </div>
                {event.creator?.name && <p className="em-card-creator">by {event.creator.name}</p>}
                {event.category && <span className="em-category-tag">{event.category}</span>}
                <div className="em-card-actions">
                  {(event.approvalStatus === "pending" || !event.approvalStatus) && event.approvalStatus !== "approved" && (
                    <button onClick={() => handleApprove(event._id)} className="em-action-btn approve" title="Approve"><CheckCircle size={14} /></button>
                  )}
                  {event.approvalStatus !== "rejected" && (
                    <button onClick={() => openRejectModal(event)} className="em-action-btn reject" title="Reject"><XCircle size={14} /></button>
                  )}
                  <button onClick={() => handleDelete(event._id)} className="em-action-btn delete" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="em-list-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th check">
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} className="um-checkbox" />
                </th>
                <th className="um-th">Event</th>
                <th className="um-th">Date</th>
                <th className="um-th">Category</th>
                <th className="um-th">Attendees</th>
                <th className="um-th">Status</th>
                <th className="um-th right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(event => {
                const sc = statusColor(event.approvalStatus);
                return (
                  <tr key={event._id} className="um-tr">
                    <td className="um-td check"><input type="checkbox" checked={selected.has(event._id)} onChange={() => toggleSelect(event._id)} className="um-checkbox" /></td>
                    <td className="um-td">
                      <p style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 13.5, margin: 0 }}>{event.title}</p>
                      {event.creator?.name && <p style={{ fontSize: 11.5, color: "#6b7280", margin: "2px 0 0" }}>by {event.creator.name}</p>}
                    </td>
                    <td className="um-td um-meta">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="um-td um-meta">{event.category || "—"}</td>
                    <td className="um-td um-meta">{event.attendees?.length || 0}</td>
                    <td className="um-td">
                      <span style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700 }}>
                        {event.approvalStatus || "approved"}
                      </span>
                    </td>
                    <td className="um-td right">
                      <div className="um-actions">
                        {event.approvalStatus === "pending" && <button onClick={() => handleApprove(event._id)} className="em-action-btn approve"><CheckCircle size={14} /></button>}
                        {event.approvalStatus !== "rejected" && <button onClick={() => openRejectModal(event)} className="em-action-btn reject"><XCircle size={14} /></button>}
                        <button onClick={() => handleDelete(event._id)} className="em-action-btn delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="modal-box">
            <h3 className="modal-title">❌ Reject Event</h3>
            <p className="modal-body">Reject "<strong>{rejectModal.title}</strong>"? This will mark it as rejected.</p>
            <div className="modal-field">
              <label className="modal-label">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason…" className="modal-textarea" rows={3} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setRejectModal(null)} className="modal-btn-cancel">Cancel</button>
              <button onClick={confirmReject} className="modal-btn-confirm danger">Reject Event</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .em-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .em-title { font-size:22px; font-weight:900; color:#fff; margin:0; }
        .em-sub { font-size:13px; color:#6b7280; margin:4px 0 0; }
        .em-header-actions { display:flex; gap:8px; align-items:center; }
        .em-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#9ca3af; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .2s; }
        .em-btn-outline:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .em-view-toggle { display:flex; border-radius:9px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); }
        .em-view-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:none; background:rgba(255,255,255,0.04); color:#6b7280; cursor:pointer; transition:all .2s; }
        .em-view-btn.active { background:rgba(99,102,241,0.2); color:#a5b4fc; }
        .em-view-btn:hover:not(.active) { background:rgba(255,255,255,0.06); color:#fff; }

        .em-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .em-search-wrap { position:relative; flex:1; min-width:200px; }
        .em-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#6b7280; }
        .em-search { width:100%; padding:9px 36px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; font-size:13px; outline:none; transition:all .2s; box-sizing:border-box; }
        .em-search:focus { border-color:rgba(99,102,241,0.5); }
        .em-search::placeholder { color:#4b5563; }
        .em-search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:#6b7280; cursor:pointer; }

        .em-bulk-bar { display:flex; align-items:center; gap:10px; padding:10px 16px; margin-bottom:12px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:10px; }
        .em-bulk-count { font-size:13px; font-weight:700; color:#a5b4fc; flex:1; }
        .em-bulk-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid transparent; transition:all .2s; }
        .em-bulk-btn.success { background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.3); color:#34d399; }
        .em-bulk-btn.danger { background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); color:#f87171; }
        .em-bulk-btn.ghost { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#9ca3af; }

        .em-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
        .em-card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:16px; transition:all .2s; }
        .em-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .em-card.selected { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.08); }
        .em-card-select { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .em-status-pill { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; text-transform:capitalize; }
        .em-card-img { width:100%; height:110px; object-fit:cover; border-radius:9px; margin-bottom:12px; }
        .em-card-title { font-size:14px; font-weight:800; color:#e5e7eb; margin:0 0 8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .em-card-meta { display:flex; gap:12px; font-size:12px; color:#6b7280; margin-bottom:6px; }
        .em-card-creator { font-size:11.5px; color:#9ca3af; margin:0 0 8px; }
        .em-category-tag { display:inline-block; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:600; background:rgba(139,92,246,0.15); color:#a78bfa; border:1px solid rgba(139,92,246,0.2); margin-bottom:10px; }
        .em-card-actions { display:flex; gap:6px; }
        .em-action-btn { flex:1; padding:7px; border-radius:8px; border:1px solid transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; transition:all .2s; }
        .em-action-btn.approve { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25); color:#34d399; }
        .em-action-btn.approve:hover { background:rgba(16,185,129,0.2); }
        .em-action-btn.reject { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.25); color:#fbbf24; }
        .em-action-btn.reject:hover { background:rgba(245,158,11,0.2); }
        .em-action-btn.delete { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.25); color:#f87171; }
        .em-action-btn.delete:hover { background:rgba(239,68,68,0.2); }

        .em-list-wrap { border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.06); }
        .em-empty { padding:60px 20px; text-align:center; color:#4b5563; background:rgba(255,255,255,0.02); border-radius:14px; border:1px solid rgba(255,255,255,0.06); font-size:15px; font-weight:700; }
      `}</style>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
        <Filter size={13} /> {label}: {value} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", minWidth: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: o === value ? "rgba(255,255,255,0.05)" : "none", color: o === value ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", textTransform: "capitalize" }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EventSkeleton({ view }) {
  return view === "grid" ? (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height: 200, background: "rgba(255,255,255,0.03)", borderRadius: 14 }} />
      ))}
    </div>
  ) : (
    <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,0.04)" }} />)}
    </div>
  );
}
