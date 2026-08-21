import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { 
  CalendarDays, 
  Code2, 
  Brain, 
  Users, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Award,
  Globe,
  Search
} from "lucide-react";
import { isAuthenticated } from "../utils/api";

export default function Home({ socket }) {
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState("");
  const loggedIn = isAuthenticated();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/events?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/events");
    }
  };

  const categories = [
    { icon: <Code2 size={24} />, title: "Hackathons", desc: "Build, code & compete", category: "Hackathon" },
    { icon: <Brain size={24} />, title: "Workshops", desc: "Hands-on tech learning", category: "Workshop" },
    { icon: <Users size={24} />, title: "Tech Fests", desc: "Campus cultural & fests", category: "Fest" },
    { icon: <Sparkles size={24} />, title: "Seminars", desc: "Keynotes & industry talks", category: "Seminar" },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events?limit=4&sort=-createdAt");
        const list = Array.isArray(res.data) ? res.data : (res.data.events || []);
        setFeaturedEvents(list.slice(0, 4));
      } catch (err) {
        console.error("Failed to load featured events for home:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="w-full text-white animate-fade-in space-y-12">
      {/* 🌈 Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 sm:py-32 px-4 rounded-3xl mx-auto max-w-6xl overflow-hidden shadow-2xl glass border-t border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black/50 z-0"></div>
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md"
          >
            <Sparkles size={16} className="text-primary-400" />
            <span>The #1 platform for student events & campus opportunities</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-300 leading-tight"
          >
            Empower Your <br/>Campus Journey
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-gray-300 mb-10 font-light px-2"
          >
            Discover hackathons, workshops, and fests. Connect with peers in real-time chat, build projects, and unlock verified internship opportunities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-xl mx-auto mb-8"
          >
            <form onSubmit={handleHeroSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events, hackathons, workshops…"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:scale-105 transition-all"
              >
                Search
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            {loggedIn ? (
              <button
                onClick={() => navigate("/create")}
                className="btn-primary px-8 py-3.5 text-base sm:text-lg flex items-center gap-2"
              >
                Create Event <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={() => navigate("/register")}
                className="btn-primary px-8 py-3.5 text-base sm:text-lg flex items-center gap-2"
              >
                Join Free <ArrowRight size={20} />
              </button>
            )}
            <button
              onClick={() => navigate("/events")}
              className="btn-secondary px-8 py-3.5 text-base sm:text-lg"
            >
              Explore Events
            </button>
            <button
              onClick={() => navigate("/aggregator")}
              className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-base flex items-center gap-2 transition-all text-gray-200"
            >
              <Globe size={18} className="text-primary-400" /> Opportunities
            </button>
          </motion.div>
        </div>
      </section>

      {/* 🔍 Top Categories */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-white">
            <span className="bg-primary-500/20 p-2 rounded-xl text-primary-400"><Code2 size={24} /></span>
            Explore Categories
          </h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5"
        >
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              onClick={() => navigate(`/events?category=${cat.category}`)}
              className="glass-card p-6 text-center cursor-pointer group"
            >
              <div className="inline-flex justify-center items-center w-14 h-14 rounded-2xl bg-white/5 mb-4 text-primary-400 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                {cat.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{cat.title}</h3>
              <p className="text-xs text-gray-400 group-hover:text-gray-300">{cat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 🎉 Featured Live Events */}
      <section className="py-6 px-4 max-w-6xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-white">
            <span className="bg-purple-500/20 p-2 rounded-xl text-purple-400"><CalendarDays size={24} /></span>
            Featured Events
          </h2>
          <button 
            onClick={() => navigate("/events")} 
            className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            View all events <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/10 space-y-4 max-w-md mx-auto">
            <CalendarDays className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No upcoming events yet</h3>
            <p className="text-xs text-gray-400">Be the first organizer to publish a campus hackathon, fest or seminar!</p>
            <button onClick={() => navigate("/create")} className="btn-primary text-xs px-5 py-2.5">
              Host an Event
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {featuredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const formattedDate = !isNaN(eventDate) ? eventDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              }) : "Upcoming";

              const bannerImage = event.image || (
                event.category === "Hackathon" 
                  ? "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
                  : event.category === "Workshop"
                  ? "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                  : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
              );

              return (
                <motion.div
                  key={event._id}
                  variants={itemVariants}
                  className="glass-card overflow-hidden group flex flex-col justify-between"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={bannerImage} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10">
                      <CalendarDays size={13} className="text-primary-400" /> {formattedDate}
                    </div>
                    {event.category && (
                      <div className="absolute top-3 right-3 bg-primary-600/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white uppercase tracking-wider">
                        {event.category}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-primary-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                        <span className="flex items-center gap-1 text-primary-300 font-semibold shrink-0">
                          <Users size={13} />
                          {event.attendees?.length || 0} RSVPs
                        </span>
                      </div>

                      <button
                        onClick={() => navigate(`/event/${event._id}`)}
                        className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 hover:border-primary-500/50"
                      >
                        View Event & Discussion →
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
