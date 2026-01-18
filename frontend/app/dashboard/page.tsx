"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authHeader, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${backendBase}/api/sessions`, {
        method: "GET",
        headers: {
          ...authHeader(),
        },
        cache: "no-store",
      });

      const data = await res.json();

      // backend may return { sessions: [...] }
      const list = Array.isArray(data) ? data : data.sessions;
      setSessions(list ?? []);
    } catch (e) {
      console.error(e);
      alert("Failed to load sessions. Check backend running on :8000");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      setLoading(true);
      setSelectedSessionId(sessionId);

      const res = await fetch(`${backendBase}/api/sessions/${sessionId}`, {
        method: "GET",
        headers: {
          ...authHeader(),
        },
        cache: "no-store",
      });

      const data = await res.json();

      // safety: backend may return { session: {...} }
      const sessionDetail = data.session ?? data;
      setDetail(sessionDetail);
    } catch (e) {
      console.error(e);
      alert("Failed to load session detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-3">
          <Link className="underline text-sm" href="/">
            Home
          </Link>
          <Link className="underline text-sm" href="/interview">
            Interview
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sessions list */}
        <section className="col-span-12 md:col-span-4 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Session History</h2>
            <button
              onClick={fetchSessions}
              className="text-sm border rounded-lg px-3 py-1"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-600">
              No sessions yet. Start an interview first.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => fetchSessionDetail(s.session_id)}
                  className={`w-full text-left border rounded-lg p-3 text-sm hover:bg-gray-50 ${
                    selectedSessionId === s.session_id ? "border-black" : ""
                  }`}
                >
                  <div className="font-medium">{s.round}</div>
                  <div className="text-xs text-gray-600 break-words">
                    {s.session_id}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Session detail */}
        <section className="col-span-12 md:col-span-8 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Session Detail</h2>

          {!detail ? (
            <p className="text-sm text-gray-600">
              Select a session from the left panel to view messages.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <div>
                  <span className="font-medium">Session:</span> {detail.session_id}
                </div>
                <div>
                  <span className="font-medium">Round:</span> {detail.round}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>{" "}
                  {detail.difficulty}
                </div>
              </div>

              <div className="border rounded-xl p-4 h-[60vh] overflow-y-auto bg-gray-50">
                <div className="space-y-3">
                  {detail.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "ml-auto bg-black text-white"
                          : "bg-white text-gray-900 border"
                      }`}
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
