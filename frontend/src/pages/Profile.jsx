import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthHeaders, getCurrentUser, logout } from "../utils/api";
import toast from "react-hot-toast";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Github, 
  Linkedin, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  ExternalLink,
  Tag,
  Briefcase,
  Sliders,
  Bell,
  Activity,
  Award
} from "lucide-react";

// Predefined recommended skills & interests
const SUGGESTED_SKILLS = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", 
  "Machine Learning", "UI/UX Design", "Data Structures", 
  "TailwindCSS", "MongoDB", "DevOps", "Cybersecurity", 
  "Cloud Computing", "Flutter", "Public Speaking"
];

const EVENT_CATEGORIES = [
  "Hackathon", "Workshop", "Seminar", "Fest", 
  "Competition", "Meetup", "Conference"
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, rsvps, skills, edit, security
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    department: "",
    year: "",
    github: "",
    linkedin: "",
    skills: [],
    preferences: []
  });
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const localUser = getCurrentUser();

  // Load user profile and registered events
  useEffect(() => {
    if (!localUser) {
      navigate("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        
        // 1. Fetch fresh profile from API
        const profileRes = await axios.get("/api/auth/profile", { headers });
        const userData = profileRes.data;
        setProfile(userData);
        
        setFormData({
          name: userData.name || "",
          bio: userData.bio || "",
          department: userData.department || "",
          year: userData.year || "",
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          skills: userData.skills || [],
          preferences: userData.preferences || []
        });

        // 2. Fetch events to filter RSVPs and Created Events
        setEventsLoading(true);
        const eventsRes = await axios.get("/api/events?limit=200", { headers });
        const allEvents = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data.events || []);
        
        const userId = userData._id || userData.id;

        // Filter registered events (user is in attendees list)
        const myRsvps = allEvents.filter(e => {
          if (!e.attendees) return false;
          return e.attendees.some(att => {
            const attId = att._id || att.user || att;
            return attId?.toString() === userId?.toString();
          });
        });

        // Filter created events
        const myCreated = allEvents.filter(e => {
          const creatorId = e.createdBy?._id || e.creator?._id || e.createdBy || e.creator;
          return creatorId?.toString() === userId?.toString();
        });

        setRegisteredEvents(myRsvps);
        setCreatedEvents(myCreated);
        setEventsLoading(false);
      } catch (err) {
        console.error("Failed to load profile details:", err);
        // Fallback to local storage
        if (localUser) {
          setProfile(localUser);
          setFormData(prev => ({ ...prev, name: localUser.name || "" }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // Handle saving profile modifications
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const headers = getAuthHeaders();
      const res = await axios.put("/api/auth/profile", formData, { headers });
      const updated = res.data.user;

      setProfile(updated);
      
      // Update local storage user snapshot
      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...existingUser, name: updated.name, role: updated.role }));

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      if (activeTab === "edit") setActiveTab("overview");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Toggle skills in form
  const toggleSkill = (skill) => {
    setFormData(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
      };
    });
  };

  // Add custom skill
  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    const clean = customSkillInput.trim();
    if (!formData.skills.includes(clean)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, clean] }));
    }
    setCustomSkillInput("");
  };

  // Toggle interest/category preference
  const togglePreference = (cat) => {
    setFormData(prev => {
      const exists = prev.preferences.includes(cat);
      return {
        ...prev,
        preferences: exists ? prev.preferences.filter(p => p !== cat) : [...prev.preferences, cat]
      };
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading your campus profile...</p>
      </div>
    );
  }

  const userRole = profile?.role || "student";
  const initials = (profile?.name || "Student")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-2 sm:pt-4">
      {/* ─── HERO PROFILE HEADER CARD ─── */}
      <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {/* Ambient Gradient Header Top Strip */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-primary-700 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Active Member
            </span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-4 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Left: Avatar & Identity Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 border-4 border-[#0b0f19] flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-2xl">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#0b0f19] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg" title="Online & Verified">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>

              {/* Name & Badges */}
              <div className="space-y-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profile?.name || "Campus Member"}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase font-bold tracking-wide border ${
                    userRole === "admin"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : userRole === "organizer"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}>
                    {userRole}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {profile?.email}
                  </span>
                  {profile?.department && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary-400" />
                      {profile.department} {profile.year ? `(${profile.year})` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Header Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 sm:self-center">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) setActiveTab("edit");
                  else setActiveTab("overview");
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/10 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl text-xs sm:text-sm border border-rose-500/20 transition-all shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── QUICK METRICS SUMMARY ROW ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 sm:px-8 py-4 border-t border-white/10 bg-black/30">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight">{registeredEvents.length}</p>
              <p className="text-[11px] text-gray-400 font-medium truncate">Events Registered</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight">{createdEvents.length}</p>
              <p className="text-[11px] text-gray-400 font-medium truncate">Events Hosted</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight">{formData.skills.length}</p>
              <p className="text-[11px] text-gray-400 font-medium truncate">Skills & Tags</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight">{formData.preferences.length || "All"}</p>
              <p className="text-[11px] text-gray-400 font-medium truncate">Tracked Topics</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION BAR ─── */}
      <div className="glass p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 overflow-x-auto shadow-lg custom-scrollbar">
        {[
          { id: "overview", label: "Overview & Bio", icon: User },
          { id: "rsvps", label: `My Events (${registeredEvents.length})`, icon: Calendar },
          { id: "skills", label: "Skills & Interests", icon: Tag },
          { id: "edit", label: "Edit Information", icon: Edit3 },
          { id: "security", label: "Account & Role", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "edit") setIsEditing(true);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>


      {/* ─── TAB CONTENTS ─── */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Bio & Academic Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About / Bio Card */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-400" />
                About Me
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {formData.bio || (
                  <span className="text-gray-500 italic">
                    No bio added yet. Click "Edit Profile" to tell your campus peers about your studies, interests, and projects!
                  </span>
                )}
              </p>
            </div>

            {/* Academic & Campus Details */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary-400" />
                Academic Background
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400">Department / Major</p>
                  <p className="text-sm font-semibold text-white mt-1">
                    {formData.department || "Computer Science / Engineering"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400">Year of Study</p>
                  <p className="text-sm font-semibold text-white mt-1">
                    {formData.year || "3rd Year (Class of 2026)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Showcase */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  Skills & Endorsements
                </h3>
                <button
                  onClick={() => setActiveTab("skills")}
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                >
                  Manage Skills →
                </button>
              </div>
              {formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic">
                  No skills listed yet. Add skills to match with hackathons and project groups.
                </p>
              )}
            </div>
          </div>

          {/* Right Col: Social & Quick Actions */}
          <div className="space-y-6">
            {/* Social & Portfolio Links */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-400" />
                Connect & Links
              </h3>
              <div className="space-y-3">
                {formData.github ? (
                  <a
                    href={formData.github.startsWith("http") ? formData.github : `https://${formData.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-200 transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-white" />
                      GitHub Profile
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-500 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    No GitHub linked
                  </div>
                )}

                {formData.linkedin ? (
                  <a
                    href={formData.linkedin.startsWith("http") ? formData.linkedin : `https://${formData.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-200 transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-blue-400" />
                      LinkedIn Profile
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-500 flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    No LinkedIn linked
                  </div>
                )}
              </div>
            </div>

            {/* Quick Navigation Card */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-white">Campus Shortcuts</h3>
              <div className="space-y-2">
                <Link
                  to="/chat"
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/5"
                >
                  <span>💬 Open Campus Chat</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/events"
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/5"
                >
                  <span>🎉 Explore Upcoming Events</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/internships"
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/5"
                >
                  <span>💼 Browse Internships</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REGISTERED EVENTS TAB */}
      {activeTab === "rsvps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Your Registered Events & RSVPs</h3>
            <Link to="/events" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
              Browse More Events →
            </Link>
          </div>

          {eventsLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : registeredEvents.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-white/10 space-y-4">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto" />
              <div>
                <h4 className="text-white font-bold text-base">No registered events yet</h4>
                <p className="text-gray-400 text-xs mt-1">
                  You haven't RSVP'd to any campus events. Discover hackathons, workshops, and fests happening this week!
                </p>
              </div>
              <Link to="/events" className="btn-primary inline-flex text-xs px-4 py-2">
                Explore Campus Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="glass rounded-2xl p-5 border border-white/10 hover:border-primary-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-primary-500/20 text-primary-300 text-[11px] font-bold">
                        {evt.category || "Event"}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmed RSVP
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-base leading-snug line-clamp-1">
                      {evt.title}
                    </h4>
                    <p className="text-gray-400 text-xs line-clamp-2">{evt.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                      <span>{new Date(evt.date).toLocaleDateString()} at {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                    <Link
                      to={`/event/${evt._id}`}
                      className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold text-center block transition-all border border-white/5"
                    >
                      View Event Page & Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SKILLS & INTERESTS TAB */}
      {activeTab === "skills" && (
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Skills, Tech Stack & Campus Interests</h3>
            <p className="text-xs text-gray-400 mt-1">
              Select your technical skills and topics of interest to get personalized event and internship recommendations.
            </p>
          </div>

          {/* Active Skills List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-400" />
              Your Selected Skills ({formData.skills.length})
            </h4>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-black/30 border border-white/10">
              {formData.skills.length === 0 ? (
                <span className="text-xs text-gray-500">No skills selected yet. Click skills below to add them.</span>
              ) : (
                formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold shadow-md shadow-primary-600/30"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="hover:text-rose-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Add Custom Skill */}
          <form onSubmit={handleAddCustomSkill} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Add custom skill (e.g. Docker, Figma)..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 border border-white/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {/* Suggested Skills Grid */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">
              Popular Tech & Skill Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.map((skill) => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-primary-600 text-white border border-primary-500"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Interest Categories */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Preferred Event Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = formData.preferences.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => togglePreference(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                    }`}
                  >
                    {isSelected ? `★ ${cat}` : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* 4. EDIT PROFILE FORM TAB */}
      {activeTab === "edit" && (
        <form onSubmit={handleSaveProfile} className="glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Profile Information</h3>
            <p className="text-xs text-gray-400 mt-1">
              Update your public campus identity and social links.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="form-input text-sm"
                placeholder="Your full name"
              />
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Email Address (Registered)</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="form-input text-sm opacity-60 cursor-not-allowed bg-black/40"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Department / Major</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="form-input text-sm"
                placeholder="e.g. Computer Science, Mechanical, Design"
              />
            </div>

            {/* Year of Study */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Year / Batch</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="form-input text-sm"
                placeholder="e.g. 2nd Year, Class of 2026"
              />
            </div>

            {/* GitHub URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">GitHub Profile / Username</label>
              <input
                type="text"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="form-input text-sm"
                placeholder="github.com/username"
              />
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">LinkedIn Profile URL</label>
              <input
                type="text"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="form-input text-sm"
                placeholder="linkedin.com/in/username"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Bio / About You</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="form-input text-sm"
              placeholder="Tell others about your interests, favorite tech stack, or campus clubs..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {/* 5. ACCOUNT & SECURITY TAB */}
      {activeTab === "security" && (
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Account Details & Security</h3>
            <p className="text-xs text-gray-400 mt-1">
              Manage your authentication status and account roles.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">User Role</p>
                <p className="text-xs text-gray-400">Permissions on CampusConnect</p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-primary-600/30 text-primary-300 border border-primary-500/40 text-xs font-bold uppercase">
                {profile?.role || "student"}
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Account Status</p>
                <p className="text-xs text-gray-400">Security standing</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Active & Verified
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Member ID</p>
                <p className="text-xs text-gray-500 font-mono">{profile?._id || profile?.id || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-400">Sign Out</p>
              <p className="text-xs text-gray-400">Log out of your current session on this device</p>
            </div>
            <button
              onClick={() => logout()}
              className="px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-xl text-sm border border-rose-500/30 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
