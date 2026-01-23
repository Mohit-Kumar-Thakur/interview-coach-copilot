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

  // IMPORTANT: start with null so SSR + first client render match
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // runs only on client
    setHasToken(!!getToken());
    setReady(true);
  }, []);

  return (
    <main className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="app-title">{title}</h1>
          {subtitle && <p className="app-subtitle">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Link className="underline text-sm" href="/">
            Home
          </Link>
          

          {ready && hasToken && (
            <>
              <Link className="underline text-sm" href="/dashboard">
                Dashboard
              </Link>

              <Link className="underline text-sm" href="/interview">
                Interview
              </Link>
              <Link href="/profile" className="underline text-sm">
                Profile
              </Link>
              


              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="btn-outline"
              >
                Logout
              </button>
            </>
          )}

          {ready && !hasToken && (
            <Link className="underline text-sm" href="/login">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Page content */}
      {children}
    </main>
  );
}
