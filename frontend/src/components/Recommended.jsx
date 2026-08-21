import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ExternalLink, Calendar, Briefcase, Award, AlertCircle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { getAuthHeaders } from "../utils/api";

export default function Recommended({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Use auth headers for protected route
        const headers = getAuthHeaders();
        const res = await axios.get("/api/recommendations", { headers });
        
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Recommendations error:", err);
        setError(true);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                      rounded-2xl p-12 text-center
                      shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Unable to load recommendations</h3>
        <p className="text-gray-400 text-sm">Please check if the aggregator service is running</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                      rounded-2xl p-12 text-center
                      shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No recommendations yet</h3>
        <p className="text-gray-400 text-sm mb-4">
          Try updating your preferences to get personalized opportunities
        </p>
        <a href="/preferences"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-white/5 border border-white/10
                     text-white font-semibold text-sm
                     hover:bg-white/10 hover:border-white/20
                     transition-all">
          Update Preferences
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((opportunity, index) => (
        <OpportunityCard key={index} opportunity={opportunity} index={index} />
      ))}
    </div>
  );
}

/* ─── Opportunity Card Component ──────────────────────── */
function OpportunityCard({ opportunity, index }) {
  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'internship':
        return <Briefcase className="w-4 h-4" />;
      case 'hackathon':
        return <Award className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'internship':
        return 'from-blue-600/20 to-cyan-600/20 border-blue-500/30';
      case 'hackathon':
        return 'from-purple-600/20 to-pink-600/20 border-purple-500/30';
      default:
        return 'from-violet-600/20 to-indigo-600/20 border-violet-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-[#0d0d1a]/70 backdrop-blur-xl border border-white/[0.08] 
                 rounded-2xl overflow-hidden
                 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]
                 hover:border-white/[0.15] hover:scale-[1.02]
                 transition-all duration-300 group">
      
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/20">
        <img
          src={opportunity.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop"}
          alt={opportunity.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Type badge */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg
                        bg-gradient-to-br ${getTypeColor(opportunity.type)}
                        backdrop-blur-xl border
                        flex items-center gap-1.5`}>
          {getTypeIcon(opportunity.type)}
          <span className="text-xs font-bold text-white capitalize">
            {opportunity.type || 'Event'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h4 className="text-lg font-bold text-white mb-3 line-clamp-2 
                       group-hover:text-violet-300 transition-colors">
          {opportunity.title}
        </h4>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Briefcase size={14} className="text-violet-400 flex-shrink-0" />
            <span className="font-semibold truncate">{opportunity.source || 'Unknown'}</span>
          </div>
          
          {opportunity.deadline && (
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={14} className="text-violet-400 flex-shrink-0" />
              <span className="truncate">Deadline: {opportunity.deadline}</span>
            </div>
          )}
        </div>

        <a
          href={opportunity.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
                     bg-gradient-to-br from-violet-600/30 to-indigo-600/30
                     border border-violet-500/30
                     text-white font-bold text-sm
                     hover:from-violet-600/40 hover:to-indigo-600/40
                     hover:border-violet-500/50
                     transition-all duration-300
                     group/btn">
          <span>View Opportunity</span>
          <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </a>
      </div>
    </motion.div>
  );
}
