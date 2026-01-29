"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useSearchParams } from "next/navigation";
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
import { useProfileScore } from "@/hooks/useProfileScore";
import { showToast } from "@/lib/toast";


type RoundType = "HR" | "DSA" | "SD";

type Role = "user" | "assistant";

type Message = {
  role: Role;
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

const STORAGE = {
  round: "icc_round",
  sessionId: "icc_session_id",
  messages: "icc_messages",
  evaluation: "icc_evaluation",
};

function normalizeRole(r: any): Role {
  return r === "user" ? "user" : "assistant";
}

function normalizeMessages(input: any): Message[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((m) => ({
      role: normalizeRole(m?.role),
      content: String(m?.content ?? ""),
    }))
    .filter((m) => m.content.trim().length > 0);
}

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

  const [resumeId, setResumeId] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const { profileData: profile } = useProfileScore(backendBase);


  const persistState = (
    next: Partial<{
      round: RoundType;
      sessionId: string | null;
      messages: Message[];
      evaluation: Evaluation | null;
    }>
  ) => {
    if (typeof window === "undefined") return;

    if (typeof next.round !== "undefined") {
      localStorage.setItem(STORAGE.round, next.round);
    }

    if (typeof next.sessionId !== "undefined") {
      if (next.sessionId) localStorage.setItem(STORAGE.sessionId, next.sessionId);
      else localStorage.removeItem(STORAGE.sessionId);
    }

    if (typeof next.messages !== "undefined") {
      localStorage.setItem(STORAGE.messages, JSON.stringify(next.messages));
    }

    if (typeof next.evaluation !== "undefined") {
      if (next.evaluation)
        localStorage.setItem(STORAGE.evaluation, JSON.stringify(next.evaluation));
      else localStorage.removeItem(STORAGE.evaluation);
    }
  };

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved session state
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedRound = localStorage.getItem(STORAGE.round) as RoundType | null;
      const savedSessionId = localStorage.getItem(STORAGE.sessionId);
      const savedMessages = localStorage.getItem(STORAGE.messages);
      const savedEvaluation = localStorage.getItem(STORAGE.evaluation);

      if (savedRound) setRound(savedRound);
      if (savedSessionId) setSessionId(savedSessionId);

      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(normalizeMessages(parsed));
      }

      if (savedEvaluation) {
        const parsedEval = JSON.parse(savedEvaluation);
        setEvaluation(parsedEval);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    const sid = searchParams.get("resume");
    if (sid) {
      setResumeId(sid);
      // call resume automatically
      setTimeout(() => resumeSession(), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const clearChat = () => {
    setMessages([]);
    setEvaluation(null);
    setInput("");

    persistState({ messages: [], evaluation: null });
  };

  const clearLocalStorageForSession = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE.sessionId);
    localStorage.removeItem(STORAGE.messages);
    localStorage.removeItem(STORAGE.evaluation);
    // Keep round preference

    // Also clear state
    setSessionId(null);
    setMessages([]);
    setEvaluation(null);
  };

  const resumeSession = async () => {
    // Clear previous error
    setResumeError(null);

    if (!resumeId.trim()) {
      setResumeError("Please enter a session ID");
      return;
    }

    try {
      setLoading(true);

      const res = await safeFetch(
        `${backendBase}/api/interview/session/${resumeId.trim()}`
      );
      const data = await res.json();

      const normalized = normalizeMessages(data.messages);

      setRound(data.round);
      setSessionId(data.session_id);
      setMessages(normalized);
      setEvaluation(data.evaluation || null);

      persistState({
        round: data.round,
        sessionId: data.session_id,
        messages: normalized,
        evaluation: data.evaluation || null,
      });

      showToast("Session resumed successfully", "success");
      setResumeError(null);
      setResumeId(""); // Clear input on success
    } catch (err: any) {
      // Clear localStorage on resume error
      clearLocalStorageForSession();

      // Handle specific error codes
      if (err.code === 404) {
        setResumeError("Session not found. It may have been deleted.");
      } else if (err.code === 403) {
        setResumeError("Access denied. This session belongs to another account.");
      } else if (err.code === 401) {
        // 401 already handled by safeFetch (logout + redirect)
        // But set message in case we're still here
        setResumeError("Session expired. Please login again.");
      } else {
        setResumeError("Failed to resume session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
      persistState({ sessionId: null, messages: [], evaluation: null });

      const res = await safeFetch(`${backendBase}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round, difficulty }),
      });

      const data = await res.json();

      const firstMsg: Message = {
        role: "assistant",
        content: String(data.first_question ?? ""),
      };

      setSessionId(data.session_id);
      setMessages([firstMsg]);

      persistState({
        round,
        sessionId: data.session_id,
        messages: [firstMsg],
        evaluation: null,
      });
    } catch (err: any) {
      // Error already handled by safeFetch
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

    // optimistic: add USER message
    setMessages((prev) => {
      const next: Message[] = [...prev, { role: "user", content: userText }];
      persistState({ messages: next });
      return next;
    });

    try {
      setLoading(true);

      const res = await safeFetch(`${backendBase}/api/interview/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: String(data.reply ?? ""),
      };

      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        persistState({ messages: next });
        return next;
      });

      if (data.evaluation) {
        setEvaluation(data.evaluation);
        persistState({ evaluation: data.evaluation });
      }
    } catch (err: any) {
      // Error already handled by safeFetch
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Interview Session" subtitle="Practice HR / DSA / System Design rounds">
      {/* Profile Completion Banner */}
      {profile?.profile_score !== undefined && (
        <ProfileCompletionBanner score={profile.profile_score} />
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT - Session Controls */}
        <section className="col-span-12 lg:col-span-3 bg-zinc-800/70 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-zinc-700/50">
          <div className="px-4 py-3 border-b border-zinc-700/50 bg-zinc-900/40">
            <h2 className="text-lg font-semibold text-white">Session Controls</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm">
              <div>
                <label htmlFor="round" className="font-medium block mb-1 text-white">
                  Round
                </label>

                <select
                  id="round"
                  value={round}
                  onChange={(e) => {
                    const r = e.target.value as RoundType;
                    setRound(r);
                    persistState({ round: r });
                  }}
                  className="input"
                  disabled={loading}
                >
                  <option value="HR">HR</option>
                  <option value="DSA">DSA</option>
                  <option value="SD">System Design</option>
                </select>
              </div>

              <div>
                <span className="font-medium text-white">Difficulty:</span>{" "}
                <span className="text-zinc-400">{difficulty}</span>
              </div>

              <div className="text-xs break-words">
                <span className="font-medium text-white">Session ID:</span>{" "}
                <span className="text-zinc-400">
                  {sessionId ? sessionId : "--"}
                </span>
              </div>

              <div className="text-xs break-words">
                <span className="font-medium text-white">Health:</span>{" "}
                <span className="text-zinc-400">{healthStatus}</span>
              </div>
            </div>

            {/* Resume */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-white">Resume Session ID</label>

              <input
                value={resumeId}
                onChange={(e) => {
                  setResumeId(e.target.value);
                  setResumeError(null); // Clear error on type
                }}
                placeholder="session_xxxxxxxx"
                className={`input ${resumeError ? 'border-red-500' : ''}`}
                disabled={loading}
              />

              {/* Inline Error Message */}
              {resumeError && (
                <div
                  className="text-xs px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-500"
                >
                  {resumeError}
                </div>
              )}

              <button
                onClick={resumeSession}
                disabled={loading}
                className="btn-outline w-full disabled:opacity-60"
              >
                Resume Session
              </button>
            </div>

            {profile && profile.profile_score !== undefined && profile.profile_score < 50 && (
              <div className="mt-4">
                <p className="text-xs mb-2 text-red-500">
                  Profile is incomplete. Completing profile improves evaluation relevance.
                </p>

                <button
                  onClick={() => router.push("/profile")}
                  className="btn-primary w-full"
                >
                  Complete Profile
                </button>
              </div>
            )}

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

            {profile && (
              <div className="mt-4 border rounded-2xl p-3 bg-zinc-700/50 border-indigo-500/50 backdrop-blur-sm">
                <p className="text-xs font-semibold mb-2 text-indigo-400">Profile</p>
                <p className="text-xs text-zinc-400">
                  {profile.full_name || "No name"} • {profile.department || "No dept"} •{" "}
                  {profile.college || "No college"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* MIDDLE - Chat Section with Chatbot Design */}
        <section className="col-span-12 lg:col-span-6 bg-zinc-800/70 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden flex flex-col h-[75vh] border border-zinc-700/50">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-zinc-700/50 bg-zinc-900/40">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Chat</h2>
              {sessionId && (
                <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  Active
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2">
            {messages.length === 0 ? (
              <div className="text-sm text-zinc-400 text-center mt-8">
                Click <b>New Interview</b> to begin.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`chat-message max-w-xs rounded-lg px-3 py-2 text-sm ${m.role === "user"
                    ? "self-end bg-indigo-500/80 text-white backdrop-blur-sm"
                    : "self-start bg-zinc-700/70 text-white backdrop-blur-sm"
                    }`}
                >
                  {m.content}
                </div>
              ))
            )}

            {loading && (
              <div className="text-xs text-zinc-400">
                Thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-3 py-2 border-t border-zinc-700/50 bg-zinc-900/40">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg bg-zinc-700/60 text-white border-zinc-600/50 text-sm outline-none focus:border-indigo-400 focus:bg-zinc-700/80 transition-colors backdrop-blur-sm placeholder-zinc-400"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="glow-button disabled:opacity-60"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT - Evaluation */}
        <section className="col-span-12 lg:col-span-3 bg-zinc-800/70 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-zinc-700/50 h-[75vh]">
          <div className="px-4 py-3 border-b border-zinc-700/50 bg-zinc-900/40">
            <h2 className="text-lg font-semibold text-white">Evaluation</h2>
          </div>

          {!evaluation ? (
            <p className="p-4 text-sm text-zinc-400">
              No evaluation yet. Send an HR answer to see scoring.
            </p>
          ) : (
            <div className="p-4 space-y-4 text-sm overflow-y-auto" style={{ maxHeight: 'calc(75vh - 60px)' }}>
              <div
                className="border rounded-2xl p-4 bg-zinc-700/50 border-indigo-500/50 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-indigo-400">Score</span>
                  <span className="font-bold text-lg text-white">{evaluation.score}/10</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
