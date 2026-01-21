import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell title="Home" subtitle="Start practicing interviews with session tracking">
      <div className="bg-white rounded-2xl shadow p-10 max-w-xl w-full">
        <h1 className="text-3xl font-bold">Interview Coach Copilot</h1>
        <p className="text-gray-600 mt-2">
          AI Mock Interviewer + Rubric Evaluator + Progress Dashboard
        </p>

        <div className="flex gap-3 mt-6">
          <Link
            href="/interview"
            className="px-5 py-2 rounded-lg bg-black text-white text-sm"
          >
            Start Interview
          </Link>

          <Link
            href="/dashboard"
            className="px-5 py-2 rounded-lg border text-sm"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
