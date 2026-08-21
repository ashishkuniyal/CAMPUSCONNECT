import React from "react";
import { Shield, Info } from "lucide-react";

export default function AdminSettings({ currentUser }) {
  return (
    <div>
      <div className="as-header">
        <h2 className="um-title">Settings</h2>
        <p className="um-sub">Platform configuration and admin information</p>
      </div>

      {/* Admin Profile Card */}
      <div className="as-section">
        <h3 className="as-section-title"><Shield size={15} /> Admin Profile</h3>
        <div className="as-profile-card">
          <div className="as-avatar">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="as-profile-name">{currentUser?.name}</p>
            <p className="as-profile-email">{currentUser?.email}</p>
            <span className="as-role-badge">Administrator</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="as-section">
        <h3 className="as-section-title"><Info size={15} /> Platform Info</h3>
        <div className="as-info-grid">
          {[
            { label: "Platform", value: "CampusConnect" },
            { label: "Version", value: "2.0.0" },
            { label: "Admin Portal", value: "Standalone v1.0" },
            { label: "Roles Supported", value: "Student, Organizer, Admin" },
            { label: "Event Approval", value: "Manual (admin-controlled)" },
            { label: "Auth System", value: "JWT with Refresh Tokens" },
          ].map(item => (
            <div key={item.label} className="as-info-item">
              <p className="as-info-label">{item.label}</p>
              <p className="as-info-value">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="as-section">
        <h3 className="as-section-title">Role Permissions Matrix</h3>
        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                <th className="as-th">Feature</th>
                <th className="as-th center">Student</th>
                <th className="as-th center">Organizer</th>
                <th className="as-th center">Admin</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["View Events",           true, true, true],
                ["Join Events",           true, true, true],
                ["Create Events",         false, true, true],
                ["Event Analytics",       false, true, true],
                ["Manage Users",          false, false, true],
                ["Suspend Users",         false, false, true],
                ["Approve Events",        false, false, true],
                ["Delete Any Event",      false, false, true],
                ["Send Announcements",    false, false, true],
                ["View Audit Log",        false, false, true],
                ["Platform Statistics",   false, false, true],
              ].map(([feature, ...perms]) => (
                <tr key={feature} className="as-tr">
                  <td className="as-td">{feature}</td>
                  {perms.map((p, i) => (
                    <td key={i} className="as-td center">
                      <span style={{ fontSize: 16 }}>{p ? "✅" : "❌"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .as-header { margin-bottom:24px; }
        .as-section { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:22px; margin-bottom:16px; }
        .as-section-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:#e5e7eb; margin:0 0 18px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .as-profile-card { display:flex; align-items:center; gap:16px; }
        .as-avatar { width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,#ef4444,#b91c1c); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:22px; flex-shrink:0; }
        .as-profile-name { font-size:18px; font-weight:900; color:#fff; margin:0 0 4px; }
        .as-profile-email { font-size:13px; color:#6b7280; margin:0 0 8px; }
        .as-role-badge { display:inline-block; padding:3px 12px; border-radius:99px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#f87171; font-size:11.5px; font-weight:800; letter-spacing:.5px; }
        .as-info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
        .as-info-item { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; }
        .as-info-label { font-size:11px; font-weight:700; color:#4b5563; text-transform:uppercase; letter-spacing:.6px; margin:0 0 5px; }
        .as-info-value { font-size:13.5px; font-weight:700; color:#e5e7eb; margin:0; }
        .as-table-wrap { border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.06); }
        .as-table { width:100%; border-collapse:collapse; }
        .as-th { padding:11px 16px; text-align:left; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.6px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.06); }
        .as-th.center { text-align:center; }
        .as-tr { border-bottom:1px solid rgba(255,255,255,0.04); transition:background .15s; }
        .as-tr:hover { background:rgba(255,255,255,0.02); }
        .as-tr:last-child { border-bottom:none; }
        .as-td { padding:11px 16px; font-size:13px; color:#9ca3af; }
        .as-td.center { text-align:center; }
      `}</style>
    </div>
  );
}
