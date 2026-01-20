"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/api";

type RoundType = "HR" | "DSA" | "SD";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Evaluation = {
  score: number;
  rubric: {
    clarity: number;
    structure: number;
    relevance: number;
    impact: number;
  };
  strengths: string[];
  improvements: string[];
  ideal_answer: string;
};

export default function InterviewPage() {
  const router = useRouter();
  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);

  const [round, setRound] = useState<RoundType>("HR");
  const [difficulty] = useState("medium");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [healthStatus, setHealthStatus] = useState<string>("Not tested");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearChat = () => {
    setMessages([]);
    setEvaluation(null);
    setInput("");
  };

  const testBackend = async () => {
    try {
      setHealthStatus("Testing...");
      const res = await fetch(`${backendBase}/health`, { cache: "no-store" });
      const data = await res.json();
      setHealthStatus(JSON.stringify(data));
    } catch {
      setHealthStatus("Backend not reachable / CORS issue");
    }
  };

  const startInterview = async () => {
    try {
      setLoading(true);
      setMessages([]);
      setSessionId(null);
      setEvaluation(null);

      const res = await safeFetch(`${backendBase}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round, difficulty }),
      });

      const data = await res.json();

      setSessionId(data.session_id);
      setMessages([{ role: "assistant", content: data.first_question }]);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        router.push("/login");
        return;
      }
      alert("Failed to start interview.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!sessionId) {
      alert("Start interview first.");
      return;
    }

    const userText = input.trim();
    setInput("");

    // optimistic UI update
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      setLoading(true);

      const res = await safeFetch(`${backendBase}/api/interview/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        router.push("/login");
        return;
      }
      alert("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="app-title">Interview Session</h1>
          <p className="app-subtitle">Practice HR / DSA / System Design rounds</p>
        </div>

        <div className="flex gap-3">
          <Link className="underline text-sm" href="/">
            Home
          </Link>
          <Link className="underline text-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: controls */}
        <section className="col-span-12 lg:col-span-3 app-card p-4">
          <h2 className="font-semibold mb-3">Session Controls</h2>

          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="round" className="font-medium block mb-1">
                Round
              </label>

              <select
                id="round"
                value={round}
                onChange={(e) => setRound(e.target.value as RoundType)}
                className="input"
                disabled={loading}
              >
                <option value="HR">HR</option>
                <option value="DSA">DSA</option>
                <option value="SD">System Design</option>
              </select>
            </div>

            <div>
              <span className="font-medium">Difficulty:</span>{" "}
              <span style={{ color: "rgb(var(--subtext))" }}>{difficulty}</span>
            </div>

            <div className="text-xs break-words">
              <span className="font-medium">Session ID:</span>{" "}
              <span style={{ color: "rgb(var(--subtext))" }}>
                {sessionId ? sessionId : "--"}
              </span>
            </div>

            <div className="text-xs break-words">
              <span className="font-medium">Health:</span>{" "}
              <span style={{ color: "rgb(var(--subtext))" }}>{healthStatus}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              onClick={startInterview}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? "Starting..." : "New Interview"}
            </button>

            <button
              onClick={clearChat}
              disabled={loading}
              className="btn-outline w-full disabled:opacity-60"
            >
              Clear Chat (UI)
            </button>
          </div>

          <button
            onClick={testBackend}
            className="btn-outline mt-3 w-full disabled:opacity-60"
            disabled={loading}
          >
            Test Backend
          </button>
        </section>

        {/* MIDDLE: chat */}
        <section className="col-span-12 lg:col-span-6 app-card p-4 flex flex-col h-[75vh]">
          <h2 className="font-semibold mb-3">Chat</h2>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.length === 0 ? (
              <div className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
                Click <b>New Interview</b> to begin.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className="max-w-[85%] rounded-xl px-3 py-2 text-sm border"
                  style={
                    m.role === "user"
                      ? {
                          marginLeft: "auto",
                          background: "rgb(var(--text))",
                          color: "white",
                          borderColor: "rgb(var(--text))",
                        }
                      : {
                          background: "rgb(var(--muted))",
                          color: "rgb(var(--text))",
                          borderColor: "rgb(var(--border))",
                        }
                  }
                >
                  {m.content}
                </div>
              ))
            )}

            {loading && (
              <div className="text-xs" style={{ color: "rgb(var(--subtext))" }}>
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="input flex-1"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </section>

        {/* RIGHT: evaluation */}
        <section className="col-span-12 lg:col-span-3 app-card p-4 h-[75vh] overflow-y-auto">
          <h2 className="font-semibold mb-3">Evaluation</h2>

          {!evaluation ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              No evaluation yet. Send an HR answer to see scoring.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Score */}
              <div
                className="border rounded-2xl p-4"
                style={{
                  background: "rgb(var(--muted))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score</span>
                  <span className="font-bold text-lg">{evaluation.score}/10</span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Clarity</span>
                    <span>{evaluation.rubric.clarity}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Structure</span>
                    <span>{evaluation.rubric.structure}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Relevance</span>
                    <span>{evaluation.rubric.relevance}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact</span>
                    <span>{evaluation.rubric.impact}/10</span>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div
                className="border rounded-2xl p-4"
                style={{
                  background: "rgb(var(--card))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <p className="font-semibold mb-2">Strengths</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div
                className="border rounded-2xl p-4"
                style={{
                  background: "rgb(var(--card))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <p className="font-semibold mb-2">Improvements</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Ideal Answer */}
              <div
                className="border rounded-2xl p-4"
                style={{
                  background: "rgb(var(--card))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <p className="font-semibold mb-2">Ideal Answer</p>
                <p className="text-xs whitespace-pre-wrap">
                  {evaluation.ideal_answer}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
