import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

const router = express.Router();

// GET /api/notifications — current user's notifications (newest first, max 50)
router.get("/", protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.json({ notifications, unreadCount });
}));

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", protect, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ message: "All notifications marked as read" });
}));

// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!notif) throw new AppError("Notification not found", 404);
  res.json(notif);
}));

// DELETE /api/notifications/:id — delete one notification
router.delete("/:id", protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });
  if (!notif) throw new AppError("Notification not found", 404);
  res.json({ message: "Deleted" });
}));

export default router;
