import express from "express";
import User from "../models/User.js";
import axios from "axios";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// 🧠 Helper: Fetch opportunities from your existing aggregator endpoint
const getAggregatorData = async () => {
  try {
    const { data } = await axios.get("http://localhost:5000/api/aggregator/fetch");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Aggregator fetch failed:", err.message);
    return [];
  }
};

// 🎯 Route: Personalized recommendations (Protected)
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const prefs = user.preferences || [];
    const all = await getAggregatorData();

    // Filter opportunities based on preferences
    const recommended = all.filter((item) =>
      prefs.some((pref) =>
        (item.title || "").toLowerCase().includes(pref.toLowerCase())
      )
    );

    // If no personalized matches, return top 5 generic ones
    if (!recommended.length) {
      console.log("No matches found, returning fallback");
      return res.json(all.slice(0, 5));
    }

    res.json(recommended);
  } catch (err) {
    console.error("Recommendation Error:", err.message);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

export default router;
