import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Hash, 
  Send, 
  Smile, 
  Search, 
  Sparkles, 
  Code2, 
  BookOpen, 
  Briefcase, 
  HelpCircle, 
  Clock, 
  LogIn, 
  GraduationCap,
  MessageSquare
} from "lucide-react";
import { getAuthHeaders, getCurrentUser, isAuthenticated } from "../utils/api";
import { Link } from "react-router-dom";

const CHANNELS = [
  {
    id: "global",
    name: "general-lounge",
    label: "General Lounge",
    category: "Main",
    icon: Hash,
    color: "from-indigo-500 to-purple-500",
    description: "The primary campus commons — casual banter, greetings, campus news, and announcements."
  },
  {
    id: "study-group",
    name: "study-circle",
    label: "Study & Peer Help",
    category: "Academic",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    description: "Find study buddies, exchange notes, organize revision sessions, and get homework guidance."
  },
  {
    id: "tech-coding",
    name: "tech-and-hackathons",
    label: "Tech & Projects",
    category: "Technical",
    icon: Code2,
    color: "from-emerald-500 to-teal-500",
    description: "Collaborate on projects, find hackathon teammates, ask code questions, and share tech stacks."
  },
  {
    id: "events-buzz",
    name: "events-and-fests",
    label: "Events & Campus Buzz",
    category: "Social",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500",
    description: "Live reactions for ongoing fests, club recruitments, cultural nights, and sporting events."
  },
  {
    id: "careers",
    name: "careers-and-internships",
    label: "Internships & Careers",
    category: "Career",
    icon: Briefcase,
    color: "from-amber-500 to-orange-500",
    description: "Resume reviews, interview tips, referral requests, and internship experience sharing."
  },
  {
    id: "lost-found",
    name: "lost-and-found",
    label: "Lost & Found",
    category: "Campus Utility",
    icon: HelpCircle,
    color: "from-violet-500 to-fuchsia-500",
    description: "Lost an ID card, earphones, or keys on campus? Post descriptions and find lost items here."
  }
];

const QUICK_EMOJIS = ["👍", "🔥", "🚀", "🎉", "❤️", "🙌", "💡", "😂"];

// Helper to generate consistent avatar background colors from username
function getAvatarGradient(name = "Anon") {
  const gradients = [
    "from-purple-600 to-indigo-600",
    "from-blue-600 to-cyan-600",
    "from-emerald-600 to-teal-600",
    "from-pink-600 to-rose-600",
    "from-amber-600 to-orange-600",
    "from-violet-600 to-purple-600"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function ChatRoom({ socket }) {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineCount, setOnlineCount] = useState(18);

  const messagesEndRef = useRef(null);
  const currentUser = getCurrentUser();
  const loggedIn = isAuthenticated();

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Load messages whenever active channel changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadMessages = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(`/api/chat/${activeChannel.id}`, { headers });
        if (isMounted) {
          setMessages(res.data || []);
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch (err) {
        console.error("Error loading chat messages:", err);
        if (isMounted) {
          setMessages([]);
          setLoading(false);
        }
      }
    };

    loadMessages();

    // Randomize slight online count variance for realism
    setOnlineCount(Math.floor(Math.random() * 12) + 14);

    return () => {
      isMounted = false;
    };
  }, [activeChannel.id]);

  // Socket room listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinEvent", activeChannel.id);

    const handleIncomingMessage = (newMsg) => {
      // Check if message belongs to current room/channel
      const msgChannelId = newMsg.eventId || newMsg.event;
      if (String(msgChannelId) === String(activeChannel.id)) {
        setMessages((prev) => {
          if (newMsg._id && prev.some((m) => m._id === newMsg._id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    socket.on("message", handleIncomingMessage);

    return () => {
      socket.emit("leaveEvent", activeChannel.id);
      socket.off("message", handleIncomingMessage);
    };
  }, [socket, activeChannel.id]);

  // Handle message sending
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;

    if (!loggedIn) {
      alert("Please log in to participate in the campus chat!");
      return;
    }

    const messageContent = text.trim();
    setText("");
    setSending(true);

    try {
      const headers = getAuthHeaders();
      const res = await axios.post(
        "/api/chat",
        { eventId: activeChannel.id, text: messageContent },
        { headers }
      );

      const createdMsg = res.data;

      // Broadcast via socket so other peers receive immediately
      if (socket) {
        socket.emit("sendMessage", createdMsg);
      }

      // Add to local state if not already received from socket
      setMessages((prev) => {
        if (prev.some((m) => m._id === createdMsg._id)) return prev;
        return [...prev, createdMsg];
      });

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      setText(messageContent);
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const author = (m.user?.name || "Anon").toLowerCase();
    const content = (m.text || "").toLowerCase();
    return author.includes(searchQuery.toLowerCase()) || content.includes(searchQuery.toLowerCase());
  });

  const categories = Array.from(new Set(CHANNELS.map((c) => c.category)));

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-10rem)] min-h-[580px] flex flex-col md:flex-row gap-4 pb-2">
      {/* LEFT SIDEBAR: Channels & Categories */}
      <div className="w-full md:w-80 glass rounded-2xl p-4 flex flex-col border border-white/10 shadow-2xl backdrop-blur-xl shrink-0 overflow-hidden">
        {/* Hub Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">Campus Hub</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-xs text-emerald-400 font-medium">{onlineCount} students active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {categories.map((category) => {
            const categoryChannels = CHANNELS.filter((c) => c.category === category);
            return (
              <div key={category} className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 pb-1">
                  {category}
                </p>
                {categoryChannels.map((channel) => {
                  const Icon = channel.icon;
                  const isActive = activeChannel.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-medium transition-all group ${
                        isActive
                          ? "bg-gradient-to-r from-primary-600/30 to-indigo-600/20 border border-primary-500/40 text-white shadow-md shadow-primary-500/10"
                          : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isActive
                            ? `bg-gradient-to-tr ${channel.color} text-white shadow-sm`
                            : "bg-white/5 text-gray-400 group-hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-semibold">{channel.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_6px_#818cf8]" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">#{channel.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Status Bar */}
        <div className="pt-3 border-t border-white/10 mt-auto">
          {loggedIn && currentUser ? (
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                  currentUser.name || "Student"
                )} flex items-center justify-center font-bold text-white text-sm shadow-md`}
              >
                {(currentUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentUser.name || "Student"}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </span>
                  {currentUser.role && (
                    <span className="text-[10px] uppercase font-bold bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded">
                      {currentUser.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-500 hover:from-primary-500 hover:to-indigo-400 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20"
            >
              <LogIn className="w-4 h-4" />
              Log In to Chat
            </Link>
          )}
        </div>
      </div>

      {/* RIGHT MAIN PANEL: Channel Chat Area */}
      <div className="flex-1 glass rounded-2xl flex flex-col border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Channel Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/20">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeChannel.color} flex items-center justify-center text-white shadow-lg shrink-0`}
            >
              {React.createElement(activeChannel.icon, { className: "w-5 h-5" })}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                  <span>#{activeChannel.name}</span>
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-xs font-normal">
                  {activeChannel.category}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-md hidden sm:block">
                {activeChannel.description}
              </p>
            </div>
          </div>

          {/* Search in channel */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-52 pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Connecting to #{activeChannel.name}...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${activeChannel.color} flex items-center justify-center text-white shadow-xl shadow-indigo-500/20`}
              >
                {React.createElement(activeChannel.icon, { className: "w-8 h-8" })}
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Welcome to #{activeChannel.name}!</h4>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {activeChannel.description}
                </p>
              </div>

              {/* Conversation Starter Chips */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  Start the conversation:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "👋 Hey campus fam!",
                    "🚀 Anyone working on cool projects?",
                    "📚 Who wants to study together?",
                    "⚡ Any upcoming events to check out?"
                  ].map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setText(starter);
                      }}
                      className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-all text-left"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const senderName = msg.user?.name || "Campus Peer";
              const senderRole = msg.user?.role;
              const senderEmail = msg.user?.email;
              const isMe =
                currentUser &&
                (msg.user?._id === currentUser._id ||
                  msg.user?._id === currentUser.id ||
                  senderEmail === currentUser.email);

              const formattedTime = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={msg._id || index}
                  className={`flex gap-3 items-end group ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {/* Left Avatar for other users */}
                  {!isMe && (
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                        senderName
                      )} flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0 mb-1`}
                      title={senderName}
                    >
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {/* Header info above bubble */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold text-gray-300">
                        {isMe ? "You" : senderName}
                      </span>
                      {senderRole && (
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            senderRole === "admin"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {senderRole}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formattedTime}
                      </span>
                    </div>

                    {/* Actual bubble text */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-lg transition-all ${
                        isMe
                          ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-none border border-primary-400/30 shadow-indigo-500/20"
                          : "bg-white/10 text-gray-100 rounded-bl-none border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Right Avatar for current user */}
                  {isMe && (
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                        currentUser.name || "You"
                      )} flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0 mb-1`}
                      title="You"
                    >
                      {(currentUser.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Emoji Toolbar */}
        {showEmojiPicker && (
          <div className="px-4 py-2 bg-surface/90 border-t border-white/10 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Quick reactions:</span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-base flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/30">
          {loggedIn ? (
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2.5 rounded-xl transition-all ${
                  showEmojiPicker
                    ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                    : "text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                />
              </div>

              <button
                type="submit"
                disabled={!text.trim() || sending}
                className={`p-3 rounded-xl font-medium flex items-center justify-center transition-all ${
                  text.trim() && !sending
                    ? "bg-gradient-to-r from-primary-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                }`}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-primary-950/40 to-indigo-950/40 border border-primary-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-300 pl-2">
                <GraduationCap className="w-4 h-4 text-primary-400" />
                <span>Join the campus conversation. Log in to post messages.</span>
              </div>
              <Link
                to="/login"
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-primary-500/20"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
