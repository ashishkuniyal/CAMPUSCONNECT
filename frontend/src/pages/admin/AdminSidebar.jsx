import React from "react";
import {
  LayoutDashboard, Users, Calendar, Megaphone,
  ScrollText, Settings, Shield, ChevronLeft,
  ChevronRight, LogOut, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "home",          label: "Dashboard",      icon: LayoutDashboard, color: "#ef4444" },
  { id: "users",         label: "Users",           icon: Users,           color: "#3b82f6" },
  { id: "events",        label: "Events",          icon: Calendar,        color: "#8b5cf6" },
  { id: "announcements", label: "Announcements",   icon: Megaphone,       color: "#f59e0b" },
  { id: "auditlog",      label: "Audit Log",       icon: ScrollText,      color: "#10b981" },
  { id: "settings",      label: "Settings",        icon: Settings,        color: "#6366f1" },
];

export default function AdminSidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: sidebarOpen ? "260px" : "72px",
        transition: "width 0.3s ease",
      }}
      className="admin-sidebar"
    >
      {/* Logo area */}
      <div className="admin-sidebar-header">
        <div className="admin-logo-wrap">
          <div className="admin-logo-icon">
            <Shield size={18} color="#ef4444" />
          </div>
          {sidebarOpen && (
            <div className="admin-logo-text">
              <span className="admin-logo-title">CampusConnect</span>
              <span className="admin-logo-badge">ADMIN</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="admin-sidebar-toggle"
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Divider */}
      <div className="admin-sidebar-divider" />

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              style={isActive ? { "--item-color": item.color } : {}}
              title={!sidebarOpen ? item.label : ""}
            >
              <span
                className="admin-nav-icon"
                style={{ color: isActive ? item.color : undefined }}
              >
                <Icon size={18} />
              </span>
              {sidebarOpen && (
                <span className="admin-nav-label">{item.label}</span>
              )}
              {isActive && sidebarOpen && (
                <span
                  className="admin-nav-indicator"
                  style={{ background: item.color }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Back to site */}
      <div className="admin-sidebar-divider" />
      <button
        onClick={() => navigate("/")}
        className="admin-nav-item"
        title={!sidebarOpen ? "Back to Site" : ""}
      >
        <span className="admin-nav-icon"><ExternalLink size={16} /></span>
        {sidebarOpen && <span className="admin-nav-label">Back to Site</span>}
      </button>

      {/* User info + logout */}
      <div className="admin-sidebar-user">
        <div className="admin-user-avatar">
          {currentUser?.name?.charAt(0).toUpperCase()}
        </div>
        {sidebarOpen && (
          <div className="admin-user-info">
            <p className="admin-user-name">{currentUser?.name}</p>
            <p className="admin-user-role">Administrator</p>
          </div>
        )}
        {sidebarOpen && (
          <button onClick={handleLogout} className="admin-logout-btn" title="Logout">
            <LogOut size={15} />
          </button>
        )}
      </div>

      <style>{`
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: rgba(10, 10, 20, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
        }
        .admin-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px 16px;
          min-height: 72px;
        }
        .admin-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }
        .admin-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .admin-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
          white-space: nowrap;
        }
        .admin-logo-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }
        .admin-logo-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #ef4444;
          margin-top: 3px;
        }
        .admin-sidebar-toggle {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .admin-sidebar-toggle:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .admin-sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 16px;
        }
        .admin-sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 8px;
          gap: 2px;
        }
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
          white-space: nowrap;
          width: 100%;
        }
        .admin-nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: #d1d5db;
        }
        .admin-nav-item.active {
          background: rgba(var(--item-color), 0.1);
          color: #fff;
        }
        .admin-nav-item.active {
          background: color-mix(in srgb, var(--item-color, #ef4444) 12%, transparent);
        }
        .admin-nav-icon {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .admin-nav-label {
          font-size: 13.5px;
          font-weight: 600;
          flex: 1;
        }
        .admin-nav-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .admin-sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .admin-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .admin-user-info {
          flex: 1;
          overflow: hidden;
        }
        .admin-user-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-user-role {
          font-size: 10.5px;
          color: #ef4444;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .admin-logout-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.08);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .admin-logout-btn:hover {
          background: rgba(239,68,68,0.2);
        }
      `}</style>
    </aside>
  );
}
