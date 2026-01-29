import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell title="Home" subtitle="Start practicing interviews with session tracking">
      {/* Center container with gradient card */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="gradient-card">
          <h1 className="heading">Interview Coach Copilot</h1>
          <p className="description">
            AI Mock Interviewer + Rubric Evaluator + Progress Dashboard
          </p>

          <div className="flex gap-4 mt-4">
            <Link
              href="/interview"
              className="px-6 py-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              Start Interview
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg border-2 border-white/30 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
