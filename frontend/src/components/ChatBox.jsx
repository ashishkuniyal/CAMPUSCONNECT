import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Send, MessageSquare, Clock, Trash2 } from "lucide-react";
import { getAuthHeaders, getCurrentUser, isAuthenticated } from "../utils/api";

export default function ChatBox({ socket, eventId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = getCurrentUser();
  const loggedIn = isAuthenticated();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(`/api/chat/${eventId}`, { headers });
        setMessages(res.data || []);
        setTimeout(scrollToBottom, 50);
      } catch (e) {
        console.error("Failed to fetch event messages:", e);
      }
    };
    load();

    if (!socket) return;
    socket.emit("joinEvent", eventId);

    const handleMessage = (m) => {
      const msgEventId = m.eventId || m.event;
      if (String(msgEventId) === String(eventId)) {
        setMessages((p) => {
          if (m._id && p.some((item) => item._id === m._id)) return p;
          return [...p, m];
        });
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleDelete = (delId) => {
      setMessages((prev) => prev.filter(m => m._id !== delId));
    };

    socket.on("message", handleMessage);
    socket.on("messageDeleted", handleDelete);

    return () => {
      socket.emit("leaveEvent", eventId);
      socket.off("message", handleMessage);
      socket.off("messageDeleted", handleDelete);
    };
  }, [socket, eventId]);

  const send = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;
    if (!loggedIn) {
      alert("Login required to participate in event discussion");
      return;
    }

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`/api/chat`, { eventId, text: messageText }, { headers });
      const createdMsg = res.data;

      if (socket) {
        socket.emit("sendMessage", createdMsg);
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === createdMsg._id)) return prev;
        return [...prev, createdMsg];
      });

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send event message:", err);
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/chat/${msgId}`, { headers });
      setMessages((prev) => prev.filter(m => m._id !== msgId));
      if (socket) {
        socket.emit("deleteMessage", { eventId, msgId }); // We'll emit this so others update real-time
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 border border-white/10 shadow-xl mt-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
        <MessageSquare className="w-4 h-4 text-primary-400" />
        <h4 className="text-sm font-semibold text-white">Event Live Discussion</h4>
        <span className="text-xs text-gray-400 ml-auto">{messages.length} messages</span>
      </div>

      <div className="max-h-72 min-h-[140px] overflow-y-auto space-y-3 pr-2 mb-3">
        {messages.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
            <MessageSquare className="w-6 h-6 mb-1 text-gray-600" />
            No messages yet. Be the first to start the discussion!
          </div>
        ) : (
          messages.map((m, index) => {
            const senderName = m.user?.name || "Attendee";
            const isMe = currentUser && (m.user?._id === currentUser._id || m.user?._id === currentUser.id);
            const time = new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={m._id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5 px-1">
                  <span className="font-medium text-gray-300">{isMe ? "You" : senderName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <Clock className="w-2.5 h-2.5" />
                    {time}
                  </span>
                  {(isMe || currentUser?.role === "admin") && (
                    <button 
                      onClick={() => deleteMessage(m._id)}
                      className="text-gray-500 hover:text-rose-400 ml-1 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div
                  className={`px-3.5 py-2 rounded-xl text-xs leading-relaxed max-w-[85%] break-words ${
                    isMe
                      ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-none"
                      : "bg-white/10 text-gray-100 rounded-bl-none border border-white/5"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {loggedIn ? (
        <form onSubmit={send} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question or comment..."
            className="flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className={`p-2 rounded-xl text-white transition-all ${
              text.trim() && !sending
                ? "bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-500/20"
                : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="text-xs text-center py-2 text-gray-400 bg-white/5 rounded-xl border border-white/5">
          Please log in to join this event's discussion.
        </div>
      )}
    </div>
  );
}
