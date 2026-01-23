"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { safeFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";

type Profile = {
  id: number;
  email: string;
  full_name: string | null;
  college: string | null;
  department: string | null;
  graduation_year: number | null;
  created_at?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);

  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState<string>("");

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const res = await safeFetch(`${backendBase}/api/users/me`);
      const data = await res.json();

      setMe(data);

      setFullName(data.full_name ?? "");
      setCollege(data.college ?? "");
      setDepartment(data.department ?? "");
      setGraduationYear(data.graduation_year ? String(data.graduation_year) : "");
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") router.push("/login");
      else alert("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = async () => {
    try {
      setLoading(true);

      const payload = {
        full_name: fullName.trim() || null,
        college: college.trim() || null,
        department: department.trim() || null,
        graduation_year: graduationYear.trim()
          ? Number(graduationYear.trim())
          : null,
      };

      const res = await safeFetch(`${backendBase}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setMe(data.user ? { ...me!, ...data.user } : me);

      alert("Profile updated ✅");
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") router.push("/login");
      else alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="User Profile"
      subtitle="Manage your details for better personalization"
    >
      <div className="max-w-3xl">
        <section className="app-card p-6">
          {!me ? (
            <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
              Loading profile...
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Account</h2>
                  <p className="text-sm" style={{ color: "rgb(var(--subtext))" }}>
                    {me.email}
                  </p>
                </div>

                <button
                  onClick={fetchMe}
                  disabled={loading}
                  className="btn-outline disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Full Name
                  </label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">
                    Graduation Year
                  </label>
                  <input
                    className="input"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2028"
                    disabled={loading}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">College</label>
                  <input
                    className="input"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="University of Delhi"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">
                    Department
                  </label>
                  <input
                    className="input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="ECE"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="btn-primary disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-outline"
                >
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
