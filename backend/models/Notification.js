import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["event_update", "event_deleted", "event_approved", "event_rejected", "rsvp_confirmed", "announcement", "system"],
    required: true
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String },          // e.g. /event/:id
  read:    { type: Boolean, default: false, index: true },
  relatedId: { type: String },        // eventId or announcementId
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
