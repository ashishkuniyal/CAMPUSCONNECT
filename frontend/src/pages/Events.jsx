import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { 
  Calendar, Search, Filter, MapPin, Users, Clock, 
  Grid, List, SlidersHorizontal, TrendingUp, X,
  ArrowUpDown, Plus, Sparkles
} from "lucide-react";
import useApi from "../utils/useApi";
import LoadingSpinner, { SkeletonCard } from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const CATEGORIES = [
  { value: "", label: "All Categories", icon: "🎯" },
  { value: "Hackathon", label: "Hackathon", icon: "💻" },
  { value: "Workshop", label: "Workshop", icon: "🛠️" },
  { value: "Seminar", label: "Seminar", icon: "🎓" },
  { value: "Fest", label: "Fest", icon: "🎉" },
  { value: "Competition", label: "Competition", icon: "🏆" },
  { value: "Meetup", label: "Meetup", icon: "👥" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Latest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "date", label: "Event Date (Upcoming)" },
  { value: "-date", label: "Event Date (Recent)" },
];

export default function Events() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState(() => searchParams.get("category") || "");
  const [tag, setTag] = useState(() => searchParams.get("tag") || "");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("eventsViewMode") || "grid");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Debounce search input — only update API query 350ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Persist view mode preference
  const setViewModePersisted = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem("eventsViewMode", mode);
  }, []);

  // Build query string — use debouncedSearch for API calls
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append("q", debouncedSearch);
  if (category) queryParams.append("category", category);
  if (tag) queryParams.append("tag", tag);
  queryParams.append("sort", sortBy);
  queryParams.append("limit", "50");

  const { data, loading, error, refetch } = useApi(
    `/events?${queryParams.toString()}`,
    { dependencies: [debouncedSearch, category, tag, sortBy] }
  );

  const events = data?.events || [];
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
  const pastEvents = events.filter(e => new Date(e.date) <= new Date());

  // Active filter count — uses raw searchQuery for immediate UI feedback
  const activeFilterCount = [searchQuery, category, tag].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCategory("");
    setTag("");
    setSortBy("-createdAt");
    navigate("/events"); // clears query params from URL
  };

  if (error) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <ErrorMessage
            error={error}
            title="Failed to Load Events"
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2
                           bg-gradient-to-r from-white via-violet-200 to-white
                           bg-clip-text text-transparent drop-shadow-lg">
              Discover Events
            </h1>
            <p className="text-gray-400 text-sm">
              {loading ? "Loading..." : `${events.length} events found`}
            </p>
          </div>
          
          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700
                       text-white font-black text-sm tracking-wide
                       shadow-[0_6px_20px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                       hover:shadow-[0_8px_28px_rgba(139,92,246,0.5)]
                       hover:scale-105 hover:-translate-y-0.5
                       transition-all duration-300
                       border border-violet-400/30
                       relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
            <Plus size={18} className="relative z-10 group-hover:rotate-90 transition-transform" />
            <span className="relative z-10">Create Event</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                        rounded-2xl p-4 sm:p-6 mb-6
                        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
          
          {/* Main Search Row */}
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10
                           rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 
                           focus:border-violet-500/50
                           text-white placeholder-gray-500 transition-all"
              />
            </div>
            
            {/* Category Dropdown */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white/[0.03] border border-white/10
                           rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50
                           text-white appearance-none cursor-pointer transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[200px]">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white/[0.03] border border-white/10
                           rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50
                           text-white appearance-none cursor-pointer transition-all"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                             bg-red-500/10 border border-red-500/30
                             text-red-400 text-sm font-semibold
                             hover:bg-red-500/20 transition-all">
                  <X size={14} />
                  Clear Filters ({activeFilterCount})
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-lg">
              <button
                onClick={() => setViewModePersisted("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/30"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
                title="Grid View">
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewModePersisted("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/30"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
                title="List View">
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === "grid" 
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Events Display */}
        {!loading && events.length > 0 && (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                  <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30
                                   text-green-400 text-sm font-bold">
                    {upcomingEvents.length}
                  </span>
                </div>
                
                <div className={viewMode === "grid" 
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"}>
                  {upcomingEvents.map((event, i) => (
                    <EventCard key={event._id} event={event} index={i} viewMode={viewMode} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-gray-500" />
                  <h2 className="text-2xl font-bold text-white">Past Events</h2>
                  <span className="px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30
                                   text-gray-400 text-sm font-bold">
                    {pastEvents.length}
                  </span>
                </div>
                
                <div className={viewMode === "grid" 
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"}>
                  {pastEvents.map((event, i) => (
                    <EventCard key={event._id} event={event} index={i} viewMode={viewMode} navigate={navigate} isPast />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                          rounded-2xl p-12 text-center
                          shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
            <Calendar className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Events Found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || category
                ? "Try adjusting your search or filter criteria to find more events"
                : "Be the first to create an event and start connecting with others!"}
            </p>
            <button
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                         border border-violet-500/30
                         text-white font-bold
                         hover:from-violet-600/40 hover:to-indigo-600/40
                         transition-all">
              <Plus size={18} />
              Create Your First Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Event Card Component ────────────────────────────── */
function EventCard({ event, index, viewMode, navigate, isPast = false }) {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  if (viewMode === "list") {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/event/${event._id}`)}
        className="w-full flex items-center gap-4 p-4 rounded-xl
                   bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08]
                   hover:border-white/[0.15] hover:bg-white/[0.02]
                   transition-all duration-300 group text-left">
        
        {/* Date Badge */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                        border border-violet-500/30 flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-violet-400 uppercase">
            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div className="text-xl font-black text-white">
            {eventDate.getDate()}
          </div>
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate group-hover:text-violet-300 transition-colors">
              {event.title}
            </h3>
            {event.category && (
              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30
                               text-violet-400 text-xs font-bold flex-shrink-0">
                {event.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-violet-400" />
              <span className="truncate">{event.location || "TBA"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} className="text-violet-400" />
              <span>{event.attendees?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isUpcoming ? (
          <span className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30
                           text-green-400 text-xs font-bold flex-shrink-0">
            Upcoming
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-lg bg-gray-500/20 border border-gray-500/30
                           text-gray-400 text-xs font-bold flex-shrink-0">
            Completed
          </span>
        )}
      </motion.button>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/event/${event._id}`)}
      className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                 rounded-2xl overflow-hidden cursor-pointer
                 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]
                 hover:border-white/[0.15] hover:scale-[1.02]
                 transition-all duration-300 group">
      
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/20">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {isUpcoming ? (
            <span className="px-3 py-1.5 rounded-lg bg-green-500/90 backdrop-blur-xl
                             text-white text-xs font-bold shadow-lg">
              Upcoming
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-gray-500/90 backdrop-blur-xl
                             text-white text-xs font-bold shadow-lg">
              Completed
            </span>
          )}
        </div>

        {/* Category Badge */}
        {event.category && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-violet-500/90 backdrop-blur-xl border border-violet-400/30
                             text-white text-xs font-bold shadow-lg">
              {event.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.tags?.map((t, i) => (
            <span 
              key={i} 
              onClick={(e) => {
                e.stopPropagation(); // prevent card click
                setTag(t); // update tag state which triggers API refetch
              }}
              className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.1]
                         text-gray-300 text-[10px] font-semibold hover:bg-violet-500/20 hover:text-violet-300 transition-colors cursor-pointer"
            >
              #{t}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 
                       group-hover:text-violet-300 transition-colors">
          {event.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={14} className="text-violet-400 flex-shrink-0" />
            <span className="font-semibold">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin size={14} className="text-violet-400 flex-shrink-0" />
            <span className="truncate">{event.location || "Location TBA"}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <Users size={14} className="text-violet-400 flex-shrink-0" />
            <span className="font-semibold">{event.attendees?.length || 0} attending</span>
          </div>
        </div>

        <button className="mt-4 w-full py-2.5 rounded-xl
                           bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                           border border-violet-500/30
                           text-white font-bold text-sm
                           hover:from-violet-600/40 hover:to-indigo-600/40
                           transition-all">
          View Details
        </button>
      </div>
    </motion.div>
  );
}
