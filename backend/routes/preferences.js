import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { updatePreferencesValidation } from "../middleware/validators.js";

const router = express.Router();

/**
 * Get user preferences (Protected)
 */
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("preferences skills alerts");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      preferences: user.preferences || [],
      skills: user.skills || [],
      alerts: user.alerts || []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Update user preferences (Protected)
 */
router.put("/", protect, updatePreferencesValidation, async (req, res) => {
  try {
    const { preferences, skills, alerts } = req.body;

    const updateData = {};
    if (preferences !== undefined) updateData.preferences = preferences;
    if (skills !== undefined) updateData.skills = skills;
    if (alerts !== undefined) updateData.alerts = alerts;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("preferences skills alerts");

    res.json({
      message: "Preferences updated successfully",
      preferences: user.preferences,
      skills: user.skills,
      alerts: user.alerts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
