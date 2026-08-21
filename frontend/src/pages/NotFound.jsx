import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Glowing 404 */}
        <div className="relative mb-8">
          <div className="text-[10rem] font-black text-white/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-7xl font-black bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
              404
            </h1>
          </div>
        </div>

        {/* Glass card */}
        <div className="glass border border-white/10 rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-500/20 border border-violet-500/30 mx-auto">
            <Compass className="w-7 h-7 text-violet-400" />
          </div>

          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Looks like this page wandered off campus. The URL might be wrong or the page may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         bg-white/5 border border-white/10
                         text-white font-semibold text-sm
                         hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         bg-gradient-to-br from-violet-600 to-indigo-600
                         text-white font-bold text-sm
                         shadow-[0_4px_16px_rgba(139,92,246,0.4)]
                         hover:scale-105 transition-all border border-violet-400/30"
            >
              <Home size={16} />
              Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
