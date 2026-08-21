import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";
import AdminHome from "./sections/AdminHome";
import UsersManager from "./sections/UsersManager";
import EventsManager from "./sections/EventsManager";
import AnnouncementsManager from "./sections/AnnouncementsManager";
import AuditLogSection from "./sections/AuditLogSection";
import AdminSettings from "./sections/AdminSettings";

export default function AdminPortal() {
  const [activeSection, setActiveSection] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const user = stored ? JSON.parse(stored) : null;
    if (!user || user.role !== "admin") {
      toast.error("Admin access required", { id: "admin-guard" });
      navigate("/");
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  if (!currentUser) return null;

  const sectionMap = {
    home:          <AdminHome />,
    users:         <UsersManager />,
    events:        <EventsManager />,
    announcements: <AnnouncementsManager currentUser={currentUser} />,
    auditlog:      <AuditLogSection />,
    settings:      <AdminSettings currentUser={currentUser} />,
  };

  return (
    <div className="admin-portal-root">
      {/* Background */}
      <div className="admin-bg-1" />
      <div className="admin-bg-2" />

      <div className="admin-layout">
        {/* Sidebar */}
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
        />

        {/* Main Content */}
        <main
          className="admin-main"
          style={{ marginLeft: sidebarOpen ? "260px" : "72px" }}
        >
          <div className="admin-content">
            {sectionMap[activeSection] || <AdminHome />}
          </div>
        </main>
      </div>

      <style>{`
        .admin-portal-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .admin-bg-1 {
          position: fixed;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .admin-bg-2 {
          position: fixed;
          bottom: -200px;
          right: -200px;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .admin-layout {
          display: flex;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }
        .admin-main {
          flex: 1;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }
        .admin-content {
          padding: 32px 28px;
          max-width: 1400px;
        }
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
