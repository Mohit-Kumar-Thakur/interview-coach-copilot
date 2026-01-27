import { authHeader, logout } from "@/lib/auth";
import { showToast } from "@/lib/toast";

export type ApiError = {
  code: number;
  message: string;
};

export class ApiException extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiException";
  }
}

/**
 * Safe fetch wrapper with centralized error handling
 * - 401: Logout + redirect to /login
 * - 403: Show forbidden error
 * - 5xx: Show generic server error
 * - 4xx: Parse and show error message
 * - Network errors: Show connection error
 */
export async function safeFetch(url: string, init: RequestInit = {}) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...authHeader(),
      },
      cache: "no-store",
    });

    // Handle different status codes
    if (!res.ok) {
      const code = res.status;
      let message = "An error occurred";

      // Try to parse error message from response
      try {
        const errorData = await res.json();
        message = errorData.detail || errorData.message || message;
      } catch {
        // If response is not JSON, use default messages
        if (code === 401) {
          message = "Session expired. Please login again.";
        } else if (code === 403) {
          message = "Access forbidden";
        } else if (code >= 500) {
          message = "Server error. Please try again later.";
        } else if (code >= 400) {
          message = `Request failed (${code})`;
        }
      }

      // Handle specific status codes
      if (code === 401) {
        // Unauthorized - logout and redirect
        logout();
        showToast(message, "error");

        // Redirect to login (unless already on login page)
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        throw new ApiException(code, message);
      }

      if (code === 403) {
        // Forbidden - show error but don't logout (might be permission issue)
        showToast(message, "error");
        throw new ApiException(code, message);
      }

      if (code >= 500) {
        // Server error - show generic message
        showToast(message, "error");
        throw new ApiException(code, message);
      }

      // Other 4xx errors - show specific message
      showToast(message, "error");
      throw new ApiException(code, message);
    }

    return res;
  } catch (error) {
    // Network errors or other fetch failures
    if (error instanceof ApiException) {
      // Re-throw our custom exceptions
      throw error;
    }

    // Network error or other unforeseen error
    const message = "Network error. Please check your connection.";
    showToast(message, "error");
    throw new ApiException(0, message);
  }
}
