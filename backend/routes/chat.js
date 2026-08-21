import express from "express";
import Message from "../models/Message.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  sendMessageValidation,
  getMessagesValidation
} from "../middleware/validators.js";
import { messageLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Get messages for an event or channel
router.get("/:eventId", optionalAuth, getMessagesValidation, async (req, res) => {
  try {
    const messages = await Message.find({ eventId: req.params.eventId })
      .populate("user", "name email role")
      .sort({ createdAt: 1 })
      .limit(150);
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/", protect, messageLimiter, sendMessageValidation, async (req, res) => {
  try {
    const { eventId, text } = req.body;

    const message = new Message({
      eventId,
      user: req.user._id,
      text
    });

    await message.save();
    await message.populate("user", "name email role");

    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a message (author or admin only)
router.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const isOwner = message.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: "Message deleted", id: req.params.messageId, eventId: message.eventId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

