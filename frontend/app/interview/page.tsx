"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { authHeader } from "@/lib/auth";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



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
  const [round, setRound] = useState<RoundType>("HR");
  const [difficulty] = useState("medium");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [healthStatus, setHealthStatus] = useState<string>("Not tested");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);

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

      const res = await fetch(`${backendBase}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ round, difficulty }),
      });

      const data = await res.json();

      setSessionId(data.session_id);
      setMessages([{ role: "assistant", content: data.first_question }]);
    } catch {
      alert("Failed to start interview. Check backend running on :8000");
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

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      setLoading(true);

      const res = await fetch(`${backendBase}/api/interview/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      });

      const data = await res.json();
      const router = useRouter();

      useEffect(() => {
  if (!getToken()) router.push("/login");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


      // Add assistant reply
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // Store evaluation if present (HR only)
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch {
      alert("Failed to send message. Check backend + CORS.");
    } finally {
      setLoading(false);
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

      <div className="grid grid-cols-12 gap-6">
        {/* Left panel */}
        <section className="col-span-12 md:col-span-3 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Session Info</h2>

          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="round" className="font-medium block mb-1">
                Round
              </label>
              <select
                id="round"
                name="round"
                aria-label="Round"
                value={round}
                onChange={(e) => setRound(e.target.value as RoundType)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="HR">HR</option>
                <option value="DSA">DSA</option>
                <option value="SD">System Design</option>
              </select>
            </div>

            <div>
              <span className="font-medium">Difficulty:</span> {difficulty}
            </div>

            <div className="text-xs break-words">
              <span className="font-medium">Session ID:</span>{" "}
              {sessionId ? sessionId : "--"}
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-black text-white py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Starting..." : "Start Interview"}
          </button>

          <button
            onClick={testBackend}
            className="mt-3 w-full rounded-lg border py-2 text-sm"
          >
            Test Backend
          </button>

          <p className="mt-2 text-xs text-gray-700 break-words">
            Health: {healthStatus}
          </p>
        </section>

        {/* Chat + Evaluation panel */}
        <section className="col-span-12 md:col-span-9 bg-white rounded-xl shadow p-4 h-[75vh]">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Chat side */}
            <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Click <b>Start Interview</b> to begin.
                  </div>
                ) : (
                  messages.map((m, idx) => (
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
                  ))
                )}
              </div>

              {/* Input */}
              <div className="mt-4 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
                >
                  {loading ? "..." : "Send"}
                </button>
              </div>
            </div>

            {/* Evaluation side */}
            <div className="col-span-12 lg:col-span-4 border rounded-xl p-4 bg-gray-50 overflow-y-auto text-gray-900">
              <h3 className="font-semibold mb-3">Evaluation</h3>

              {!evaluation ? (
                <p className="text-sm text-gray-700">
                  No evaluation yet. Send an HR answer to see scoring.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Score</span>
                      <span className="font-bold text-lg">
                        {evaluation.score}/10
                      </span>
                    </div>

                    <div className="mt-3 text-sm space-y-1">
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
                  <div className="bg-white border rounded-xl p-4">
                    <p className="font-semibold mb-2">Strengths</p>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-gray-800">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-white border rounded-xl p-4">
                    <p className="font-semibold mb-2">Improvements</p>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-gray-800">
                      {evaluation.improvements.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Ideal Answer */}
                  <div className="bg-white border rounded-xl p-4">
                    <p className="font-semibold mb-2">Ideal Answer</p>
                    <p className="text-sm text-gray-800">
                      {evaluation.ideal_answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
