import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Announcement from "../models/Announcement.js";
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation
} from "../middleware/validators.js";
import {
  authLimiter,
  createAccountLimiter
} from "../middleware/rateLimiter.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

/* ── Helper: log admin action ───────────────────────────── */
async function logAction(admin, action, targetType, targetId, targetName, details) {
  try {
    await AuditLog.create({
      adminId:    admin._id,
      adminName:  admin.name,
      action,
      targetType,
      targetId:   targetId?.toString(),
      targetName,
      details,
    });
  } catch (e) {
    console.error("Audit log error:", e.message);
  }
}

// Generate Access Token (short-lived)
// Note: JWT_SECRET presence is guaranteed by startup validation in server.js
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ✅ Register User
router.post("/register", createAccountLimiter, registerValidation, asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError("User already exists", 400);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashed,
    role: role || "student",
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}));

// ✅ Login User
router.post("/login", authLimiter, loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }

  // Block suspended users
  if (user.suspended) {
    throw new AppError("Your account has been suspended. Contact admin.", 403);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token and lastLogin to database
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}));

// ✅ Get user profile
// Uses protect middleware for consistent auth (TOKEN_EXPIRED codes, suspension checks, req.user)
router.get("/profile", protect, asyncHandler(async (req, res) => {
  res.json(req.user);
}));

// ✅ Update user profile
router.put("/profile", protect, asyncHandler(async (req, res) => {
  const { name, bio, department, year, github, linkedin, skills, preferences } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (bio !== undefined) updateData.bio = bio.trim();
  if (department !== undefined) updateData.department = department.trim();
  if (year !== undefined) updateData.year = year.trim();
  if (github !== undefined) updateData.github = github.trim();
  if (linkedin !== undefined) updateData.linkedin = linkedin.trim();
  if (skills !== undefined) updateData.skills = skills;
  if (preferences !== undefined) updateData.preferences = preferences;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    message: "Profile updated successfully",
    user
  });
}));


// ✅ Refresh Access Token
router.post("/refresh", refreshTokenValidation, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Verify refresh token (no fallback — secret guaranteed by startup validation)
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Find user and verify refresh token matches stored token
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token", 403);
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  res.json({ accessToken });
}));

// ✅ Logout User
router.post("/logout", refreshTokenValidation, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  } catch {
    // Token may already be invalid — still respond success so clients clear local storage
  }

  res.json({ message: "Logged out successfully" });
}));

// ══════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════

// ✅ Admin: Get all users
router.get("/users", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken").sort("-createdAt");
  res.json(users);
}));

// ✅ Admin: Delete user
router.delete("/users/:id", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError("Cannot delete your own account", 400);
  }

  await User.findByIdAndDelete(req.params.id);
  await logAction(req.user, "DELETE_USER", "user", user._id, user.name, `Deleted user ${user.email}`);
  res.json({ message: "User deleted successfully" });
}));

// ✅ Admin: Update user role
router.patch("/users/:id/role", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!["student", "organizer", "admin"].includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await logAction(req.user, "CHANGE_ROLE", "user", user._id, user.name, `Changed role to ${role}`);
  res.json(user);
}));

// ✅ Admin: Suspend / Unsuspend user
router.patch("/users/:id/suspend", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { suspended, reason } = req.body;

  if (req.params.id === req.user._id.toString()) {
    throw new AppError("Cannot suspend your own account", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { suspended: !!suspended, suspendedReason: reason || "" },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const action = suspended ? "SUSPEND_USER" : "UNSUSPEND_USER";
  await logAction(req.user, action, "user", user._id, user.name, reason || "");
  res.json(user);
}));

// ✅ Admin: Get platform stats
router.get("/stats", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const Event = (await import("../models/Event.js")).default;

  const [totalUsers, totalEvents, suspendedUsers, announcements] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    User.countDocuments({ suspended: true }),
    Announcement.countDocuments({ active: true }),
  ]);

  // Users by role
  const roleAgg = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
  const usersByRole = { student: 0, organizer: 0, admin: 0 };
  roleAgg.forEach(r => { usersByRole[r._id] = r.count; });

  // Events by category
  const catAgg = await Event.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  // User registrations last 30 days (daily)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const regTrend = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);

  // Active users (last 30 days)
  const activeUsers = await User.countDocuments({
    $or: [
      { lastLogin: { $gte: thirtyDaysAgo } },
      { createdAt: { $gte: thirtyDaysAgo } }
    ]
  });

  // Pending events
  const pendingEvents = await Event.countDocuments({ approvalStatus: "pending" });

  // Total attendees
  const attendeeAgg = await Event.aggregate([
    { $project: { count: { $size: { $ifNull: ["$attendees", []] } } } },
    { $group: { _id: null, total: { $sum: "$count" } } }
  ]);
  const totalAttendees = attendeeAgg[0]?.total || 0;

  res.json({
    totalUsers,
    totalEvents,
    totalAttendees,
    activeUsers,
    suspendedUsers,
    pendingEvents,
    activeAnnouncements: announcements,
    usersByRole,
    eventsByCategory: catAgg.map(c => ({ name: c._id || "Uncategorized", count: c.count })),
    registrationTrend: regTrend.map(r => ({ date: r._id, count: r.count })),
  });
}));

// ✅ Admin: Get audit log
router.get("/audit-log", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const logs = await AuditLog.find()
    .sort("-createdAt")
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  const total = await AuditLog.countDocuments();
  res.json({ logs, total });
}));

// ✅ Admin: Get all announcements
router.get("/announcements", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort("-createdAt");
  res.json(announcements);
}));

// ✅ Admin: Create announcement
router.post("/announcements", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { title, message, type, expiresAt } = req.body;

  if (!title || !message) {
    throw new AppError("Title and message are required", 400);
  }

  const ann = await Announcement.create({
    title,
    message,
    type: type || "info",
    createdBy: req.user._id,
    createdByName: req.user.name,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    active: true,
  });

  await logAction(req.user, "CREATE_ANNOUNCEMENT", "announcement", ann._id, title, message.slice(0, 80));
  res.status(201).json(ann);
}));

// ✅ Admin: Delete announcement
router.delete("/announcements/:id", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const ann = await Announcement.findByIdAndDelete(req.params.id);
  if (!ann) throw new AppError("Announcement not found", 404);
  await logAction(req.user, "DELETE_ANNOUNCEMENT", "announcement", ann._id, ann.title, "");
  res.json({ message: "Announcement deleted" });
}));

/* ─────────────────────────────────────────────────────────
   PASSWORD RESET FLOW
   POST /api/auth/forgot-password  → generate + return token
   POST /api/auth/reset-password/:token → hash + save new pw
───────────────────────────────────────────────────────── */
import crypto from "crypto";

// POST /forgot-password
router.post("/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required", 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  // Always respond 200 to avoid user-enumeration
  if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

  // Generate a cryptographically secure token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

  // In development, return the link directly so you can test without email config
  if (process.env.NODE_ENV !== "production") {
    return res.json({
      message: "Reset link generated (dev mode — link returned in response).",
      resetUrl,
    });
  }

  // In production, send email via nodemailer
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"CampusConnect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Your CampusConnect password reset link",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to send reset email. Try again later.", 500);
  }
}));

// POST /reset-password/:token
router.post("/reset-password/:token", asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw new AppError("Password must be at least 6 characters", 400);

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Reset link is invalid or has expired", 400);

  user.password             = await bcrypt.hash(password, 12);
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = undefined; // Invalidate all sessions
  await user.save();

  res.json({ message: "Password reset successfully. You can now log in." });
}));

export default router;

