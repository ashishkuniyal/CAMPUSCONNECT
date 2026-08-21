import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient } from "../utils/useApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, MapPin, Clock, Users, Trophy,
  ExternalLink, Search, Briefcase, Code2, PartyPopper,
  Zap, Globe, TrendingUp, ArrowUpRight, Calendar,
  Flame, Layers
} from "lucide-react";

/* ─── Type definitions ────────────────────────────────── */
const T = {
  Hackathon: {
    gradient:  "from-violet-600 to-indigo-600",
    gradientSoft: "from-violet-600/20 to-indigo-600/20",
    border:    "border-violet-500/25 hover:border-violet-400/50",
    glow:      "hover:shadow-violet-500/15",
    badge:     "bg-violet-500/20 text-violet-300 border-violet-400/30",
    statBg:    "bg-violet-500/10 border-violet-500/20",
    statIcon:  "text-violet-400",
    accentBar: "from-violet-500 to-indigo-500",
    btnGrad:   "from-violet-500 to-indigo-600",
    btnGlow:   "hover:shadow-violet-500/40",
    icon:      <Code2 size={14}/>,
    bigIcon:   <Code2 size={20}/>,
    emoji:     "💻",
    label:     "Hackathons",
  },
  Internship: {
    gradient:  "from-emerald-600 to-teal-600",
    gradientSoft: "from-emerald-600/20 to-teal-600/20",
    border:    "border-emerald-500/25 hover:border-emerald-400/50",
    glow:      "hover:shadow-emerald-500/15",
    badge:     "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    statBg:    "bg-emerald-500/10 border-emerald-500/20",
    statIcon:  "text-emerald-400",
    accentBar: "from-emerald-500 to-teal-500",
    btnGrad:   "from-emerald-500 to-teal-600",
    btnGlow:   "hover:shadow-emerald-500/40",
    icon:      <Briefcase size={14}/>,
    bigIcon:   <Briefcase size={20}/>,
    emoji:     "💼",
    label:     "Internships",
  },
  Contest: {
    gradient:  "from-amber-500 to-orange-600",
    gradientSoft: "from-amber-500/20 to-orange-600/20",
    border:    "border-amber-500/25 hover:border-amber-400/50",
    glow:      "hover:shadow-amber-500/15",
    badge:     "bg-amber-500/20 text-amber-300 border-amber-400/30",
    statBg:    "bg-amber-500/10 border-amber-500/20",
    statIcon:  "text-amber-400",
    accentBar: "from-amber-500 to-orange-500",
    btnGrad:   "from-amber-500 to-orange-600",
    btnGlow:   "hover:shadow-amber-500/40",
    icon:      <Trophy size={14}/>,
    bigIcon:   <Trophy size={20}/>,
    emoji:     "🏆",
    label:     "Contests",
  },
  Fest: {
    gradient:  "from-pink-600 to-rose-600",
    gradientSoft: "from-pink-600/20 to-rose-600/20",
    border:    "border-pink-500/25 hover:border-pink-400/50",
    glow:      "hover:shadow-pink-500/15",
    badge:     "bg-pink-500/20 text-pink-300 border-pink-400/30",
    statBg:    "bg-pink-500/10 border-pink-500/20",
    statIcon:  "text-pink-400",
    accentBar: "from-pink-500 to-rose-500",
    btnGrad:   "from-pink-500 to-rose-600",
    btnGlow:   "hover:shadow-pink-500/40",
    icon:      <PartyPopper size={14}/>,
    bigIcon:   <PartyPopper size={20}/>,
    emoji:     "🎉",
    label:     "Fests",
  },
};

const FILTERS = ["All", "Hackathon", "Internship", "Contest", "Fest"];

/* ─── Company avatar ──────────────────────────────────── */
function Avatar({ name, cfg }) {
  const letters = (name || "?")
    .split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient}
                     flex items-center justify-center text-white font-bold text-xs
                     flex-shrink-0 shadow-md`}>
      {letters}
    </div>
  );
}

/* ─── Card ────────────────────────────────────────────── */
function Card({ item }) {
  const cfg = T[item.type] || T.Hackathon;
  const [imgErr, setImgErr] = useState(false);
  const hasImg = item.image && !imgErr;

  return (
    <motion.article
      variants={{
        hidden:  { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } }
      }}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c0c18]
                  border ${cfg.border} shadow-xl ${cfg.glow}
                  hover:-translate-y-1.5 transition-all duration-300`}
    >
      {/* ── Image / Hero ── */}
      <div className="relative h-[140px] flex-shrink-0 overflow-hidden">
        {/* colored gradient base */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-80`} />
        {/* noise texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
        {/* real image */}
        {hasImg && (
          <img src={item.image} alt={item.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70
                       group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            onError={() => setImgErr(true)}
          />
        )}
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c18] via-transparent to-transparent" />

        {/* top-left: type badge */}
        <span className={`absolute top-3 left-3 flex items-center gap-1.5
                          px-2.5 py-1 rounded-full border text-[11px] font-semibold
                          backdrop-blur-md ${cfg.badge}`}>
          {cfg.icon} {item.type}
        </span>

        {/* top-right: time left */}
        {item.timeLeft && (
          <span className="absolute top-3 right-3 flex items-center gap-1
                           px-2 py-1 rounded-full bg-black/60 backdrop-blur-md
                           border border-white/10 text-[11px] text-white/75 font-medium">
            <Zap size={9} className="text-yellow-400" />
            {item.timeLeft}
          </span>
        )}

        {/* bottom-right: registrations */}
        {item.registrations != null && (
          <span className="absolute bottom-2.5 right-3 flex items-center gap-1
                           text-[10px] text-white/40 font-medium">
            <Users size={9} /> {item.registrations.toLocaleString()}
          </span>
        )}

        {/* bottom-left: platform */}
        <span className="absolute bottom-2.5 left-3 text-[10px] text-white/35
                         uppercase tracking-wider font-semibold">
          {item.platform}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* company row */}
        <div className="flex items-center gap-2.5">
          <Avatar name={item.source} cfg={cfg} />
          <div className="min-w-0 flex-1">
            <p className="text-white/85 font-semibold text-[13px] truncate">{item.source}</p>
            <p className="text-gray-600 text-[11px] flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={9} className="flex-shrink-0" /> {item.location}
            </p>
          </div>
          {/* prize badge inline */}
          {item.prize && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0
                             bg-amber-500/10 border border-amber-500/20
                             text-[11px] text-amber-300 font-bold whitespace-nowrap">
              <Trophy size={9} /> {item.prize}
            </span>
          )}
        </div>

        {/* title */}
        <h3 className="text-white font-bold text-[14px] leading-snug line-clamp-2 min-h-[2.5rem]">
          {item.title}
        </h3>

        {/* description */}
        {item.description && (
          <p className="text-gray-600 text-[12px] leading-relaxed line-clamp-2">
            {item.description}…
          </p>
        )}

        {/* deadline + tags row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <Calendar size={10} /> {item.deadline}
          </span>
          {item.tags?.slice(0, 2).map(tag => (
            <span key={tag}
              className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/8
                         text-[10px] text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`mt-1 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
                      text-[13px] font-bold text-white tracking-wide
                      bg-gradient-to-r ${cfg.btnGrad}
                      hover:opacity-90 hover:shadow-lg ${cfg.btnGlow}
                      transition-all duration-200`}
        >
          {item.type === "Internship" ? "Apply Now" : "Visit Site"}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </motion.article>
  );
}

/* ─── Skeleton ────────────────────────────────────────── */
const Skeleton = () => (
  <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0c0c18] animate-pulse">
    <div className="h-[140px] bg-white/[0.06]" />
    <div className="p-4 space-y-3">
      <div className="flex gap-2.5 items-center">
        <div className="w-9 h-9 rounded-xl bg-white/[0.08]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/[0.08] rounded w-3/5" />
          <div className="h-2 bg-white/[0.05] rounded w-2/5" />
        </div>
      </div>
      <div className="h-3.5 bg-white/[0.08] rounded" />
      <div className="h-3.5 bg-white/[0.05] rounded w-4/5" />
      <div className="h-9 bg-white/[0.08] rounded-xl mt-2" />
    </div>
  </div>
);

/* ─── Stat card ───────────────────────────────────────── */
function StatCard({ type, count, active, onClick }) {
  const cfg = T[type];
  return (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-4 text-left
                  transition-all duration-200 hover:-translate-y-0.5
                  ${active
                    ? `${cfg.statBg} ${cfg.border} shadow-lg`
                    : "bg-[#0c0c18] border-white/8 hover:border-white/15"
                  }`}
    >
      {/* top accent line */}
      <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${cfg.accentBar}
                       ${active ? "opacity-100" : "opacity-40"}`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${cfg.gradient} bg-opacity-20 flex-shrink-0`}>
          <span className={cfg.statIcon}>{cfg.bigIcon}</span>
        </div>
        <TrendingUp size={13} className={active ? cfg.statIcon : "text-gray-700"} />
      </div>

      <p className="text-3xl font-black text-white tabular-nums">{count}</p>
      <p className={`text-xs font-medium mt-0.5 ${active ? cfg.statIcon : "text-gray-600"}`}>
        {cfg.label}
      </p>
    </button>
  );
}

/* ─── Main ────────────────────────────────────────────── */
export default function Aggregator() {
  const [data, setData]         = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [updatedAt, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await apiClient.get("/aggregator/fetch");
      setData(res);
      setUpdated(new Date());
    } catch {
      setError("Failed to fetch. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { Hackathon: 0, Internship: 0, Contest: 0, Fest: 0 };
    data.forEach(d => { if (c[d.type] !== undefined) c[d.type]++; });
    return c;
  }, [data]);

  const filtered = useMemo(() => data.filter(item => {
    if (filter !== "All" && item.type !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q) ||
      item.tags?.some(t => t.toLowerCase().includes(q))
    );
  }), [data, filter, search]);

  const handleTypeClick = (type) => setFilter(f => f === type ? "All" : type);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24">

      {/* ── Header ── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-8 border border-white/5
                      bg-gradient-to-br from-[#0d0d1a] to-[#090910]">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                               bg-violet-500/15 border border-violet-500/25 text-violet-300">
                <Flame size={11} className="text-orange-400" /> Live Opportunities
              </span>
              {updatedAt && (
                <span className="text-gray-700 text-xs">
                  · {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Global{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400
                               bg-clip-text text-transparent">
                Opportunities
              </span>
            </h1>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Hackathons, internships, contests &amp; fests — aggregated live from
              Devpost, Adzuna, and more.
            </p>
          </div>

          <button onClick={load} disabled={loading}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm text-white
                       bg-gradient-to-r from-violet-500 to-indigo-600
                       hover:opacity-90 hover:shadow-xl hover:shadow-violet-500/30
                       disabled:opacity-40 transition-all">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(["Hackathon", "Internship", "Contest", "Fest"]).map(type => (
            <StatCard
              key={type}
              type={type}
              count={counts[type]}
              active={filter === type}
              onClick={() => handleTypeClick(type)}
            />
          ))}
        </div>
      )}

      {/* ── Search + filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, company, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-[13px] text-white
                       placeholder-gray-700 bg-[#0c0c18] border border-white/8
                       focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20
                       transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300
                         text-lg leading-none transition-colors">
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map(f => {
            const isActive = filter === f;
            const count    = f === "All" ? data.length : counts[f] || 0;
            const cfg      = T[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px]
                            font-bold border whitespace-nowrap flex-shrink-0 transition-all
                            ${isActive
                              ? cfg
                                ? `bg-gradient-to-r ${cfg.btnGrad} text-white border-transparent shadow-lg`
                                : "bg-white/15 text-white border-transparent"
                              : "bg-[#0c0c18] text-gray-500 border-white/8 hover:text-gray-200 hover:border-white/15"
                            }`}
              >
                {f === "All" ? <Layers size={13}/> : cfg?.icon}
                {f}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black
                  ${isActive ? "bg-white/25 text-white" : "bg-white/5 text-gray-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-2xl p-12 text-center border border-red-500/15 bg-red-500/[0.04]">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-400 text-sm mb-5">{error}</p>
          <button onClick={load}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                       rounded-xl text-sm font-bold">
            Try Again
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          <AnimatePresence>
            {filtered.map((item, i) => <Card key={item.id ?? i} item={item} />)}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && data.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl p-16 text-center border border-white/5 bg-[#0c0c18]">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-bold text-white mb-1">No results found</h3>
          <p className="text-gray-600 text-sm mb-6">Try adjusting your search or filter.</p>
          <div className="flex gap-3 justify-center">
            {search && (
              <button onClick={() => setSearch("")}
                className="px-5 py-2 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition">
                Clear Search
              </button>
            )}
            <button onClick={() => setFilter("All")}
              className="px-5 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-xl text-sm font-bold">
              View All
            </button>
          </div>
        </div>
      )}

      {/* ── Footer count ── */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-gray-700 text-xs mt-10">
          Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of{" "}
          <span className="text-gray-400 font-semibold">{data.length}</span> opportunities
        </p>
      )}
    </div>
  );
}
