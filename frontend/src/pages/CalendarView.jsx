import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  Tag,
  ArrowRight,
  Filter
} from "lucide-react";

const CATEGORIES = ["All", "Hackathon", "Workshop", "Seminar", "Fest", "Competition", "Meetup"];

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/events?limit=200");
        const list = Array.isArray(res.data) ? res.data : (res.data.events || []);
        setEvents(list);
      } catch (err) {
        console.error("Failed to load events for calendar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (selectedCategory === "All") return true;
    return (e.category || "").toLowerCase() === selectedCategory.toLowerCase();
  });

  // Get events on a specific day
  const getEventsForDay = (d, m = month, y = year) => {
    return filteredEvents.filter((e) => {
      const evtDate = new Date(e.date);
      return (
        evtDate.getDate() === d &&
        evtDate.getMonth() === m &&
        evtDate.getFullYear() === y
      );
    });
  };

  // Events on selected day
  const selectedDayEvents = filteredEvents.filter((e) => {
    const evtDate = new Date(e.date);
    return (
      evtDate.getDate() === selectedDate.getDate() &&
      evtDate.getMonth() === selectedDate.getMonth() &&
      evtDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const isToday = (d) => {
    const today = new Date();
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (d) => {
    return (
      d === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Campus Event Calendar</h1>
            <p className="text-xs sm:text-sm text-gray-400">Discover upcoming workshops, hackathons, and fests by date</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {monthNames[month]} {year}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDate(now);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/10 transition-all"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-gray-400 pb-2 border-b border-white/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const dayNum = prevMonthTotalDays - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[70px] sm:min-h-[85px] p-1.5 rounded-2xl bg-white/[0.01] border border-white/[0.02] opacity-30 text-xs text-gray-500"
                >
                  <span>{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const active = isSelected(day);
              const current = isToday(day);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? "bg-primary-600/30 border-primary-500/60 shadow-lg shadow-primary-500/20 text-white"
                      : current
                      ? "bg-white/10 border-indigo-400/40 text-white"
                      : "bg-white/5 hover:bg-white/[0.08] border-white/5 text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        current ? "bg-primary-600 text-white shadow-sm" : ""
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    )}
                  </div>

                  {/* Day Events Indicator Pills */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt._id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded-md bg-white/10 text-gray-200 border border-white/10 font-medium"
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-primary-300 font-semibold px-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Schedule Sidebar (1 col) */}
        <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" />
              Schedule for {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{selectedDayEvents.length} event(s) scheduled</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {selectedDayEvents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4 space-y-3 text-gray-400">
                <CalendarIcon className="w-10 h-10 text-gray-600" />
                <p className="text-xs">No events scheduled on this date.</p>
                <button
                  onClick={() => navigate("/create")}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-600/30 transition-all"
                >
                  + Host an Event
                </button>
              </div>
            ) : (
              selectedDayEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 space-y-3 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase">
                      {evt.category || "Event"}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary-400" />
                      {new Date(evt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-1">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{evt.description}</p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-primary-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </span>
                    <button
                      onClick={() => navigate(`/event/${evt._id}`)}
                      className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
