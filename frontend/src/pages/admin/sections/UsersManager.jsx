import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/api";
import toast from "react-hot-toast";
import {
  Search, Trash2, ChevronDown, RefreshCw,
  BanIcon, CheckCircle, UserCheck, Download,
  Filter, ChevronLeft, ChevronRight, X
} from "lucide-react";

const ROLES = ["all", "student", "organizer", "admin"];
const STATUSES = ["all", "active", "suspended"];
const PER_PAGE = 12;

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [suspendModal, setSuspendModal] = useState(null); // { user, action }
  const [suspendReason, setSuspendReason] = useState("");
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/auth/users", { headers: getAuthHeaders() });
      setUsers(res.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Derived / filtered ── */
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ? true :
      statusFilter === "suspended" ? u.suspended :
      !u.suspended;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Handlers ── */
  const handleDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/auth/users/${userId}`, { headers: getAuthHeaders() });
      setUsers(prev => prev.filter(u => u._id !== userId));
      setSelected(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.success("User deleted");
    } catch { toast.error("Failed to delete user"); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.patch(`/api/auth/users/${userId}/role`, { role: newRole }, { headers: getAuthHeaders() });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: res.data.role } : u));
      toast.success(`Role changed to ${newRole}`);
    } catch { toast.error("Failed to change role"); }
  };

  const openSuspendModal = (user) => {
    setSuspendModal({ user, action: user.suspended ? "unsuspend" : "suspend" });
    setSuspendReason("");
  };

  const confirmSuspend = async () => {
    if (!suspendModal) return;
    const { user, action } = suspendModal;
    try {
      const res = await axios.patch(
        `/api/auth/users/${user._id}/suspend`,
        { suspended: action === "suspend", reason: suspendReason },
        { headers: getAuthHeaders() }
      );
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, ...res.data } : u));
      toast.success(`User ${action}ed successfully`);
      setSuspendModal(null);
    } catch { toast.error(`Failed to ${action} user`); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map(u => u._id)));
    }
  };

  const bulkDelete = async () => {
    const ids = [...selected].filter(id => id !== currentUserId);
    if (!ids.length) return toast.error("No valid users selected");
    if (!window.confirm(`Delete ${ids.length} users? This cannot be undone.`)) return;
    try {
      await Promise.all(ids.map(id => axios.delete(`/api/auth/users/${id}`, { headers: getAuthHeaders() })));
      setUsers(prev => prev.filter(u => !ids.includes(u._id)));
      setSelected(new Set());
      toast.success(`Deleted ${ids.length} users`);
    } catch { toast.error("Some deletions failed"); }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Role", "Status", "Joined", "Last Login"]];
    users.forEach(u => rows.push([
      u.name, u.email, u.role,
      u.suspended ? "Suspended" : "Active",
      new Date(u.createdAt).toLocaleDateString(),
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="um-header">
        <div>
          <h2 className="um-title">User Management</h2>
          <p className="um-sub">{filtered.length} users · {users.filter(u=>u.suspended).length} suspended</p>
        </div>
        <div className="um-header-actions">
          <button onClick={exportCSV} className="um-btn-outline"><Download size={14} /> Export CSV</button>
          <button onClick={fetchUsers} className="um-btn-outline"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search-wrap">
          <Search size={15} className="um-search-icon" />
          <input
            className="um-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button onClick={() => setSearch("")} className="um-search-clear"><X size={14} /></button>}
        </div>
        <RoleSelect value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }} options={ROLES} label="Role" />
        <RoleSelect value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={STATUSES} label="Status" />
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="um-bulk-bar">
          <span className="um-bulk-count">{selected.size} selected</span>
          <button onClick={bulkDelete} className="um-bulk-btn danger"><Trash2 size={13} /> Delete Selected</button>
          <button onClick={() => setSelected(new Set())} className="um-bulk-btn ghost"><X size={13} /> Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paged.length === 0 ? (
        <EmptyState text="No users found" />
      ) : (
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th check">
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleSelectAll} className="um-checkbox" />
                </th>
                <th className="um-th">User</th>
                <th className="um-th">Role</th>
                <th className="um-th">Status</th>
                <th className="um-th">Joined</th>
                <th className="um-th">Last Login</th>
                <th className="um-th right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(user => (
                <tr key={user._id} className="um-tr">
                  <td className="um-td check">
                    <input
                      type="checkbox"
                      checked={selected.has(user._id)}
                      onChange={() => toggleSelect(user._id)}
                      disabled={user._id === currentUserId}
                      className="um-checkbox"
                    />
                  </td>
                  <td className="um-td">
                    <div className="um-user-cell">
                      <div className="um-avatar" style={{ background: user.suspended ? "#374151" : "linear-gradient(135deg,#3b82f6,#06b6d4)" }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="um-user-name">{user.name}</p>
                        <p className="um-user-email">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="um-td">
                    {user._id === currentUserId
                      ? <RoleBadge role={user.role} />
                      : <RoleDropdown role={user.role} onChange={r => handleRoleChange(user._id, r)} />
                    }
                  </td>
                  <td className="um-td">
                    <span className={`um-status-badge ${user.suspended ? "suspended" : "active"}`}>
                      {user.suspended ? "Suspended" : "Active"}
                    </span>
                    {user.suspended && user.suspendedReason && (
                      <p className="um-suspend-reason">{user.suspendedReason}</p>
                    )}
                  </td>
                  <td className="um-td um-meta">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="um-td um-meta">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}</td>
                  <td className="um-td right">
                    <div className="um-actions">
                      {user._id !== currentUserId && (
                        <>
                          <button
                            onClick={() => openSuspendModal(user)}
                            className={`um-action-btn ${user.suspended ? "unsuspend" : "suspend"}`}
                            title={user.suspended ? "Unsuspend" : "Suspend"}
                          >
                            {user.suspended ? <CheckCircle size={14} /> : <BanIcon size={14} />}
                          </button>
                          <button onClick={() => handleDelete(user._id)} className="um-action-btn delete" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Suspend Modal */}
      {suspendModal && (
        <Modal onClose={() => setSuspendModal(null)}>
          <h3 className="modal-title">{suspendModal.action === "suspend" ? "🚫 Suspend User" : "✅ Unsuspend User"}</h3>
          <p className="modal-body">
            {suspendModal.action === "suspend"
              ? `Suspending "${suspendModal.user.name}" will block them from logging in.`
              : `Unsuspending "${suspendModal.user.name}" will restore their access.`}
          </p>
          {suspendModal.action === "suspend" && (
            <div className="modal-field">
              <label className="modal-label">Reason (optional)</label>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension…"
                className="modal-textarea"
                rows={3}
              />
            </div>
          )}
          <div className="modal-actions">
            <button onClick={() => setSuspendModal(null)} className="modal-btn-cancel">Cancel</button>
            <button
              onClick={confirmSuspend}
              className={`modal-btn-confirm ${suspendModal.action === "suspend" ? "danger" : "success"}`}
            >
              {suspendModal.action === "suspend" ? "Suspend" : "Unsuspend"}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .um-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .um-title { font-size:22px; font-weight:900; color:#fff; margin:0; }
        .um-sub { font-size:13px; color:#6b7280; margin:4px 0 0; }
        .um-header-actions { display:flex; gap:8px; }
        .um-btn-outline {
          display:flex; align-items:center; gap:6px; padding:8px 14px;
          border-radius:9px; border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04); color:#9ca3af;
          font-size:12.5px; font-weight:600; cursor:pointer; transition:all .2s;
        }
        .um-btn-outline:hover { background:rgba(255,255,255,0.08); color:#fff; }

        .um-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .um-search-wrap { position:relative; flex:1; min-width:200px; }
        .um-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#6b7280; }
        .um-search {
          width:100%; padding:9px 36px 9px 36px; border-radius:10px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          color:#fff; font-size:13px; outline:none; transition:all .2s; box-sizing:border-box;
        }
        .um-search:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.05); }
        .um-search::placeholder { color:#4b5563; }
        .um-search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:#6b7280; cursor:pointer; }

        .um-bulk-bar {
          display:flex; align-items:center; gap:10px; padding:10px 16px; margin-bottom:12px;
          background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:10px;
        }
        .um-bulk-count { font-size:13px; font-weight:700; color:#a5b4fc; flex:1; }
        .um-bulk-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid transparent; transition:all .2s; }
        .um-bulk-btn.danger { background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); color:#f87171; }
        .um-bulk-btn.danger:hover { background:rgba(239,68,68,0.25); }
        .um-bulk-btn.ghost { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#9ca3af; }

        .um-table-wrap { border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.06); }
        .um-table { width:100%; border-collapse:collapse; }
        .um-th {
          padding:12px 16px; text-align:left; font-size:11px; font-weight:700;
          color:#6b7280; text-transform:uppercase; letter-spacing:.6px;
          background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .um-th.right { text-align:right; }
        .um-th.check { width:44px; }
        .um-tr { transition:background .15s; }
        .um-tr:hover { background:rgba(255,255,255,0.02); }
        .um-td { padding:13px 16px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
        .um-td.right { text-align:right; }
        .um-td.check { width:44px; }
        .um-td.um-meta { font-size:12.5px; color:#6b7280; }
        .um-checkbox { width:15px; height:15px; cursor:pointer; accent-color:#6366f1; }

        .um-user-cell { display:flex; align-items:center; gap:10px; }
        .um-avatar { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:13px; flex-shrink:0; }
        .um-user-name { font-size:13.5px; font-weight:700; color:#e5e7eb; margin:0; }
        .um-user-email { font-size:11.5px; color:#6b7280; margin:2px 0 0; }
        .um-suspend-reason { font-size:10.5px; color:#f59e0b; margin:2px 0 0; font-style:italic; }

        .um-status-badge { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11.5px; font-weight:700; }
        .um-status-badge.active { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2); }
        .um-status-badge.suspended { background:rgba(245,158,11,0.12); color:#fbbf24; border:1px solid rgba(245,158,11,0.2); }

        .um-actions { display:flex; align-items:center; gap:6px; justify-content:flex-end; }
        .um-action-btn { width:32px; height:32px; border-radius:8px; border:1px solid transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; }
        .um-action-btn.suspend { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.25); color:#fbbf24; }
        .um-action-btn.suspend:hover { background:rgba(245,158,11,0.2); }
        .um-action-btn.unsuspend { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25); color:#34d399; }
        .um-action-btn.unsuspend:hover { background:rgba(16,185,129,0.2); }
        .um-action-btn.delete { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.25); color:#f87171; }
        .um-action-btn.delete:hover { background:rgba(239,68,68,0.2); }

        .um-pagination { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:20px; }
        .um-page-btn { width:34px; height:34px; border-radius:9px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#9ca3af; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .um-page-btn:hover:not(:disabled) { background:rgba(255,255,255,0.08); color:#fff; }
        .um-page-btn:disabled { opacity:.35; cursor:not-allowed; }
        .um-page-info { font-size:13px; color:#6b7280; font-weight:600; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal-box { background:#0f0f1e; border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:28px; width:100%; max-width:420px; animation:modalIn .2s ease; }
        @keyframes modalIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        .modal-title { font-size:18px; font-weight:900; color:#fff; margin:0 0 12px; }
        .modal-body { font-size:13.5px; color:#9ca3af; margin:0 0 18px; line-height:1.6; }
        .modal-field { margin-bottom:18px; }
        .modal-label { display:block; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; }
        .modal-textarea { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:13px; padding:10px 12px; outline:none; resize:vertical; font-family:inherit; box-sizing:border-box; }
        .modal-textarea:focus { border-color:rgba(99,102,241,0.5); }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
        .modal-btn-cancel { padding:9px 18px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#9ca3af; font-size:13px; font-weight:700; cursor:pointer; }
        .modal-btn-confirm { padding:9px 18px; border-radius:9px; border:none; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
        .modal-btn-confirm.danger { background:#ef4444; color:#fff; }
        .modal-btn-confirm.danger:hover { background:#dc2626; }
        .modal-btn-confirm.success { background:#10b981; color:#fff; }
        .modal-btn-confirm.success:hover { background:#059669; }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ─── */
function RoleBadge({ role }) {
  const c = { admin: "#ef4444", organizer: "#8b5cf6", student: "#3b82f6" };
  return (
    <span style={{ color: c[role], fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${c[role]}18`, border: `1px solid ${c[role]}30` }}>
      {role}
    </span>
  );
}

function RoleDropdown({ role, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const c = { admin: "#ef4444", organizer: "#8b5cf6", student: "#3b82f6" };
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 5, color: c[role], fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${c[role]}18`, border: `1px solid ${c[role]}30`, cursor: "pointer" }}
      >
        {role} <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "", transition: ".2s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", minWidth: 110, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          {["student", "organizer", "admin"].map(r => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: r === role ? "rgba(255,255,255,0.05)" : "none", color: c[r], fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none" }}
            >
              {r} {r === role && "✓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleSelect({ value, onChange, options, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        <Filter size={13} /> {label}: {value} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", minWidth: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          {options.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: o === value ? "rgba(255,255,255,0.05)" : "none", color: o === value ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", textTransform: "capitalize" }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: "#4b5563", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
      <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{text}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }} />
      ))}
    </div>
  );
}
