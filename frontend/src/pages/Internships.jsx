import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Search, 
  ExternalLink, 
  DollarSign, 
  Sparkles,
  Award,
  Filter
} from "lucide-react";

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/internships");
      setInternships(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading internships:", err);
    } finally {
      setLoading(false);
    }
  };

  // Collect unique skills
  const allSkills = ["All", ...Array.from(new Set(internships.flatMap((item) => item.skills || [])))].slice(0, 8);

  const filtered = internships.filter((item) => {
    const matchesQuery = 
      (item.title || "").toLowerCase().includes(query.toLowerCase()) ||
      (item.company || "").toLowerCase().includes(query.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(query.toLowerCase()) ||
      (item.skills || []).some(s => s.toLowerCase().includes(query.toLowerCase()));

    const matchesSkill = selectedSkill === "All" || (item.skills || []).includes(selectedSkill);
    return matchesQuery && matchesSkill;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="glass p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verified Campus Internships</h1>
            <p className="text-xs sm:text-sm text-gray-400">Curated software, AI, design, and core internships for students</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role, company, or tech..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Skill Filter Chips */}
      {allSkills.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {allSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedSkill === skill
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      {/* Internships Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-gray-400">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching latest opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-white/10 space-y-3 max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No internships found</h3>
          <p className="text-xs text-gray-400">Try broadening your search keywords or switching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((intern, i) => (
            <div
              key={intern.id || i}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-amber-500/40 transition-all shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                      {(intern.company || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight group-hover:text-amber-300 transition-colors line-clamp-1">
                        {intern.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {intern.company}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{intern.location || "Remote / On-site"}</span>
                  </div>
                  {intern.stipend && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      <span>{intern.stipend}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {intern.skills && intern.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {intern.skills.slice(0, 4).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10">
                <a
                  href={intern.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-200 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
