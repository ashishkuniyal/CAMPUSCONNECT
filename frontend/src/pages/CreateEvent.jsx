import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, getCurrentUser } from "../utils/api";
import toast from "react-hot-toast";
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Image as ImageIcon,
  Upload, 
  X, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  FileImage
} from "lucide-react";

const CATEGORIES = [
  { value: "Hackathon", label: "Hackathon", icon: "💻" },
  { value: "Workshop", label: "Workshop", icon: "🛠️" },
  { value: "Seminar", label: "Seminar", icon: "🎓" },
  { value: "Fest", label: "Fest", icon: "🎉" },
  { value: "Competition", label: "Competition", icon: "🏆" },
  { value: "Meetup", label: "Meetup", icon: "👥" },
  { value: "Conference", label: "Conference", icon: "🎤" },
  { value: "Other", label: "Other", icon: "📌" },
];

export default function CreateEvent({ socket }) {
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    date: "", 
    location: "", 
    category: "Hackathon",
    tags: ""
  });
  const [imageMode, setImageMode] = useState("url"); // "url" or "upload"
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      toast.error("Please login to create an event");
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post("/api/events/upload", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data"
        }
      });
      setImageUrl(res.data.url);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.date || !form.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      const eventData = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
        category: form.category || "Hackathon",
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        imageUrl: imageUrl.trim() || undefined,
        image: imageUrl.trim() || undefined
      };

      const res = await axios.post("/api/events", eventData, { headers });
      
      if (socket) {
        socket.emit("newEvent", res.data);
      }

      toast.success("Event published successfully!");
      navigate(`/event/${res.data._id}`);
    } catch (err) {
      console.error("Create event error:", err);
      const errorMsg = err.response?.data?.message || "Failed to create event";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 text-white pt-2 sm:pt-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 mb-4"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Host a Campus Event
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">Publish your hackathon, workshop, seminar, or fest to the campus community</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <Tag size={14} className="text-primary-400" />
            Event Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. HackCamp 2026: 24-Hour AI Challenge"
            required
            className="form-input text-sm"
          />
        </div>

        {/* Category & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <Tag size={14} className="text-primary-400" />
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="form-input text-sm bg-black/40 text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-gray-900 text-white">
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <Calendar size={14} className="text-primary-400" />
              Date & Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              className="form-input text-sm text-white"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <MapPin size={14} className="text-primary-400" />
            Location / Venue <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g. Campus Innovation Center, Auditorium Hall 1"
            required
            className="form-input text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <Tag size={14} className="text-primary-400" />
            Description & Highlights <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what attendees can expect, prize pool, mentors, prerequisites..."
            rows={4}
            required
            className="form-input text-sm resize-none"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <Tag size={14} className="text-primary-400" />
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="e.g. ai, webdev, prizes, beginners-welcome"
            className="form-input text-sm"
          />
        </div>

        {/* ─── DUAL BANNER IMAGE SELECTOR ─── */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-primary-400" />
              Event Banner Image (optional)
            </label>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  imageMode === "url"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <LinkIcon size={12} />
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode("upload")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  imageMode === "upload"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Upload size={12} />
                Upload File
              </button>
            </div>
          </div>

          {/* Option 1: URL Input */}
          {imageMode === "url" && (
            <div className="space-y-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="form-input text-sm"
              />
              <p className="text-[11px] text-gray-500">Paste any public direct image link (Unsplash, Imgur, CDN, etc.)</p>
            </div>
          )}

          {/* Option 2: File Upload Input */}
          {imageMode === "upload" && (
            <div className="relative">
              <label className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-white/20 hover:border-primary-500/50 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                  {uploadingImage ? (
                    <div className="flex items-center gap-2 text-primary-400 text-xs font-semibold">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to campus server...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 mb-2 text-primary-400" />
                      <p className="text-xs font-semibold text-gray-300">
                        <span className="text-primary-400 underline">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, JPEG, WEBP up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Image Live Preview */}
          {imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-44 bg-black/40 group mt-3">
              <img
                src={imageUrl}
                alt="Banner Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-bold text-emerald-400 flex items-center gap-1 border border-white/10">
                <CheckCircle2 size={12} /> Image Ready
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-all"
                title="Remove Image"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="btn-primary px-7 py-2.5 text-sm font-bold flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publishing Event...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Publish Event</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
