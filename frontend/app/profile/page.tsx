"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { safeFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useProfileScore, type ProfileData } from "@/hooks/useProfileScore";
import { getProfileScoreProgressColor, getProfileScoreMessage } from "@/lib/profile-utils";
import { showToast } from "@/lib/toast";



export default function ProfilePage() {
  const router = useRouter();
  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState<string>("");

  const { profileData: me, refreshScore } = useProfileScore(backendBase);

  // Route protection
  useEffect(() => {
    if (!getToken()) router.push("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize form fields when profile data loads
  useEffect(() => {
    if (me) {
      setFullName(me.full_name ?? "");
      setCollege(me.college ?? "");
      setDepartment(me.department ?? "");
      setGraduationYear(me.graduation_year ? String(me.graduation_year) : "");
    }
  }, [me]);

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

      await safeFetch(`${backendBase}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Refresh cache after successful update
      refreshScore();

      showToast("Profile updated ✅", "success");
    } catch (err: any) {
      // Error already handled by safeFetch
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
                  onClick={refreshScore}
                  disabled={loading}
                  className="btn-outline disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              {/* Profile Completeness Progress Bar */}
              {me?.profile_score !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Profile Completeness</h3>
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {/* Tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                          <p>Profile completeness impacts interview feedback quality.</p>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{me.profile_score}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${me.profile_score}%`,
                        background: getProfileScoreProgressColor(me.profile_score),
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {getProfileScoreMessage(me.profile_score)}
                  </p>
                </div>
              )}

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
