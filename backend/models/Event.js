import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String },
  tags: { type: [String], default: [] },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  imageUrl: { type: String },
  approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
  rejectionReason: { type: String, default: "" }
}, { timestamps: true });

// Indexes for frequent query patterns
eventSchema.index({ date: 1 });                          // sort by upcoming date
eventSchema.index({ category: 1 });                      // category filter
eventSchema.index({ approvalStatus: 1 });                // admin approval queue
eventSchema.index({ creator: 1 });                       // "my events" queries
eventSchema.index({ title: 'text', description: 'text' }); // text search fallback

export default mongoose.model("Event", eventSchema);

