import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthHeaders, getCurrentUser } from "../utils/api";

export default function Notifications({ socket }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const user = getCurrentUser();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get("/api/notifications", { headers: getAuthHeaders() });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
  }, [user]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !user) return;
    
    // Join personal user room to receive targeted notifications
    socket.emit("joinUserRoom", user._id || user.id);

    const handleNewNotification = (note) => {
      toast.success(`🔔 ${note.title}: ${note.message}`);
      setNotifications((prev) => [note, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNewNotification);
    return () => socket.off("notification", handleNewNotification);
  }, [socket, user]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.patch("/api/notifications/read-all", {}, { headers: getAuthHeaders() });
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const markRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return;
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`, { headers: getAuthHeaders() });
      setNotifications((prev) => prev.filter(n => n._id !== id));
      // Re-calculate unread count
      const wasUnread = notifications.find(n => n._id === id && !n.read);
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full border border-[#0d0d1a]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div 
                    key={n._id} 
                    className={`p-4 transition-colors group relative ${
                      n.read ? "bg-transparent" : "bg-violet-500/10"
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => markRead(n._id, n.read)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${n.read ? "text-gray-300" : "text-white font-semibold"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          {n.link && (
                            <Link 
                              to={n.link} 
                              className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block font-medium"
                              onClick={() => setOpen(false)}
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover delete action */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                      className="absolute right-2 bottom-2 p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

