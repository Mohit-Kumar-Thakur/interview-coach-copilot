import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link className="underline text-sm" href="/">
          Home
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-600">Avg Score</p>
          <p className="text-2xl font-semibold mt-2">--</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-600">Sessions</p>
          <p className="text-2xl font-semibold mt-2">--</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-600">Weak Topic</p>
          <p className="text-2xl font-semibold mt-2">--</p>
        </div>
      </div>
    </main>
  );
}
