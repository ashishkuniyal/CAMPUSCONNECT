import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import EditEventModal from "../components/EditEventModal";
import { getAuthHeaders, getCurrentUser, isAuthenticated } from "../utils/api";
import toast from "react-hot-toast";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  Tag, 
  User as UserIcon,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function EventDetails({ socket }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const currentUser = getCurrentUser();
  const loggedIn = isAuthenticated();

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error("Could not load event:", err);
      toast.error("Could not load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();

    if (!socket) return;
    
    const handleUpdated = (u) => { 
      if (u._id === id) setEvent(u); 
    };

    // Handle both string ID and { id } object payloads
    const handleDeleted = (payload) => { 
      const delId = typeof payload === 'string' ? payload : payload?.id;
      if (delId === id) { 
        toast.error("This event was deleted"); 
        navigate("/events"); 
      }
    };

    socket.on("eventUpdated", handleUpdated);
    socket.on("eventDeleted", handleDeleted);

    return () => {
      socket.off("eventUpdated", handleUpdated);
      socket.off("eventDeleted", handleDeleted);
    };
  }, [id, socket]);

  // Check if current user is RSVP'd
  const isRsvpd = event?.attendees?.some((att) => {
    const attId = att._id || att.id || att.user || att;
    const myId = currentUser?._id || currentUser?.id;
    return attId?.toString() === myId?.toString();
  });

  // Check if current user is the creator or admin
  const creatorId = event?.creator?._id || event?.creator || event?.createdBy?._id || event?.createdBy;
  const isOwner = currentUser && (
    creatorId?.toString() === (currentUser._id || currentUser.id)?.toString() ||
    currentUser.role === "admin"
  );

  const toggleRsvp = async () => {
    if (!loggedIn) {
      toast.error("Please login to RSVP for this event");
      navigate("/login");
      return;
    }

    setRsvpLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`/api/events/${id}/rsvp`, {}, { headers });
      setEvent(res.data);
      toast.success(isRsvpd ? "RSVP cancelled" : "RSVP confirmed! See you there 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "RSVP failed");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;

    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/events/${id}`, { headers });
      if (socket) socket.emit("eventDeleted", { id });
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Event link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto py-20 text-center glass rounded-3xl p-8 border border-white/10 space-y-4">
        <Calendar className="w-12 h-12 text-gray-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Event Not Found</h3>
        <p className="text-xs text-gray-400">This event may have been removed or does not exist.</p>
        <Link to="/events" className="btn-primary inline-block text-xs px-4 py-2">
          Back to Events Catalog
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = !isNaN(eventDate)
    ? eventDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "TBA";
  const formattedTime = !isNaN(eventDate)
    ? eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const defaultImage =
    event.category === "Hackathon"
      ? "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
      : event.category === "Workshop"
      ? "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-white pt-2 sm:pt-4">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Actions (Share, Edit, Delete) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all"
            title="Share Event Link"
          >
            <Share2 className="w-3.5 h-3.5 text-primary-400" />
            <span>Share</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-300 hover:text-white bg-primary-600/20 hover:bg-primary-600/30 px-3.5 py-1.5 rounded-xl border border-primary-500/40 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Event</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/20 transition-all shadow-sm"
                title="Delete Event"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Showcase Hero Card */}
      <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl space-y-6">
        {/* Banner Hero */}
        <div className="h-64 sm:h-80 relative overflow-hidden">
          <img
            src={event.image || defaultImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent" />

          {/* Top Chips */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg">
              {event.category || "Campus Event"}
            </span>
          </div>
        </div>

        {/* Event Body Details */}
        <div className="px-6 sm:px-8 pb-8 pt-0 space-y-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                {event.creator && (
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-primary-400" />
                    Organized by <strong className="text-white">{event.creator?.name || "Campus Organizer"}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  {event.attendees?.length || 0} Registered Attendees
                </span>
              </div>
            </div>

            {/* RSVP Button + Capacity */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Spots remaining indicator */}
              {event.rsvpLimit && (
                <div className="text-xs font-semibold text-center">
                  {event.attendees?.length >= event.rsvpLimit ? (
                    <span className="text-red-400">Event full ({event.rsvpLimit} / {event.rsvpLimit})</span>
                  ) : (
                    <span className="text-emerald-400">
                      {event.rsvpLimit - (event.attendees?.length || 0)} spots left &nbsp;
                      <span className="text-gray-500">({event.attendees?.length || 0} / {event.rsvpLimit})</span>
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={toggleRsvp}
                disabled={rsvpLoading || (!isRsvpd && event.rsvpLimit && event.attendees?.length >= event.rsvpLimit)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                  !isRsvpd && event.rsvpLimit && event.attendees?.length >= event.rsvpLimit
                    ? "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                    : isRsvpd
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                    : "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-indigo-500/30 hover:scale-105"
                }`}
              >
                {!isRsvpd && event.rsvpLimit && event.attendees?.length >= event.rsvpLimit ? (
                  <><ShieldCheck className="w-4 h-4" /><span>Event Full</span></>
                ) : isRsvpd ? (
                  <><CheckCircle2 className="w-4 h-4" /><span>RSVP Confirmed — Cancel?</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>RSVP / Register for Free</span></>
                )}
              </button>
            </div>
          </div>

          {/* Time & Venue Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Date & Time</p>
                <p className="text-sm font-bold text-white mt-0.5">{formattedDate}</p>
                {formattedTime && <p className="text-xs text-gray-300">{formattedTime}</p>}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Campus Location</p>
                <p className="text-sm font-bold text-white mt-0.5">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-white">About This Event</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tags & Topics</h4>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Event Discussion Chatbox */}
      <ChatBox socket={socket} eventId={id} />

      {/* Edit Event Modal */}
      <EditEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={event}
        onUpdated={(updated) => setEvent(updated)}
        socket={socket}
      />
    </div>
  );
}
