import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Aggregator from "./pages/Aggregator";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ChatRoom from "./pages/ChatRoom";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Events from "./pages/Events";
import Internships from "./pages/Internships";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPortal from "./pages/admin/AdminPortal";
import NotFound from "./pages/NotFound";

// Initialize Socket.IO client dynamically based on environment
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : "/";
const socket = io(SOCKET_URL, { path: "/socket.io", transports: ["websocket"] });

export default function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent socket={socket} connected={connected} />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

function AppContent({ socket, connected }) {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin-portal");

  // Standalone admin portal — no Navbar / Footer / orbs
  if (isAdminPortal) {
    return (
      <>
        <Toast />
        <Routes>
          <Route
            path="/admin-portal"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-portal/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
    );
  }

  return (
    <>
      {/* Background Animated Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="min-h-screen flex flex-col relative z-10">
        <Toast />
        <Navbar socket={socket} />

        {/* Connection Status Indicator */}
        <div className="fixed bottom-4 right-4 z-50 glass px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2 shadow-xl">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          {connected ? "Connected" : "Disconnected"}
        </div>

        {/* Main Routes with top padding for floating navbar */}
        <div className="flex-1 container mx-auto px-4 pt-28 pb-12">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetails socket={socket} />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/aggregator" element={<Aggregator />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Protected routes — require login */}
            <Route path="/create" element={<ProtectedRoute><CreateEvent socket={socket} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard socket={socket} /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatRoom socket={socket} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-500 text-sm glass border-x-0 border-b-0 border-t border-white/5 relative z-10">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <p className="flex items-center gap-2">Empowering Campus Life <span className="text-xl">🚀</span></p>
          </div>
        </footer>
      </div>
    </>
  );
}
