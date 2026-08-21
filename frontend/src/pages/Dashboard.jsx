import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthHeaders } from "../utils/api";
import toast from "react-hot-toast";
import { 
  Calendar, Users, MapPin, Clock, Eye, TrendingUp, 
  BarChart3, Activity, Star, MessageSquare, Hash,
  ArrowUpRight, ArrowDownRight, Sparkles, Target,
  AlertCircle, CheckCircle2, XCircle, Edit3
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import EditEventModal from "../components/EditEventModal";

export default function Dashboard({ socket }) {
  const [events, setEvents] = useState([]);
  const [rsvpedEvents, setRsvpedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("created"); // 'created' or 'rsvped'
  const [editingEvent, setEditingEvent] = useState(null);
  const [analytics, setAnalytics] = useState({

    totalEvents: 0,
    totalAttendees: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    avgAttendeesPerEvent: 0,
    mostPopularEvent: null,
    recentActivity: [],
    growthRate: 0,
    engagementRate: 0
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch the current user's events server-side
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      const [createdRes, rsvpedRes] = await Promise.all([
        axios.get("/api/events?createdBy=me&limit=100&sort=-createdAt", { headers }),
        axios.get("/api/events?rsvpedBy=me&limit=100&sort=date", { headers })
      ]);
      
      const userEvents = Array.isArray(createdRes.data) ? createdRes.data : (createdRes.data.events || []);
      const userRsvped = Array.isArray(rsvpedRes.data) ? rsvpedRes.data : (rsvpedRes.data.events || []);
      
      setEvents(userEvents);
      setRsvpedEvents(userRsvped);
      
      // Calculate advanced analytics
      const now = new Date();
      const upcoming = userEvents.filter(e => new Date(e.date) > now);
      const past = userEvents.filter(e => new Date(e.date) <= now);
      const totalAttendees = userEvents.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
      const avgAttendees = userEvents.length > 0 ? Math.round(totalAttendees / userEvents.length) : 0;
      
      // Find most popular event
      const mostPopular = userEvents.length > 0 
        ? userEvents.reduce((max, e) => 
            (e.attendees?.length || 0) > (max.attendees?.length || 0) ? e : max
          )
        : null;
      
      // Calculate growth rate (compare last 30 days vs previous 30 days)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const recentEvents = userEvents.filter(e => {
        const created = new Date(e.createdAt);
        return created > last30Days;
      }).length;
      
      const previousEvents = userEvents.filter(e => {
        const created = new Date(e.createdAt);
        return created > last60Days && created <= last30Days;
      }).length;
      
      const growth = previousEvents > 0 
        ? Math.round(((recentEvents - previousEvents) / previousEvents) * 100)
        : recentEvents > 0 ? 100 : 0;
      
      // Calculate engagement rate (attendees per event created in last 30 days)
      const recentEventsWithAttendees = userEvents.filter(e => {
        const created = new Date(e.createdAt);
        return created > last30Days;
      });
      const recentAttendees = recentEventsWithAttendees.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
      const engagement = recentEventsWithAttendees.length > 0 
        ? Math.round((recentAttendees / recentEventsWithAttendees.length) * 10) / 10
        : 0;
      
      setAnalytics({
        totalEvents: userEvents.length,
        totalAttendees,
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        avgAttendeesPerEvent: avgAttendees,
        mostPopularEvent: mostPopular,
        growthRate: growth,
        engagementRate: engagement
      });
      
    } catch (err) {
      console.error("Error loading dashboard:", err);
      // Provide more specific error information
      const errorMsg = err.response?.data?.message || err.message || "Could not load dashboard data";
      toast.error(errorMsg);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Please log in to view your dashboard</h2>
            <Link to="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700
                         text-white font-bold
                         shadow-[0_6px_20px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                         hover:scale-105 transition-all">
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2
                         bg-gradient-to-r from-white via-violet-200 to-white
                         bg-clip-text text-transparent drop-shadow-lg">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm">Track your event performance and audience engagement</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Events"
            value={analytics.totalEvents}
            trend={analytics.growthRate}
            color="violet"
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Total Attendees"
            value={analytics.totalAttendees}
            subtext="All time"
            color="indigo"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Avg. Attendance"
            value={analytics.avgAttendeesPerEvent}
            subtext="Per event"
            color="purple"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Engagement Rate"
            value={analytics.engagementRate}
            subtext="Last 30 days"
            color="pink"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Event Status Overview */}
          <div className="lg:col-span-2">
            <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                            rounded-2xl p-6
                            shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Event Overview</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <StatusCard
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  label="Upcoming Events"
                  value={analytics.upcomingEvents}
                  color="green"
                />
                <StatusCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Past Events"
                  value={analytics.pastEvents}
                  color="blue"
                />
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/[0.08]">
                <h4 className="text-sm font-bold text-gray-400 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Link to="/events"
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10
                               text-white text-sm font-semibold
                               hover:bg-white/10 hover:border-white/20 transition-all">
                    View All Events
                  </Link>
                  <Link to="/analytics"
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10
                               text-white text-sm font-semibold
                               hover:bg-white/10 hover:border-white/20 transition-all">
                    Detailed Analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Most Popular Event */}
          <div className="lg:col-span-1">
            <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                            rounded-2xl p-6
                            shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Top Event</h3>
              </div>
              
              {analytics.mostPopularEvent ? (
                <div>
                  <h4 className="text-white font-bold mb-2 line-clamp-2">
                    {analytics.mostPopularEvent.title}
                  </h4>
                  <div className="flex items-center gap-2 text-violet-400 text-sm mb-4">
                    <Users size={14} />
                    <span className="font-semibold">
                      {analytics.mostPopularEvent.attendees?.length || 0} attendees
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/event/${analytics.mostPopularEvent._id}`)}
                    className="w-full px-4 py-2 rounded-lg
                               bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                               border border-violet-500/30
                               text-white font-semibold text-sm
                               hover:from-violet-600/40 hover:to-indigo-600/40
                               transition-all">
                    View Details
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No events yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events List */}
        <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                        rounded-2xl p-6
                        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Recent Events</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("created")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "created" 
                    ? "bg-violet-600 text-white" 
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                Created Events
              </button>
              <button
                onClick={() => setActiveTab("rsvped")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "rsvped" 
                    ? "bg-violet-600 text-white" 
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                My RSVPs
              </button>
            </div>
            <Link to="/events"
              className="text-violet-400 text-sm font-semibold hover:text-violet-300 
                         flex items-center gap-1 transition-colors ml-auto">
              Browse All
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {activeTab === "created" ? (
            events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">No events created yet</h4>
                <p className="text-gray-400 text-sm mb-6">Start creating events to see them here</p>
                <Link to="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700
                             text-white font-bold text-sm
                             shadow-[0_6px_20px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                             hover:scale-105 transition-all
                             border border-violet-400/30">
                  Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <EventListItem
                    key={event._id}
                    event={event}
                    onClick={() => navigate(`/event/${event._id}`)}
                    onEdit={(e) => {
                      e.stopPropagation();
                      setEditingEvent(event);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            rsvpedEvents.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">No RSVPs yet</h4>
                <p className="text-gray-400 text-sm mb-6">Find an event you like and register to see it here</p>
                <Link to="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700
                             text-white font-bold text-sm
                             hover:scale-105 transition-all">
                  Explore Events
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rsvpedEvents.map((event) => (
                  <EventListItem
                    key={event._id}
                    event={event}
                    onClick={() => navigate(`/event/${event._id}`)}
                  />
                ))}
              </div>
            )
          )}
        </div>

      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          event={editingEvent}
          onUpdated={(updated) => {
            setEvents(prev => prev.map(e => e._id === updated._id ? updated : e));
            fetchDashboardData();
          }}
          socket={socket}
        />
      )}
    </div>
  );
}

/* ─── Metric Card Component ───────────────────────────── */
function MetricCard({ icon, label, value, trend, subtext, color = "violet" }) {
  const colorClasses = {
    violet: "from-violet-600/20 to-violet-700/20 border-violet-500/30 text-violet-400",
    indigo: "from-indigo-600/20 to-indigo-700/20 border-indigo-500/30 text-indigo-400",
    purple: "from-purple-600/20 to-purple-700/20 border-purple-500/30 text-purple-400",
    pink: "from-pink-600/20 to-pink-700/20 border-pink-500/30 text-pink-400"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} 
                     backdrop-blur-xl border rounded-2xl p-5
                     shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
                     hover:scale-105 transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10
                        group-hover:bg-white/10 transition-all">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold
                          ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-white mb-1
                      drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        {value}
      </div>
      <div className="text-sm font-semibold text-gray-400">
        {label}
        {subtext && <span className="text-xs ml-1">· {subtext}</span>}
      </div>
    </div>
  );
}

/* ─── Status Card Component ───────────────────────────── */
function StatusCard({ icon, label, value, color }) {
  const colorClasses = {
    green: "bg-green-500/20 border-green-500/30 text-green-400",
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    red: "bg-red-500/20 border-red-500/30 text-red-400"
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-semibold text-gray-400">{label}</div>
    </div>
  );
}

/* ─── Event List Item Component ───────────────────────── */
function EventListItem({ event, onClick, onEdit }) {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl
                 bg-white/[0.02] border border-white/[0.06]
                 hover:bg-white/[0.05] hover:border-white/[0.12]
                 transition-all duration-300 group text-left cursor-pointer">
      
      {/* Date Badge */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                      border border-violet-500/30 flex flex-col items-center justify-center">
        <div className="text-xs font-bold text-violet-400 uppercase">
          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="text-lg font-black text-white">
          {eventDate.getDate()}
        </div>
      </div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-white font-bold truncate group-hover:text-violet-300 transition-colors">
            {event.title}
          </h4>
          {isUpcoming && (
            <span className="px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/30
                             text-green-400 text-xs font-bold flex-shrink-0">
              Upcoming
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-violet-400" />
            <span className="font-semibold">{event.attendees?.length || 0} RSVPs</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 truncate">
              <MapPin size={12} className="text-violet-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg bg-primary-600/20 hover:bg-primary-600/40 text-primary-300 border border-primary-500/30 transition-all text-xs font-semibold flex items-center gap-1"
            title="Edit this event"
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        )}
        <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-violet-400 
                                 group-hover:translate-x-1 group-hover:-translate-y-1 
                                 transition-all" />
      </div>
    </div>
  );
}

