"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/api";

type SessionItem = {
  session_id: string;
  round: string;
  difficulty: string;
  created_at: string;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type SessionDetail = {
  session_id: string;
  round: string;
  difficulty: string;
  created_at: string;
  messages: Msg[];
};

export default function DashboardPage() {
  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  const [me, setMe] = useState<{ id: number; email: string } | null>(null);

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMe = async () => {
    try {
      const res = await safeFetch(`${backendBase}/api/me`);
      const data = await res.json();
      setMe(data);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") router.push("/login");
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const res = await safeFetch(`${backendBase}/api/sessions`);
      const data = await res.json();

      setSessions(Array.isArray(data) ? data : data.sessions ?? []);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        router.push("/login");
        return;
      }
      alert("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      setLoading(true);
      setSelectedSessionId(sessionId);

      const res = await safeFetch(`${backendBase}/api/sessions/${sessionId}`);
      const data = await res.json();

      setDetail(data);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        router.push("/login");
        return;
      }
      alert("Failed to load session detail.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMe();
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="app-title">Dashboard</h1>
          <p className="app-subtitle">View interview sessions and messages</p>
        </div>

        <div className="flex items-center gap-3">
          {me?.email && <span className="badge">{me.email}</span>}

          <Link className="text-sm underline" href="/">
            Home
          </Link>
          <Link className="text-sm underline" href="/interview">
            Interview
          </Link>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn-outline"
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sessions list */}
        <section className="col-span-12 md:col-span-4 app-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Session History</h2>

            <button
              onClick={fetchSessions}
              className="btn-outline"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              No sessions yet. Start an interview first.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const active = selectedSessionId === s.session_id;

                return (
                  <button
                    key={s.session_id}
                    onClick={() => fetchSessionDetail(s.session_id)}
                    className="w-full text-left rounded-xl p-3 text-sm transition border"
                    style={{
                      background: active ? "rgb(var(--muted))" : "rgb(var(--card))",
                      borderColor: active
                        ? "rgb(var(--primary))"
                        : "rgb(var(--border))",
                    }}
                  >
                    <div className="font-medium">{s.round}</div>
                    <div
                      className="text-xs break-words mt-1"
                      style={{ color: "rgb(var(--subtext))" }}
                    >
                      {s.session_id}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "rgb(var(--subtext))" }}
                    >
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Session detail */}
        <section className="col-span-12 md:col-span-8 app-card p-4">
          <h2 className="font-semibold mb-3">Session Detail</h2>

          {!detail ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              Select a session from the left panel to view messages.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <div>
                  <span className="font-medium">Session:</span>{" "}
                  {detail.session_id}
                </div>
                <div>
                  <span className="font-medium">Round:</span> {detail.round}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>{" "}
                  {detail.difficulty}
                </div>
              </div>

              <div
                className="border rounded-2xl p-4 h-[60vh] overflow-y-auto"
                style={{
                  background: "rgb(var(--muted))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <div className="space-y-3">
                  {detail.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className="max-w-[80%] rounded-xl px-3 py-2 text-sm border"
                      style={
                        m.role === "user"
                          ? {
                              marginLeft: "auto",
                              background: "rgb(var(--text))",
                              color: "white",
                              borderColor: "rgb(var(--text))",
                            }
                          : {
                              background: "rgb(var(--card))",
                              color: "rgb(var(--text))",
                              borderColor: "rgb(var(--border))",
                            }
                      }
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
