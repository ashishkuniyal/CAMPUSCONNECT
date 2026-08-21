import express from "express";
const router = express.Router();

// Mock internship data (replace later with scraped or API data)
router.get("/", (req, res) => {
  const internships = [
    {
      id: 1,
      title: "Data Science Intern",
      company: "TechNova",
      location: "Remote",
      skills: ["Python", "Machine Learning", "Pandas"],
      stipend: "₹10,000/month",
      link: "https://example.com/intern1",
    },
    {
      id: 2,
      title: "Frontend Developer Intern",
      company: "CodeCraft",
      location: "Bangalore",
      skills: ["React", "Tailwind", "JavaScript"],
      stipend: "₹8,000/month",
      link: "https://example.com/intern2",
    },
  ];
  res.json(internships);
});

export default router;
