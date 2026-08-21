import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Event from "../models/Event.js";
import AuditLog from "../models/AuditLog.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import {
  createEventValidation,
  updateEventValidation,
  eventIdValidation,
  paginationValidation,
  searchValidation
} from "../middleware/validators.js";
import { createEventLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

// Escape user input before using in RegExp to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

export default function eventRoutesFactory(io) {
  const router = express.Router();

  // Upload event banner image file (Protected)
  router.post("/upload", protect, upload.single("image"), asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No image file provided", 400);
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  }));

  // Get all events with pagination, search, and optional creator filter
  router.get("/", optionalAuth, paginationValidation, searchValidation, asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = "-createdAt", q, category, tag, createdBy } = req.query;
    
    const query = {};
    if (q) {
      const safe = escapeRegex(q);
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (tag) {
      // Tags are an array of strings. Mongo matches if the array contains the exact value.
      query.tags = tag;
    }
    // ?createdBy=me returns only the authenticated user's created events
    if (createdBy === "me" && req.user) {
      query.creator = req.user._id;
    }
    
    // ?rsvpedBy=me returns only the events the authenticated user has RSVP'd to
    if (req.query.rsvpedBy === "me" && req.user) {
      query.attendees = req.user._id;
    }

    const events = await Event.find(query)
      .populate('creator', 'name email')
      .populate('attendees', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single event by ID
  router.get("/:id", eventIdValidation, asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('attendees', 'name email');
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    res.json(event);
  }));

  // Create new event (Protected)
  router.post("/", protect, createEventLimiter, createEventValidation, asyncHandler(async (req, res) => {
    const { title, description, date, location, category, tags, imageUrl, image } = req.body;
    const event = new Event({ 
      title, 
      description, 
      date, 
      location,
      category,
      tags,
      imageUrl: imageUrl || image || "",
      creator: req.user._id
    });
    await event.save();
    io.emit("newEvent", event);
    res.status(201).json(event);
  }));

  // Update event (Protected)
  router.put("/:id", protect, updateEventValidation, asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if user is the creator or admin
    if (event.creator?.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to update this event", 403);
    }

    const updatePayload = { ...req.body };
    if (req.body.image && !req.body.imageUrl) {
      updatePayload.imageUrl = req.body.image;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    // Scope to event room; also broadcast globally for listings refresh
    io.to(String(req.params.id)).emit("eventUpdated", updatedEvent);
    io.emit("eventUpdated", updatedEvent);
    res.json(updatedEvent);
  }));


  // Delete event (Protected)
  router.delete("/:id", protect, eventIdValidation, asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if user is the creator or admin
    if (event.creator?.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this event", 403);
    }

    await Event.findByIdAndDelete(req.params.id);
    // Notify clients in the event room, then broadcast globally
    io.to(String(req.params.id)).emit("eventDeleted", req.params.id);
    io.emit("eventDeleted", req.params.id);
    res.json({ message: "Event deleted successfully" });
  }));


  // ✅ Admin: Approve or reject event
  router.patch("/:id/approve", protect, authorize("admin"), asyncHandler(async (req, res) => {
    const { approvalStatus, rejectionReason } = req.body;
    if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
      throw new AppError("Invalid approval status", 400);
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { approvalStatus, rejectionReason: rejectionReason || "" },
      { new: true }
    );
    if (!event) throw new AppError("Event not found", 404);

    try {
      await AuditLog.create({
        adminId:    req.user._id,
        adminName:  req.user.name,
        action:     approvalStatus === "approved" ? "APPROVE_EVENT" : "REJECT_EVENT",
        targetType: "event",
        targetId:   event._id.toString(),
        targetName: event.title,
        details:    rejectionReason || "",
      });
    } catch (e) { console.error("Audit log error:", e.message); }

    io.to(String(event._id)).emit("eventUpdated", event);
    io.emit("eventUpdated", event);
    res.json(event);
  }));

  // ✅ Admin: Export all events as JSON
  router.get("/export", protect, authorize("admin"), asyncHandler(async (req, res) => {
    const events = await Event.find()
      .populate("creator", "name email")
      .sort("-createdAt");
    res.json(events);
  }));

  return router;
}
