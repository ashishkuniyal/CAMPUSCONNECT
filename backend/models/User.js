import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  department: { type: String, default: "" },
  year: { type: String, default: "" },
  github: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  skills: { type: [String], default: [] },
  alerts: { type: [String], default: [] },
  preferences: { type: [String], default: [] },
  role: { type: String, enum: ["student", "organizer", "admin"], default: "student" },
  refreshToken: { type: String },
  lastLogin: { type: Date },
  suspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: "" },
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date,   select: false },
}, { timestamps: true });

// Indexes for frequent query patterns
userSchema.index({ email: 1 }, { unique: true });     // fast login lookup (already unique, this makes it explicit)
userSchema.index({ role: 1 });                         // admin user list filtering
userSchema.index({ suspended: 1 });                   // admin suspension queries
userSchema.index({ lastLogin: -1 });                   // active-user analytics

export default mongoose.model("User", userSchema);
