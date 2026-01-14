"use client";

import { useState } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi Mohit. Let's start your mock interview." },
    { role: "assistant", content: "Round: HR. Tell me about yourself." },
  ]);
  const [input, setInput] = useState("");
  const [healthStatus, setHealthStatus] = useState<string>("Not tested");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    setInput("");
  };

  const testBackend = async () => {
    try {
      setHealthStatus("Testing...");
      const res = await fetch("http://127.0.0.1:8000/health", { cache: "no-store" });

      const data = await res.json();
      setHealthStatus(JSON.stringify(data));
    } catch (err) {
      setHealthStatus("Backend not reachable / CORS issue");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Interview Session</h1>
        <div className="flex gap-3">
          <Link className="underline text-sm" href="/">
            Home
          </Link>
          <Link className="underline text-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left panel */}
        <section className="col-span-12 md:col-span-3 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Session Info</h2>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Round:</span> HR
            </div>
            <div>
              <span className="font-medium">Difficulty:</span> Medium
            </div>
            <div>
              <span className="font-medium">Timer:</span> 00:00 (placeholder)
            </div>
          </div>

          <button
            onClick={testBackend}
            className="mt-4 w-full rounded-lg bg-black text-white py-2 text-sm"
          >
            Test Backend
          </button>

          <p className="mt-2 text-xs text-gray-600 break-words">
            Health: {healthStatus}
          </p>
        </section>

        {/* Chat panel */}
        <section className="col-span-12 md:col-span-9 bg-white rounded-xl shadow p-4 flex flex-col h-[75vh]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-black text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
