import { authHeader, logout } from "@/lib/auth";

export async function safeFetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeader(),
    },
    cache: "no-store",
  });

  // Token invalid / expired
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("UNAUTHORIZED");
  }

  return res;
}
