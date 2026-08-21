import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ["info", "warning", "success", "danger"], default: "info" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByName: { type: String },
  expiresAt: { type: Date },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);
