import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../utils/api";

/**
 * Wraps a route to require authentication.
 * Unauthenticated users are redirected to /login with the intended URL preserved.
 *
 * @param {string} [requiredRole] - Optional role: "admin" | "organizer" | "student"
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const user = getCurrentUser();
    if (!user || user.role !== requiredRole) {
      // Authenticated but wrong role — redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
