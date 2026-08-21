import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  adminName:  { type: String, required: true },
  action:     { type: String, required: true }, // e.g. "DELETE_USER", "CHANGE_ROLE", "SUSPEND_USER"
  targetType: { type: String }, // "user" | "event" | "announcement" | "platform"
  targetId:   { type: String },
  targetName: { type: String },
  details:    { type: String },
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
