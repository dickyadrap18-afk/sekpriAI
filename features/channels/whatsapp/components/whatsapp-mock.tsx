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
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    setFormatted(
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [date]);

  return (
    <p className="text-[10px] text-gray-500 mt-1 text-right">
      {formatted}
    </p>
  );
}

export function WhatsAppMock() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Welcome to sekpriAI WhatsApp mock. Try: Summarize my latest email",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/whatsapp/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: data.response || "Sorry, something went wrong.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "bot",
          text: "Connection error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px] max-w-md mx-auto border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold">
          AI
        </div>
        <div>
          <p className="text-sm font-medium">sekpriAI</p>
          <p className="text-xs opacity-80">WhatsApp Mock (Demo)</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#ece5dd]"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              msg.role === "user"
                ? "ml-auto bg-[#dcf8c6] text-gray-900"
                : "mr-auto bg-white text-gray-900 shadow-sm"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
            <FormattedTime date={msg.timestamp} />
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-white rounded-lg px-3 py-2 shadow-sm">
            <p className="text-sm text-gray-500 animate-pulse">typing...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-2 bg-[#f0f0f0] border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-full bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
