import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthHeaders } from "../utils/api";
import toast from "react-hot-toast";
import {
  Users, Calendar, Activity, Shield,
  Clock, Eye, Trash2, UserCheck,
  Search, ChevronDown, RefreshCw
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalAttendees: 0,
    activeUsers: 0,
    pendingApprovals: 0,
  });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Use a ref so the effect runs exactly once on mount
  const initialized = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [usersRes, eventsRes] = await Promise.all([
        axios.get("/api/auth/users", { headers }),
        axios.get("/api/events?limit=1000", { headers }),
      ]);

      const allUsers = usersRes.data || [];
      const allEvents = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : eventsRes.data?.events || [];

      setUsers(allUsers);
      setEvents(allEvents);

      const totalAttendees = allEvents.reduce(
        (sum, e) => sum + (e.attendees?.length || 0),
        0
      );
      const activeUsers = allUsers.filter((u) => {
        const lastActive = new Date(u.lastLogin || u.createdAt);
        return (Date.now() - lastActive) / (1000 * 60 * 60 * 24) <= 30;
      }).length;

      setStats({
        totalUsers: allUsers.length,
        totalEvents: allEvents.length,
        totalAttendees,
        activeUsers,
        pendingApprovals: 0,
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
      // Show toast only once — not on every render
      toast.error("Failed to load dashboard data", { id: "admin-load-error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Read user directly inside effect to avoid object reference changes
    const stored = localStorage.getItem("user");
    const currentUser = stored ? JSON.parse(stored) : null;

    if (!currentUser || currentUser.role !== "admin") {
      toast.error("Access denied. Admin privileges required.", { id: "admin-access" });
      navigate("/");
      return;
    }

    fetchDashboardData();
  }, [navigate, fetchDashboardData]);

  /* ── Handlers ───────────────────────────────────── */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/auth/users/${userId}`, { headers: getAuthHeaders() });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await axios.patch(
        `/api/auth/users/${userId}/role`,
        { role: newRole },
        { headers: getAuthHeaders() }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: res.data.role } : u))
      );
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/events/${eventId}`, { headers: getAuthHeaders() });
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setStats((prev) => ({ ...prev, totalEvents: prev.totalEvents - 1 }));
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  /* ── Derived data ───────────────────────────────── */
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/30 to-orange-600/30 border border-red-500/30">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-red-200 to-white bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-sm">Manage users, events, and platform settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin-portal")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600
                         text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 transition-all text-sm font-bold">
              <Shield size={15} />
              Open Standalone Portal
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                         text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold">
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />}    label="Total Users"     value={stats.totalUsers}      color="blue" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Total Events"    value={stats.totalEvents}     color="purple" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Total Attendees" value={stats.totalAttendees}  color="green" />
          <StatCard icon={<UserCheck className="w-5 h-5" />}label="Active (30d)"    value={stats.activeUsers}     color="indigo" />
          <StatCard icon={<Clock className="w-5 h-5" />}    label="Pending"         value={stats.pendingApprovals}color="orange" />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {[
            { id: "overview", label: "Overview" },
            { id: "users",    label: `Users (${users.length})` },
            { id: "events",   label: `Events (${events.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
              className={`px-6 py-3 font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "text-white border-b-2 border-red-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        {activeTab !== "overview" && (
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-red-500/40
                         text-white placeholder-gray-500 transition-all"
            />
          </div>
        )}

        {/* ── Tab Content ── */}
        {activeTab === "overview" && <OverviewTab users={users} events={events} />}
        {activeTab === "users"    && <UsersTab    users={filteredUsers}  onDelete={handleDeleteUser} onRoleChange={handleChangeRole} />}
        {activeTab === "events"   && <EventsTab   events={filteredEvents} onDelete={handleDeleteEvent} navigate={navigate} />}
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:   "from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-400",
    purple: "from-purple-600/20 to-violet-600/20 border-purple-500/30 text-purple-400",
    green:  "from-green-600/20 to-emerald-600/20 border-green-500/30 text-green-400",
    indigo: "from-indigo-600/20 to-blue-600/20 border-indigo-500/30 text-indigo-400",
    orange: "from-orange-600/20 to-red-600/20 border-orange-500/30 text-orange-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl border rounded-2xl p-5
                     shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
                     hover:scale-105 transition-all duration-300`}>
      <div className="p-2 rounded-lg bg-white/5 border border-white/10 w-fit mb-3">
        {icon}
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────────── */
function OverviewTab({ users, events }) {
  const recentUsers  = [...users].reverse().slice(0, 5);
  const recentEvents = [...events].reverse().slice(0, 5);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Recent Users */}
      <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users size={18} className="text-blue-400" /> Recent Users
        </h3>
        <div className="space-y-2">
          {recentUsers.length === 0 ? (
            <EmptyState icon={<Users size={32} />} text="No users yet" />
          ) : recentUsers.map((u) => (
            <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600
                              flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <RoleBadge role={u.role} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-purple-400" /> Recent Events
        </h3>
        <div className="space-y-2">
          {recentEvents.length === 0 ? (
            <EmptyState icon={<Calendar size={32} />} text="No events yet — create one to get started!" />
          ) : recentEvents.map((e) => (
            <div key={e._id} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <p className="font-semibold text-white text-sm truncate">{e.title}</p>
              <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                <span>{new Date(e.date).toLocaleDateString()}</span>
                <span className="text-purple-400 font-semibold">{e.attendees?.length || 0} attendees</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Users Tab ─────────────────────────────────────────── */
function UsersTab({ users, onDelete, onRoleChange }) {
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  if (users.length === 0) {
    return <EmptyState icon={<Users size={40} />} text="No users found" />;
  }

  return (
    <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.03] border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-white/[0.02] transition-all group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600
                                    flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleSelect
                    role={user.role}
                    disabled={user._id === currentUserId}
                    onChange={(newRole) => onRoleChange(user._id, newRole)}
                  />
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {user._id !== currentUserId && (
                    <button
                      onClick={() => onDelete(user._id)}
                      title="Delete user"
                      className="p-2 rounded-lg text-red-400 opacity-0 group-hover:opacity-100
                                 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all">
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Events Tab ────────────────────────────────────────── */
function EventsTab({ events, onDelete, navigate }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={40} />}
        text="No events yet"
        sub='Go to "Create Event" to add your first event'
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <div key={event._id}
             className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08]
                        rounded-2xl p-5 hover:border-white/20 transition-all group">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-32 object-cover rounded-xl mb-3"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm">{event.title}</h3>
          <div className="space-y-1 text-xs text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-purple-400 flex-shrink-0" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={12} className="text-blue-400 flex-shrink-0" />
              <span>{event.attendees?.length || 0} attendees</span>
            </div>
            {event.creator?.name && (
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-green-400 flex-shrink-0" />
                <span className="truncate">by {event.creator.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/event/${event._id}`)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10
                         text-white text-xs font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-1">
              <Eye size={13} /> View
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30
                         text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Role Badge ────────────────────────────────────────── */
function RoleBadge({ role }) {
  const styles = {
    admin:     "bg-red-500/20 text-red-400 border-red-500/30",
    organizer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    student:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${styles[role] || styles.student}`}>
      {role}
    </span>
  );
}

/* ─── Role Select Dropdown ──────────────────────────────── */
function RoleSelect({ role, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roles = ["student", "organizer", "admin"];
  const colors = {
    admin:     "text-red-400",
    organizer: "text-purple-400",
    student:   "text-blue-400",
  };

  if (disabled) return <RoleBadge role={role} />;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border
                    bg-white/5 border-white/10 hover:bg-white/10 transition-all ${colors[role]}`}>
        {role}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-[#0d0d1a] border border-white/10
                        rounded-xl shadow-2xl overflow-hidden min-w-[110px]">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/5
                          transition-all ${colors[r]} ${r === role ? "bg-white/[0.04]" : ""}`}>
              {r}
              {r === role && <span className="float-right text-white/30">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────── */
function EmptyState({ icon, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-600 mb-4">{icon}</div>
      <p className="text-gray-400 font-semibold">{text}</p>
      {sub && <p className="text-gray-600 text-sm mt-1">{sub}</p>}
    </div>
  );
}
