import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/api";
import toast from "react-hot-toast";
import { Megaphone, Plus, Trash2, RefreshCw, X, Info, AlertTriangle, CheckCircle, AlertOctagon } from "lucide-react";

const TYPES = [
  { id: "info",    label: "Info",    color: "#3b82f6", icon: Info },
  { id: "success", label: "Success", color: "#10b981", icon: CheckCircle },
  { id: "warning", label: "Warning", color: "#f59e0b", icon: AlertTriangle },
  { id: "danger",  label: "Danger",  color: "#ef4444", icon: AlertOctagon },
];

export default function AnnouncementsManager({ currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", expiresAt: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/auth/announcements", { headers: getAuthHeaders() });
      setAnnouncements(res.data || []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error("Title and message are required");
    try {
      setSubmitting(true);
      const res = await axios.post("/api/auth/announcements", form, { headers: getAuthHeaders() });
      setAnnouncements(prev => [res.data, ...prev]);
      setForm({ title: "", message: "", type: "info", expiresAt: "" });
      setShowForm(false);
      toast.success("Announcement created!");
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`/api/auth/announcements/${id}`, { headers: getAuthHeaders() });
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success("Announcement deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const typeInfo = (type) => TYPES.find(t => t.id === type) || TYPES[0];

  return (
    <div>
      {/* Header */}
      <div className="ann-header">
        <div>
          <h2 className="um-title">Announcements</h2>
          <p className="um-sub">{announcements.length} total · send platform-wide messages</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchAnnouncements} className="em-btn-outline"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(s => !s)} className="ann-create-btn">
            <Plus size={15} /> New Announcement
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="ann-form-wrap">
          <div className="ann-form-header">
            <span className="ann-form-title">📢 Create Announcement</span>
            <button onClick={() => setShowForm(false)} className="ann-close-btn"><X size={16} /></button>
          </div>
          <form onSubmit={handleCreate} className="ann-form">
            <div className="ann-field">
              <label className="modal-label">Title *</label>
              <input
                className="ann-input"
                placeholder="Announcement title…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="ann-field">
              <label className="modal-label">Message *</label>
              <textarea
                className="modal-textarea"
                placeholder="Write your announcement message…"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="ann-row">
              <div className="ann-field" style={{ flex: 1 }}>
                <label className="modal-label">Type</label>
                <div className="ann-type-grid">
                  {TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.id }))}
                      className={`ann-type-btn ${form.type === t.id ? "active" : ""}`}
                      style={form.type === t.id ? { borderColor: t.color, background: `${t.color}15`, color: t.color } : {}}
                    >
                      <t.icon size={13} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ann-field" style={{ minWidth: 200 }}>
                <label className="modal-label">Expires At (optional)</label>
                <input
                  type="date"
                  className="ann-input"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div className="ann-preview">
                <p className="ann-preview-label">PREVIEW</p>
                <AnnouncementCard ann={{ ...form, createdAt: new Date(), createdByName: currentUser?.name }} preview />
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)} className="modal-btn-cancel">Cancel</button>
              <button type="submit" disabled={submitting} className="ann-submit-btn">
                {submitting ? "Sending…" : "📢 Publish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 100, background: "rgba(255,255,255,0.03)", borderRadius: 14 }} />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="ann-empty">
          <Megaphone size={40} color="#374151" />
          <p>No announcements yet</p>
          <p style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>Create one to notify all users</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {announcements.map(ann => (
            <AnnouncementCard key={ann._id} ann={ann} onDelete={() => handleDelete(ann._id)} />
          ))}
        </div>
      )}

      <style>{`
        .ann-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .ann-create-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; background:linear-gradient(135deg,#ef4444,#dc2626); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
        .ann-create-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(239,68,68,0.3); }

        .ann-form-wrap { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:22px; margin-bottom:20px; }
        .ann-form-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .ann-form-title { font-size:16px; font-weight:800; color:#fff; }
        .ann-close-btn { width:28px; height:28px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#6b7280; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .ann-form { display:flex; flex-direction:column; gap:14px; }
        .ann-field { display:flex; flex-direction:column; gap:6px; }
        .ann-row { display:flex; gap:16px; flex-wrap:wrap; }
        .ann-input { padding:9px 12px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:13px; outline:none; transition:border .2s; box-sizing:border-box; width:100%; }
        .ann-input:focus { border-color:rgba(99,102,241,0.5); }
        .ann-input[type=date]::-webkit-calendar-picker-indicator { filter:invert(1) opacity(.4); }
        .ann-type-grid { display:flex; gap:8px; flex-wrap:wrap; }
        .ann-type-btn { display:flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#6b7280; font-size:12px; font-weight:700; cursor:pointer; transition:all .2s; }
        .ann-type-btn.active { font-weight:800; }
        .ann-preview { border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; }
        .ann-preview-label { font-size:10px; font-weight:800; letter-spacing:1.5px; color:#4b5563; text-transform:uppercase; margin:0 0 10px; }
        .ann-submit-btn { padding:10px 22px; border-radius:10px; background:linear-gradient(135deg,#ef4444,#dc2626); border:none; color:#fff; font-size:13.5px; font-weight:800; cursor:pointer; transition:all .2s; }
        .ann-submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(239,68,68,0.3); }
        .ann-submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ann-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:70px 20px; text-align:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; gap:10px; color:#6b7280; font-size:15px; font-weight:700; }
      `}</style>
    </div>
  );
}

function AnnouncementCard({ ann, onDelete, preview }) {
  const type = TYPES.find(t => t.id === ann.type) || TYPES[0];
  const Icon = type.icon;
  const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();

  return (
    <div
      className="ann-card"
      style={{
        borderLeft: `4px solid ${type.color}`,
        background: `${type.color}08`,
        borderTop: `1px solid ${type.color}20`,
        borderRight: `1px solid ${type.color}20`,
        borderBottom: `1px solid ${type.color}20`,
      }}
    >
      <div className="ann-card-header">
        <div className="ann-card-left">
          <span className="ann-type-tag" style={{ color: type.color, background: `${type.color}15` }}>
            <Icon size={12} /> {type.label}
          </span>
          {isExpired && <span className="ann-expired-tag">Expired</span>}
        </div>
        {!preview && onDelete && (
          <button onClick={onDelete} className="ann-del-btn"><Trash2 size={14} /></button>
        )}
      </div>
      <h4 className="ann-card-title">{ann.title}</h4>
      <p className="ann-card-msg">{ann.message}</p>
      <div className="ann-card-footer">
        <span>By {ann.createdByName || "Admin"}</span>
        <span>{ann.createdAt ? new Date(ann.createdAt).toLocaleString() : "Now"}</span>
        {ann.expiresAt && <span>Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>}
      </div>

      <style>{`
        .ann-card { border-radius:12px; padding:16px 18px; }
        .ann-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .ann-card-left { display:flex; align-items:center; gap:8px; }
        .ann-type-tag { display:flex; align-items:center; gap:4px; padding:3px 10px; border-radius:99px; font-size:11.5px; font-weight:700; }
        .ann-expired-tag { padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; background:rgba(107,114,128,0.2); color:#6b7280; }
        .ann-del-btn { width:30px; height:30px; border-radius:8px; border:none; background:rgba(239,68,68,0.1); color:#f87171; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .ann-del-btn:hover { background:rgba(239,68,68,0.2); }
        .ann-card-title { font-size:15px; font-weight:800; color:#fff; margin:0 0 8px; }
        .ann-card-msg { font-size:13.5px; color:#d1d5db; line-height:1.6; margin:0 0 12px; white-space:pre-wrap; }
        .ann-card-footer { display:flex; gap:16px; font-size:11.5px; color:#6b7280; flex-wrap:wrap; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
