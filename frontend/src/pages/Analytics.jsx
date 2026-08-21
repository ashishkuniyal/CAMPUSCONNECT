import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  Sparkles,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  CartesianGrid
} from "recharts";

export default function Analytics() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    topCategory: "N/A",
    avgAttendees: 0
  });
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/events?limit=500");
        const list = Array.isArray(res.data) ? res.data : (res.data.events || []);
        setEvents(list);

        // Group by category
        const catMap = {};
        let totalAtt = 0;

        list.forEach((e) => {
          const cat = e.category || "Other";
          const count = e.attendees?.length || 0;
          totalAtt += count;
          catMap[cat] = (catMap[cat] || 0) + count;
        });

        const catArray = Object.entries(catMap).map(([name, attendees]) => ({
          name,
          attendees,
          events: list.filter((e) => (e.category || "Other") === name).length
        }));

        catArray.sort((a, b) => b.attendees - a.attendees);

        // Group by month
        const monthMap = {};
        list.forEach((e) => {
          const d = new Date(e.date);
          if (!isNaN(d)) {
            const key = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
            monthMap[key] = (monthMap[key] || 0) + (e.attendees?.length || 1);
          }
        });

        const trendArray = Object.entries(monthMap).map(([month, count]) => ({
          month,
          activity: count
        }));

        setCategoryData(catArray);
        setTrendData(trendArray);
        setStats({
          totalEvents: list.length,
          totalAttendees: totalAtt,
          topCategory: catArray[0]?.name || "Hackathon",
          avgAttendees: list.length > 0 ? Math.round(totalAtt / list.length) : 0
        });
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="glass p-6 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Engagement & Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-400">Campus trends, attendee participation, and category growth</p>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{stats.totalEvents}</p>
            <p className="text-xs text-gray-400 font-medium">Published Events</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{stats.totalAttendees}</p>
            <p className="text-xs text-gray-400 font-medium">Total Student RSVPs</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-black text-white leading-tight truncate max-w-[120px]">{stats.topCategory}</p>
            <p className="text-xs text-gray-400 font-medium">Leading Category</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{stats.avgAttendees}</p>
            <p className="text-xs text-gray-400 font-medium">Avg RSVPs / Event</p>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Engagement Bar */}
        <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              RSVPs by Event Category
            </h3>
            <span className="text-xs text-gray-400">Total Attendees</span>
          </div>

          <div className="h-72 w-full pt-4">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No category data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-25} textAnchor="end" />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="attendees" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Timeline Participation Area Chart */}
        <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Monthly Engagement Activity
            </h3>
            <span className="text-xs text-gray-400">Timeline</span>
          </div>

          <div className="h-72 w-full pt-4">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No timeline data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Area type="monotone" dataKey="activity" stroke="#a855f7" fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
