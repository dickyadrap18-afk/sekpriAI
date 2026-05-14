"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

function FormattedTime({ date }: { date: Date }) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    setFormatted(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [date]);
  return <p className="text-[10px] mt-1 text-right opacity-50">{formatted}</p>;
}

export function WhatsAppMock() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome", role: "bot",
    text: "Hey! I'm your sekpriAI assistant. Try: \"What's my latest email?\" or \"Any urgent emails today?\"",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text, timestamp: new Date() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`, role: "bot",
        text: data.response || "Sorry, something went wrong.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`, role: "bot",
        text: "Connection error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[520px] max-w-md mx-auto rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(201,169,110,0.12)", background: "rgba(8,8,16,0.6)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(201,169,110,0.08)", background: "rgba(8,8,16,0.8)" }}>
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
          style={{ background: "linear-gradient(135deg, #e8d5b0, #c9a96e)" }}>
          AI
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">sekpriAI</p>
          <p className="text-[11px] text-white/30">WhatsApp Demo</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400/60" />
          <span className="text-[11px] text-white/25">online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ background: "rgba(4,4,10,0.4)" }}
        aria-live="polite" aria-label="Chat messages">
        {messages.map((msg) => (
          <div key={msg.id}
            className={cn("max-w-[82%] rounded-xl px-3 py-2 text-sm",
              msg.role === "user" ? "ml-auto" : "mr-auto"
            )}
            style={msg.role === "user" ? {
              background: "linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.1))",
              border: "1px solid rgba(201,169,110,0.2)",
              color: "rgba(240,236,228,0.9)",
            } : {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(240,236,228,0.75)",
            }}>
            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            <FormattedTime date={msg.timestamp} />
          </div>
        ))}
        {loading && (
          <div className="mr-auto rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]/40"
                  style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(201,169,110,0.08)", background: "rgba(8,8,16,0.8)" }}>
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-xl p-2 text-black disabled:opacity-40 transition-all hover:scale-[1.05] active:scale-[0.95]"
          style={{ background: "linear-gradient(135deg, #e8d5b0, #c9a96e)" }}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
