"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AppShell({ title, subtitle, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setHasToken(!!getToken());
    setReady(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Modern Navbar with Transparency */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-5 py-3">
          <div className="flex justify-between items-center">
            {/* Left Section: Navigation */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                  stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              </button>
            </div>

            {/* Right Section: Navigation + Profile */}
            <div className="flex items-center gap-3">
              {ready && hasToken && (
                <>
                  <div className="hidden lg:flex items-center gap-2">
                    <Link href="/dashboard" className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/interview" className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors">
                      Interview
                    </Link>
                    <Link href="/profile" className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors">
                      Profile
                    </Link>
                  </div>

                  {/* User Profile Icon */}
                  <div className="relative group">
                    <button className="w-8 h-8 rounded-full ring-2 ring-white overflow-hidden hover:ring-yellow-300 transition-all">
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        U
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                          My Profile
                        </Link>
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            router.push("/login");
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Login Button for Non-authenticated Users */}
              {ready && !hasToken && (
                <Link href="/login" className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && ready && hasToken && (
          <div className="lg:hidden bg-indigo-700/95 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link href="/dashboard" className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm">
                Dashboard
              </Link>
              <Link href="/interview" className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm">
                Interview
              </Link>
              <Link href="/profile" className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm">
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="block w-full text-left text-red-300 hover:bg-white/10 px-3 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content with Top Padding */}
      <main className="pt-20 px-6 pb-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
