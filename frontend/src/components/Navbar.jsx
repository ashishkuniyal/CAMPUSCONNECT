import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles, LogOut,
  LayoutDashboard, Globe, MessageSquare,
  CalendarRange, Home, Menu, X, Plus, Zap
} from "lucide-react";
import Notifications from "./Notifications";

/* ─── Nav structure ───────────────────────────────────── */
const PRIMARY_LINKS = [
  { name: "Home",       path: "/",           icon: <Home size={16}/> },
  { name: "Dashboard",  path: "/dashboard",  icon: <LayoutDashboard size={16}/> },
  { name: "Aggregator", path: "/aggregator", icon: <Globe size={16}/> },
  { name: "Events",     path: "/events",     icon: <CalendarRange size={16}/> },
  { name: "Chat",       path: "/chat",       icon: <MessageSquare size={16}/> },
];

function getNavLinks(user) {
  const links = [...PRIMARY_LINKS];
  if (user?.role === "admin") {
    links.push({ name: "Admin Portal", path: "/admin-portal", icon: <Zap size={16}/> });
  }
  return links;
}

/* ─── Mobile drawer ───────────────────────────────────── */
function MobileMenu({ open, onClose, user, onLogout }) {
  const { pathname } = useLocation();
  const allLinks = getNavLinks(user);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-80 
                      bg-gradient-to-br from-[#0a0a16] to-[#08080e]
                      border-l border-white/[0.1]
                      z-50 flex flex-col shadow-2xl
                      animate-in slide-in-from-right duration-300">
        
        {/* Top gradient accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />

        {/* header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-violet-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-xl ring-2 ring-violet-400/30">
              <Sparkles size={18} className="text-white drop-shadow-lg" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">
                Campus<span className="text-violet-400">Connect</span>
              </span>
              <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">
                Student Platform
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-[12px] text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* user info */}
        {user && (
          <div className="relative px-6 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-violet-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-base shadow-xl ring-2 ring-violet-400/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user.name}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {allLinks.map((link) => {
            const active = pathname === link.path;
            const isAdmin = link.name === "Admin Portal";

            return (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-violet-600/30 text-white border border-violet-500/30 font-bold"
                    : isAdmin
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <span>{link.icon}</span>
                <span className="text-sm">{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* footer */}
        <div className="p-5 border-t border-white/[0.08]">
          {user ? (
            <button 
              onClick={() => { onLogout(); onClose(); }}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl w-full text-rose-400 font-bold text-sm bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link 
                to="/login" 
                onClick={onClose}
                className="py-3 rounded-xl border border-white/15 text-center text-gray-300 text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                onClick={onClose}
                className="py-3 rounded-xl text-center text-white text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Navbar ─────────────────────────────────────── */
export default function Navbar({ socket }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navLinks = getNavLinks(user);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { 
    setMobileOpen(false); 
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4 pointer-events-none">
        <nav className={`pointer-events-auto mx-auto max-w-7xl relative
                        transition-all duration-500 ease-out
                        ${scrolled 
                          ? 'bg-[#0d0d1a]/85 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset]' 
                          : 'bg-[#0d0d1a]/75 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset]'
                        }
                        border border-white/[0.08] hover:border-white/[0.12]
                        rounded-[20px] px-3.5 sm:px-6 py-2 sm:py-2.5
                        flex items-center gap-2 sm:gap-4
                        overflow-visible group/nav`}>
          
          {/* Enhanced top accent */}
          <div className="absolute top-0 inset-x-0 h-[1px] overflow-hidden rounded-t-[20px]">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-violet-400/80 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
          </div>

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group mr-1 relative z-10">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 border border-violet-400/20 group-hover:scale-105 transition-all">
              <Sparkles size={18} className="text-white drop-shadow-md" />
            </div>
            
            <div className="hidden sm:block">
              <div className="font-extrabold text-[16px] tracking-tight leading-none text-white group-hover:text-violet-200 transition-colors">
                CampusConnect
              </div>
              <div className="text-[9px] font-semibold text-gray-500 tracking-widest uppercase mt-0.5">
                Student Platform
              </div>
            </div>
          </Link>

          {/* ── Divider ── */}
          <div className="w-[1.5px] h-7 bg-white/10 flex-shrink-0 hidden md:block relative z-10" />

          {/* ── Primary nav links ── */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 relative z-10">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              const isAdminPortal = link.name === "Admin Portal";

              if (isAdminPortal) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border ${
                      active
                        ? "bg-amber-500/25 text-amber-200 border-amber-500/50 shadow-md shadow-amber-500/20"
                        : "bg-amber-500/10 text-amber-300/90 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-200"
                    }`}
                  >
                    <Zap size={14} className="text-amber-400 animate-pulse" />
                    <span>Admin Portal</span>
                  </Link>
                );
              }

              return (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "text-white bg-white/[0.08] shadow-sm border border-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={active ? "text-violet-300" : "text-gray-400"}>
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto relative z-10">

            {/* Create Event */}
            <Link 
              to="/create"
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all border border-violet-400/30"
            >
              <Plus size={15} />
              <span>Create</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <Notifications socket={socket} />
            </div>

            {/* User section */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10">
                {/* avatar */}
                <Link 
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all group/user"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md border border-violet-400/30 group-hover:scale-105 transition-all">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-300 text-xs font-bold hidden lg:block group-hover:text-white transition-colors max-w-[90px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>

                {/* logout */}
                <button 
                  onClick={logout}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link 
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all border border-white/10"
                >
                  Log in
                </Link>
                <Link 
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-500/30 border border-violet-400/30"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={logout}
      />
    </>
  );
}
