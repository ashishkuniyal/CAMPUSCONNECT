import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  X, 
  Save, 
  Calendar, 
  MapPin, 
  Tag, 
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { getAuthHeaders } from "../utils/api";

const CATEGORIES = [
  { value: "Hackathon", label: "Hackathon" },
  { value: "Workshop", label: "Workshop" },
  { value: "Seminar", label: "Seminar" },
  { value: "Fest", label: "Fest" },
  { value: "Competition", label: "Competition" },
  { value: "Meetup", label: "Meetup" },
  { value: "Conference", label: "Conference" },
  { value: "Other", label: "Other" },
];

export default function EditEventModal({ open, onClose, event, onUpdated, socket }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Hackathon",
    tags: "",
    image: ""
  });
  const [imageMode, setImageMode] = useState("url"); // "url" or "upload"
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-fill form data when event changes
  useEffect(() => {
    if (event) {
      let formattedDate = "";
      if (event.date) {
        const d = new Date(event.date);
        if (!isNaN(d.getTime())) {
          formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        }
      }

      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: formattedDate,
        location: event.location || "",
        category: event.category || "Hackathon",
        tags: Array.isArray(event.tags) ? event.tags.join(", ") : (event.tags || ""),
        image: event.imageUrl || event.image || ""
      });
    }
  }, [event]);

  if (!open || !event) return null;

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

    const data = new FormData();
    data.append("image", file);

    setUploadingImage(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post("/api/events/upload", data, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data"
        }
      });
      setFormData(prev => ({ ...prev, image: res.data.url }));
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
    if (!formData.title || !formData.description || !formData.date || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        location: formData.location.trim(),
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        imageUrl: formData.image.trim() || undefined,
        image: formData.image.trim() || undefined
      };

      const res = await axios.put(`/api/events/${event._id}`, payload, { headers });
      const updatedEvent = res.data;

      if (socket) {
        socket.emit("eventUpdated", updatedEvent);
      }

      toast.success("Event updated successfully!");
      if (onUpdated) onUpdated(updatedEvent);
      onClose();
    } catch (err) {
      console.error("Failed to update event:", err);
      toast.error(err.response?.data?.message || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass rounded-3xl w-full max-w-2xl border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600/30 text-primary-300 border border-primary-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Edit Campus Event</h3>
              <p className="text-[11px] text-gray-400">Update event details, banner image, timings, and location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">
              Event Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. HackCamp 2026: 24-Hour AI Challenge"
              className="form-input text-sm"
            />
          </div>

          {/* Category & Date in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input text-sm bg-black/40 text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-gray-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">
                Date & Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="form-input text-sm text-white"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">
              Location / Venue <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="e.g. Main Auditorium / CS Lab 402"
              className="form-input text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe what attendees can expect, schedule, swag, requirements..."
              className="form-input text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="ai, react, hackathon, web3"
              className="form-input text-sm"
            />
          </div>

          {/* ─── DUAL IMAGE SELECTOR IN MODAL ─── */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-primary-400" />
                Event Banner Image
              </label>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    imageMode === "url"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LinkIcon size={11} />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    imageMode === "upload"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Upload size={11} />
                  Upload
                </button>
              </div>
            </div>

            {imageMode === "url" ? (
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="form-input text-sm"
              />
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 hover:border-primary-500/50 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex flex-col items-center justify-center">
                  {uploadingImage ? (
                    <div className="flex items-center gap-2 text-primary-400 text-xs font-semibold">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mb-1 text-primary-400" />
                      <p className="text-xs text-gray-300">
                        <span className="text-primary-400 underline">Upload new image file</span>
                      </p>
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
            )}

            {/* Preview */}
            {formData.image && (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 h-32 bg-black/40 group mt-2">
                <img
                  src={formData.image}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-all"
                  title="Remove Image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
