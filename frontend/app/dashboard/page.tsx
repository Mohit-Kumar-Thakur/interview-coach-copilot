"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/api";
import { exportSessionPDF } from "@/lib/pdf";
import { computeAnalytics } from "@/lib/analytics";
import { computeInsights } from "@/lib/insights";
import { computeMetrics } from "@/lib/metrics";
import { exportSessionJSON, exportSessionMarkdown } from "@/lib/exporter";
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
import { useProfileScore } from "@/hooks/useProfileScore";




type SessionItem = {
  session_id: string;
  round: string;
  difficulty: string;
  created_at: string;
  latest_score?: number | null;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
  evaluation?: {
    score: number;
  } | null;
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

  const { profileData: me } = useProfileScore(backendBase);

  const analytics = computeAnalytics(sessions);
  const insights = computeInsights(sessions);
  const metrics = computeMetrics(sessions);

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreHistory = useMemo(() => {
    if (!detail?.messages) return [];
    return detail.messages
      .filter(m => m.evaluation?.score !== undefined)
      .map(m => ({
        score: m.evaluation!.score,
        at: m.created_at,
      }));
  }, [detail]);

  const resumeSelected = () => {
    if (!detail?.session_id) return;
    router.push(`/interview?resume=${detail.session_id}`);
  };

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="app-title">Dashboard</h1>
          <p className="app-subtitle">Review past sessions and resume anytime</p>
        </div>

        <div className="flex items-center gap-3">
          {me?.email && <span className="badge">{me.email}</span>}
          {me?.profile_score !== undefined && (
            <div className="relative group">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  background: me.profile_score < 40
                    ? 'rgb(var(--danger) / 0.1)'
                    : me.profile_score < 71
                      ? 'rgb(var(--primary-muted) / 0.1)'
                      : 'rgb(var(--primary) / 0.1)',
                  color: me.profile_score < 40
                    ? 'rgb(var(--danger))'
                    : me.profile_score < 71
                      ? 'rgb(var(--primary-muted))'
                      : 'rgb(var(--primary))',
                  borderColor: me.profile_score < 40
                    ? 'rgb(var(--danger) / 0.3)'
                    : me.profile_score < 71
                      ? 'rgb(var(--primary-muted) / 0.3)'
                      : 'rgb(var(--primary) / 0.3)',
                }}
              >
                Profile Score: {me.profile_score}%
              </span>
              {/* Tooltip */}
              <div className="absolute hidden group-hover:block top-full mt-2 right-0 w-64 p-3 bg-white border rounded-lg shadow-lg text-xs z-10">
                <p className="font-semibold mb-1">How it&apos;s calculated:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Full Name: +25%</li>
                  <li>✓ College: +25%</li>
                  <li>✓ Department: +25%</li>
                  <li>✓ Graduation Year: +25%</li>
                </ul>
                <p className="mt-2 text-gray-500">Complete your profile to improve your score!</p>
              </div>
            </div>
          )}

          <Link className="underline text-sm" href="/">
            Home
          </Link>

          <Link className="underline text-sm" href="/interview">
            Interview
          </Link>

          <Link className="underline text-sm" href="/profile">
            Profile
          </Link>

          {me && me.profile_score !== undefined && me.profile_score < 50 && (
            <button
              onClick={() => router.push("/profile")}
              className="btn-primary"
            >
              Complete Profile
            </button>
          )}

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn-outline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {me?.profile_score !== undefined && (
        <ProfileCompletionBanner score={me.profile_score} />
      )}

      {/* Analytics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="app-card p-4">
          <p className="text-xs text-gray-500">Total Sessions</p>
          <p className="text-xl font-semibold">{analytics.total}</p>
        </div>

        <div className="app-card p-4">
          <p className="text-xs text-gray-500">HR Sessions</p>
          <p className="text-xl font-semibold">{analytics.byRound.HR}</p>
        </div>

        <div className="app-card p-4">
          <p className="text-xs text-gray-500">DSA Sessions</p>
          <p className="text-xl font-semibold">{analytics.byRound.DSA}</p>
        </div>

        <div className="app-card p-4">
          <p className="text-xs text-gray-500">Avg HR Score</p>
          <p className="text-xl font-semibold">
            {analytics.avgHrScore ?? "--"}
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="app-card p-4 mb-6">
        <h2 className="font-semibold mb-2">Progress Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Interviews</div>
            <div className="font-semibold">{metrics.total}</div>
          </div>

          <div>
            <div className="text-gray-500">HR Interviews</div>
            <div className="font-semibold">{metrics.hrCount}</div>
          </div>

          <div>
            <div className="text-gray-500">Avg HR Score</div>
            <div className="font-semibold">
              {metrics.avgHrScore ?? "--"}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Last Interview</div>
            <div className="font-semibold">
              {metrics.lastSessionDate ?? "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Interview Insights */}
      <div className="app-card p-4 mb-6">
        <h2 className="font-semibold mb-2">Interview Insights</h2>

        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium">Top Strength:</span>{" "}
            {insights.topStrength ?? "--"}
          </p>

          <p>
            <span className="font-medium">Needs Improvement:</span>{" "}
            {insights.topImprovement ?? "--"}
          </p>

          <p className="text-gray-600">
            {insights.recommendation ?? "Complete more HR interviews to unlock insights."}
          </p>
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
              Refresh
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              No sessions yet. Start an interview first.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => fetchSessionDetail(s.session_id)}
                  className={`w-full text-left border rounded-xl p-3 text-sm transition ${selectedSessionId === s.session_id
                    ? "border-black"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.round}</div>

                    {typeof s.latest_score === "number" && (
                      <span className="badge">Score: {s.latest_score}/10</span>
                    )}
                  </div>

                  <div className="text-xs break-words" style={{ color: "rgb(var(--subtext))" }}>
                    {s.session_id}
                  </div>

                  <div className="text-xs" style={{ color: "rgb(var(--subtext))" }}>
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Session detail */}
        <section className="col-span-12 md:col-span-8 app-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Session Detail</h2>

            <button
              onClick={resumeSelected}
              disabled={!detail?.session_id}
              className="btn-primary disabled:opacity-50"
            >
              Resume Session
            </button>
          </div>

          {detail && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => exportSessionJSON(detail)}
                className="btn-outline text-xs"
              >
                Export JSON
              </button>

              <button
                onClick={() => exportSessionMarkdown(detail)}
                className="btn-outline text-xs"
              >
                Export Markdown
              </button>
            </div>
          )}

          {!detail ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              Select a session from the left panel to view details.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <div>
                  <span className="font-medium">Session:</span>{" "}
                  <span style={{ color: "rgb(var(--subtext))" }}>{detail.session_id}</span>
                </div>
                <div>
                  <span className="font-medium">Round:</span>{" "}
                  <span style={{ color: "rgb(var(--subtext))" }}>{detail.round}</span>
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>{" "}
                  <span style={{ color: "rgb(var(--subtext))" }}>{detail.difficulty}</span>
                </div>
              </div>

              {scoreHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Score Trend</h3>

                  <div className="space-y-2">
                    {scoreHistory.slice(-5).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <span>{new Date(s.at).toLocaleTimeString()}</span>
                        <span className="font-medium">{s.score}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score History */}
              {detail.messages.filter(m => m.evaluation).length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold mb-2">Score History (Last 5)</h3>
                  <div className="flex gap-2 overflow-x-auto">
                    {detail.messages
                      .filter(m => m.evaluation)
                      .slice(-5)
                      .reverse()
                      .map((m, idx) => (
                        <div
                          key={idx}
                          className="border rounded-xl p-3 min-w-[120px]"
                          style={{ background: "rgb(var(--muted))", borderColor: "rgb(var(--border))" }}
                        >
                          <div className="text-lg font-bold">{m.evaluation?.score}/10</div>
                          <div className="text-xs" style={{ color: "rgb(var(--subtext))" }}>
                            {new Date(m.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {detail && (
                <button
                  onClick={() => exportSessionPDF(detail)}
                  className="text-sm border rounded-lg px-3 py-1 mb-3"
                >
                  Export PDF
                </button>
              )}

              <div className="border rounded-2xl p-4 h-[60vh] overflow-y-auto"
                style={{ background: "rgb(var(--muted))", borderColor: "rgb(var(--border))" }}>
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
