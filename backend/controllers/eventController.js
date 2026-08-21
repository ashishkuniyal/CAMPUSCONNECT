import Event from '../models/Event.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Escape user input before using in RegExp to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const listEvents = async (req, res) => {
  try {
    const { q, category, sort = 'date', order = 'asc', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [{ title: new RegExp(safe, 'i') }, { description: new RegExp(safe, 'i') }];
    }
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = Event.find(filter).populate('createdBy', 'name email');
    if (sort === 'date') {
      query = query.sort({ date: order === 'asc' ? 1 : -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const [events, total] = await Promise.all([
      query.skip(skip).limit(parseInt(limit)).exec(),
      Event.countDocuments(filter),
    ]);

    res.json({
      events,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createEvent = async (req, res, io) => {
  try {
    const payload = req.body;
    let imageUrl = payload.image || null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'campusconnect' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const ev = await Event.create({
      title: payload.title,
      description: payload.description,
      date: payload.date ? new Date(payload.date) : null,
      location: payload.location,
      category: payload.category,
      image: imageUrl,
      createdBy: req.user._id,
      rsvpLimit: payload.rsvpLimit || null,
    });
    const populated = await Event.findById(ev._id).populate('createdBy', 'name email');
    io.emit('eventCreated', populated); // broadcast new events globally (needed for event listings)
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getEvent = async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name');
    if (!ev) return res.status(404).json({ message: 'Not found' });
    res.json(ev);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateEvent = async (req, res, io) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (!ev.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const payload = req.body;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'campusconnect' });
      ev.image = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    ev.title = payload.title ?? ev.title;
    ev.description = payload.description ?? ev.description;
    ev.date = payload.date ? new Date(payload.date) : ev.date;
    ev.location = payload.location ?? ev.location;
    ev.category = payload.category ?? ev.category;
    ev.rsvpLimit = payload.rsvpLimit ?? ev.rsvpLimit;
    await ev.save();
    const populated = await Event.findById(ev._id).populate('createdBy', 'name email');
    // Scoped emit — only notify clients watching this event's room
    io.to(String(ev._id)).emit('eventUpdated', populated);
    io.emit('eventUpdated', populated); // also update listings globally
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteEvent = async (req, res, io) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (!ev.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Use findByIdAndDelete — ev.remove() was removed in Mongoose 8
    await Event.findByIdAndDelete(req.params.id);
    io.to(String(ev._id)).emit('eventDeleted', { id: req.params.id });
    io.emit('eventDeleted', { id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const toggleRsvp = async (req, res, io) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    const idx = ev.attendees.findIndex(a => a.equals(req.user._id));
    if (idx >= 0) {
      ev.attendees.splice(idx, 1);
    } else {
      if (ev.rsvpLimit && ev.attendees.length >= ev.rsvpLimit) {
        return res.status(400).json({ message: 'Event full' });
      }
      ev.attendees.push(req.user._id);
    }
    await ev.save();
    const populated = await Event.findById(ev._id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name');
    io.to(String(ev._id)).emit('eventUpdated', populated);
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
