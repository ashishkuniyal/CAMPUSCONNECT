import express from "express";
import axios from "axios";

const router = express.Router();

// Simple in-memory cache to avoid hammering APIs
const cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/* ===========================================================
   🧩 Hackathons — Devpost public API (live, open events)
=========================================================== */
const fetchHackathons = async () => {
  try {
    const { data } = await axios.get("https://devpost.com/api/hackathons", {
      params: {
        "status[]": "open",
        order_by: "deadline",
        per_page: 12,
      },
      headers: { Accept: "application/json" },
      timeout: 15000,
    });

    return (data.hackathons || []).map((h) => {
      // Strip HTML from prize_amount
      const prize = (h.prize_amount || "")
        .replace(/<[^>]+>/g, "")
        .trim();

      const themes = (h.themes || []).map((t) => t.name).slice(0, 3);

      return {
        id: `devpost-${h.id}`,
        title: h.title,
        link: h.url,
        image: h.thumbnail_url?.startsWith("//")
          ? `https:${h.thumbnail_url}`
          : h.thumbnail_url || null,
        deadline: h.submission_period_dates || "TBA",
        timeLeft: h.time_left_to_submission || null,
        source: h.organization_name || "Devpost",
        location: h.displayed_location?.location || "Online",
        prize: prize && prize !== "$0" ? prize : null,
        registrations: h.registrations_count || 0,
        tags: themes,
        type: "Hackathon",
        platform: "Devpost",
      };
    });
  } catch (err) {
    console.error("❌ Devpost API error:", err.message);
    return [];
  }
};

/* ===========================================================
   💼 Internships — Adzuna API (India, real-time listings)
=========================================================== */
const fetchInternships = async () => {
  const APP_ID  = process.env.ADZUNA_APP_ID;
  const APP_KEY = process.env.ADZUNA_APP_KEY;

  if (!APP_ID || !APP_KEY) {
    console.warn("⚠️  Adzuna credentials missing — using curated fallback");
    return getCuratedInternships();
  }

  try {
    // Fetch across multiple keywords for variety
    const queries = ["software intern", "data intern", "web developer intern", "engineering intern"];

    const requests = queries.map((q) =>
      axios.get(`https://api.adzuna.com/v1/api/jobs/in/search/1`, {
        params: {
          app_id: APP_ID,
          app_key: APP_KEY,
          results_per_page: 6,
          what: q,
          sort_by: "date",
        },
        timeout: 12000,
      }).catch(() => ({ data: { results: [] } }))
    );

    const responses = await Promise.all(requests);

    // Deduplicate by job id
    const seen = new Set();
    const internships = [];

    for (const res of responses) {
      for (const job of (res.data?.results || [])) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);

        const postedDate = job.created
          ? new Date(job.created).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })
          : "Recent";

        // Extract clean description snippet (strip HTML)
        const desc = (job.description || "")
          .replace(/<[^>]+>/g, "")
          .slice(0, 80)
          .trim();

        const salary = job.salary_min
          ? `₹${Math.round(job.salary_min / 1000)}K+/yr`
          : null;

        internships.push({
          id: `adzuna-${job.id}`,
          title: job.title,
          link: job.redirect_url,
          image: null, // Adzuna doesn't provide logos
          deadline: postedDate,
          timeLeft: job.contract_time === "full_time" ? "Full-time" : job.contract_time || "Internship",
          source: job.company?.display_name || "Company",
          location: job.location?.display_name || "India",
          prize: salary,
          registrations: null,
          tags: [job.category?.label || "Tech"].slice(0, 3),
          type: "Internship",
          platform: "Adzuna",
          description: desc,
        });

        if (internships.length >= 12) break;
      }
      if (internships.length >= 12) break;
    }

    if (internships.length === 0) throw new Error("No results from Adzuna");
    console.log(`✅ Fetched ${internships.length} internships from Adzuna`);
    return internships;
  } catch (err) {
    console.error("❌ Adzuna error:", err.message);
    return getCuratedInternships();
  }
};

// Curated fallback if API fails
const getCuratedInternships = () => [
  {
    id: "intern-google",
    title: "Google STEP Internship 2025",
    link: "https://buildyourfuture.withgoogle.com/programs/step",
    image: "https://www.gstatic.com/images/branding/product/2x/google_g_logo_64dp.png",
    deadline: "Rolling",
    timeLeft: "Apply Now",
    source: "Google",
    location: "Global",
    prize: "$7,500–$11,000/mo",
    registrations: null,
    tags: ["STEP", "SWE", "Google"],
    type: "Internship",
    platform: "Google Careers",
  },
  {
    id: "intern-microsoft",
    title: "Microsoft Explore Internship",
    link: "https://careers.microsoft.com/students/us/en/usexplorejob",
    image: null,
    deadline: "Rolling",
    timeLeft: "Apply Now",
    source: "Microsoft",
    location: "Global",
    prize: "$7,000–$10,000/mo",
    registrations: null,
    tags: ["Explore", "PM", "SWE"],
    type: "Internship",
    platform: "Microsoft Careers",
  },
  {
    id: "intern-internshala",
    title: "7,000+ Tech Internships on Internshala",
    link: "https://internshala.com/internships/computer-science-internship/",
    image: null,
    deadline: "Ongoing",
    timeLeft: "Live listings",
    source: "Internshala",
    location: "India",
    prize: "₹5K–₹30K/mo",
    registrations: null,
    tags: ["Web Dev", "Data Science", "ML"],
    type: "Internship",
    platform: "Internshala",
  },
  {
    id: "intern-unstop",
    title: "Campus Internships on Unstop",
    link: "https://unstop.com/internships",
    image: null,
    deadline: "Ongoing",
    timeLeft: "Live listings",
    source: "Unstop",
    location: "India",
    prize: "Paid + Stipend",
    registrations: null,
    tags: ["Campus", "Tech", "Marketing"],
    type: "Internship",
    platform: "Unstop",
  },
];

/* ===========================================================
   🏆 Contests — Curated live coding contest platforms
=========================================================== */
const fetchContests = async () => {
  // These are real, permanently active contest portals
  return [
    {
      id: "contest-lc-weekly",
      title: "LeetCode Weekly Contest",
      link: "https://leetcode.com/contest/",
      image: "https://leetcode.com/static/images/LeetCode_logo_rvs.png",
      deadline: "Every Sunday 8:00 AM UTC",
      timeLeft: "Recurring weekly",
      source: "LeetCode",
      location: "Online",
      prize: "LeetCode Points + Badge",
      registrations: null,
      tags: ["Algorithms", "Data Structures", "Competitive"],
      type: "Contest",
      platform: "LeetCode",
    },
    {
      id: "contest-cf-rounds",
      title: "Codeforces Rounds",
      link: "https://codeforces.com/contests",
      image: "https://codeforces.org/s/0/images/codeforces-sponsored-by-ton.png",
      deadline: "Multiple per week",
      timeLeft: "Check schedule",
      source: "Codeforces",
      location: "Online",
      prize: "Rating Points",
      registrations: null,
      tags: ["Competitive Programming", "Algorithms", "Math"],
      type: "Contest",
      platform: "Codeforces",
    },
    {
      id: "contest-cc-long",
      title: "CodeChef Long Challenge",
      link: "https://www.codechef.com/contests",
      image: "https://cdn.codechef.com/images/cc-logo.svg",
      deadline: "Monthly",
      timeLeft: "Check schedule",
      source: "CodeChef",
      location: "Online",
      prize: "Stars + Rating",
      registrations: null,
      tags: ["Competitive", "Monthly Challenge", "DSA"],
      type: "Contest",
      platform: "CodeChef",
    },
    {
      id: "contest-hr",
      title: "HackerRank Competitions",
      link: "https://www.hackerrank.com/contests",
      image: "https://hrcdn.net/fcore/assets/brand/logo-new-white-green-a5cb16e0ae.svg",
      deadline: "Ongoing",
      timeLeft: "Multiple active",
      source: "HackerRank",
      location: "Online",
      prize: "Certificates + Badges",
      registrations: null,
      tags: ["Problem Solving", "SQL", "Python"],
      type: "Contest",
      platform: "HackerRank",
    },
    {
      id: "contest-atcoder",
      title: "AtCoder Beginner Contest",
      link: "https://atcoder.jp/contests/",
      image: "https://img.atcoder.jp/assets/atcoder.png",
      deadline: "Every Saturday",
      timeLeft: "Recurring weekly",
      source: "AtCoder",
      location: "Online",
      prize: "Rating Points",
      registrations: null,
      tags: ["Beginner Friendly", "Algorithms", "Japan"],
      type: "Contest",
      platform: "AtCoder",
    },
    {
      id: "contest-kaggle",
      title: "Kaggle Active Competitions",
      link: "https://www.kaggle.com/competitions",
      image: "https://www.kaggle.com/static/images/site-logo.svg",
      deadline: "Various",
      timeLeft: "Multiple active",
      source: "Kaggle",
      location: "Online",
      prize: "Up to $100,000",
      registrations: null,
      tags: ["Machine Learning", "Data Science", "AI"],
      type: "Contest",
      platform: "Kaggle",
    },
  ];
};

/* ===========================================================
   🎉 Fests — Devpost "workshop/conference" themed events
      + curated real Indian college fests (no public API exists)
=========================================================== */
const fetchFests = async () => {
  let devpostFests = [];

  try {
    // Devpost events tagged as "Open Source", "Social Good", "Education" = fest-like
    const { data } = await axios.get("https://devpost.com/api/hackathons", {
      params: {
        "status[]": "open",
        "theme_names[]": "Education",
        order_by: "deadline",
        per_page: 6,
      },
      headers: { Accept: "application/json" },
      timeout: 12000,
    });

    devpostFests = (data.hackathons || []).map((h) => {
      const prize = (h.prize_amount || "").replace(/<[^>]+>/g, "").trim();
      return {
        id: `devpost-fest-${h.id}`,
        title: h.title,
        link: h.url,
        image: h.thumbnail_url?.startsWith("//") ? `https:${h.thumbnail_url}` : h.thumbnail_url || null,
        deadline: h.submission_period_dates || "TBA",
        timeLeft: h.time_left_to_submission || "Open",
        source: h.organization_name || "Devpost",
        location: h.displayed_location?.location || "Online",
        prize: prize && prize !== "$0" ? prize : null,
        registrations: h.registrations_count || 0,
        tags: (h.themes || []).map((t) => t.name).slice(0, 3),
        type: "Fest",
        platform: "Devpost",
      };
    });
  } catch (err) {
    console.error("❌ Devpost fests error:", err.message);
  }

  // Curated Indian college fests — no public API exists for these
  const curatedFests = [
    {
      id: "fest-techfest",
      title: "Techfest 2026 – IIT Bombay",
      link: "https://www.techfest.org/",
      image: null,
      deadline: "December 2025",
      timeLeft: "Registrations open",
      source: "IIT Bombay",
      location: "Mumbai, India",
      prize: "₹1 Crore+ Prize Pool",
      registrations: null,
      tags: ["Tech Fest", "Robotics", "AI"],
      type: "Fest",
      platform: "Techfest",
    },
    {
      id: "fest-shaastra",
      title: "Shaastra 2026 – IIT Madras",
      link: "https://www.shaastra.org/",
      image: null,
      deadline: "January 2026",
      timeLeft: "Registrations open",
      source: "IIT Madras",
      location: "Chennai, India",
      prize: "₹50 Lakh+ Prize Pool",
      registrations: null,
      tags: ["Tech Fest", "Science", "Engineering"],
      type: "Fest",
      platform: "Shaastra",
    },
    {
      id: "fest-moodi",
      title: "Mood Indigo 2025 – IIT Bombay",
      link: "https://moodi.org/",
      image: null,
      deadline: "December 2025",
      timeLeft: "Registrations open",
      source: "IIT Bombay",
      location: "Mumbai, India",
      prize: "Cultural Grand Prizes",
      registrations: null,
      tags: ["Cultural", "Music", "Dance"],
      type: "Fest",
      platform: "Mood Indigo",
    },
    {
      id: "fest-waves",
      title: "Waves 2026 – BITS Pilani Goa",
      link: "https://www.bits-waves.org/",
      image: null,
      deadline: "February 2026",
      timeLeft: "Coming soon",
      source: "BITS Goa",
      location: "Goa, India",
      prize: "Cash + Goodies",
      registrations: null,
      tags: ["Cultural", "Music", "Comedy"],
      type: "Fest",
      platform: "Waves",
    },
    {
      id: "fest-saarang",
      title: "Saarang 2026 – IIT Madras",
      link: "https://saarang.org/",
      image: null,
      deadline: "January 2026",
      timeLeft: "Coming soon",
      source: "IIT Madras",
      location: "Chennai, India",
      prize: "South India's Largest Fest",
      registrations: null,
      tags: ["Cultural", "Arts", "Music"],
      type: "Fest",
      platform: "Saarang",
    },
    {
      id: "fest-alcheringa",
      title: "Alcheringa 2026 – IIT Guwahati",
      link: "https://alcheringa.in/",
      image: null,
      deadline: "February 2026",
      timeLeft: "Coming soon",
      source: "IIT Guwahati",
      location: "Guwahati, India",
      prize: "NE India's Largest Fest",
      registrations: null,
      tags: ["Cultural", "Dance", "Theatre"],
      type: "Fest",
      platform: "Alcheringa",
    },
  ];

  // Merge: Devpost live events first, then curated
  const combined = [...devpostFests, ...curatedFests].slice(0, 12);
  console.log(`✅ Fests: ${devpostFests.length} live + ${curatedFests.length} curated`);
  return combined;
};

/* ===========================================================
   🌐 Main route — combine all sources with caching
=========================================================== */
router.get("/fetch", async (req, res) => {
  try {
    // Serve from cache if fresh
    if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL) {
      console.log("⚡ Serving aggregator from cache");
      return res.json(cache.data);
    }

    console.log("🔄 Fetching fresh aggregator data...");

    const [hackathons, internships, contests, fests] = await Promise.allSettled([
      fetchHackathons(),
      fetchInternships(),
      fetchContests(),
      fetchFests(),
    ]);

    const combined = [
      ...(hackathons.status === "fulfilled" ? hackathons.value : []),
      ...(internships.status === "fulfilled" ? internships.value : []),
      ...(contests.status === "fulfilled" ? contests.value : []),
      ...(fests.status === "fulfilled" ? fests.value : []),
    ];

    // Update cache
    cache.data = combined;
    cache.fetchedAt = Date.now();

    console.log(`✅ Aggregator: ${combined.length} total opportunities`);
    res.json(combined);
  } catch (err) {
    console.error("❌ Aggregator error:", err.message);
    res.status(500).json({ message: "Failed to fetch opportunities" });
  }
});

/* ===========================================================
   🔍 Filter by type
=========================================================== */
router.get("/fetch/:type", async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const typeMap = {
      hackathon: fetchHackathons,
      internship: fetchInternships,
      contest: fetchContests,
      fest: fetchFests,
    };

    const fetcher = typeMap[type];
    if (!fetcher) {
      return res.status(400).json({ message: "Invalid type. Use: hackathon, internship, contest, fest" });
    }

    const data = await fetcher();
    res.json(data);
  } catch (err) {
    console.error(`❌ Error fetching ${req.params.type}:`, err.message);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

export default router;
