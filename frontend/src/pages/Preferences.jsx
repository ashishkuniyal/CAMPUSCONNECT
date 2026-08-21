import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ALL_SKILLS = [
  "AI/ML",
  "Web Development",
  "Data Science",
  "Cybersecurity",
  "Blockchain",
  "Cloud Computing",
  "Competitive Programming",
  "App Development",
  "UI/UX Design",
  "IoT"
];

export default function Preferences() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [selected, setSelected] = useState([]);

  const toggleSkill = (skill) => {
    setSelected((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const loadPrefs = async () => {
    try {
      const res = await axios.get(`/api/preferences/${user._id}`);
      setSelected(res.data || []);
    } catch {
      toast.error("Failed to load preferences");
    }
  };

  const savePrefs = async () => {
    try {
      await axios.post("/api/preferences", { userId: user._id, skills: selected });
      toast.success("Preferences updated!");
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  return (
    <div className="container" style={{ padding: "30px 0" }}>
      <h2 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
        🎯 Choose Your Interests
      </h2>
      <p className="small-muted" style={{ marginBottom: "20px" }}>
        These help us recommend hackathons and contests relevant to you.
      </p>

      <div className="grid">
        {ALL_SKILLS.map((skill) => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: selected.includes(skill)
                ? "2px solid #4f46e5"
                : "1px solid #ccc",
              background: selected.includes(skill) ? "#eef2ff" : "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {selected.includes(skill) ? "✅ " : ""}{skill}
          </button>
        ))}
      </div>

      <button
        onClick={savePrefs}
        className="btn"
        style={{ marginTop: "20px", display: "block" }}
      >
        Save Preferences
      </button>
    </div>
  );
}
