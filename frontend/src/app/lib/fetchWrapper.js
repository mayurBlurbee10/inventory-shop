import { getUserData } from "@/lib/auth";
import { clearUserStates } from "./userCleanupService";

let isRefreshing = false;
let refreshPromise = null;

  const setClientTokenCookie = (accessToken) => {
    document.cookie = `clientToken=${accessToken}; path=/; max-age=${1 * 24 * 60 * 60}; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure;" : ""}`;
  };
  const setClientRefreshTokenCookie = (refreshToken) => {
    document.cookie = `clientRefreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure;" : ""}`;
  };

const refreshAccessToken = async (portalId, options = {}) => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
          ...options,
          body: JSON.stringify({ portalId }),
        },
      );

      if (!res.ok) {
        throw new Error("REFRESH_FAILED");
      }

      const data = await res.json();  
      setClientTokenCookie(data.accessToken);
      setClientRefreshTokenCookie(data.refreshToken);
      return data.accessToken;
    } catch (err) {
      clearUserStates();
      throw err;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const fetchWithAuth = async (url, options = {}) => {
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
    ...options,
    credentials: "include",
  });
};

export const fetchWrapper = async (url, options = {}, type) => {
  // Get dynamic header values (e.g., from localStorage, cookies, or a session)

  const user = getUserData() || {
    id: null,
  };
  const portal = localStorage.getItem("portal");

  let portalId = "admin"; // default

  if (options.body && typeof options.body === "string") {
    try {
      const parsedBody = JSON.parse(options.body);
      portalId = user?.portalId || parsedBody.portalid || "admin";
    } catch (error) {
      console.warn("Failed to parse body for portalid:", error);
      portalId = user?.portalId || "admin";
    }
  } else if (options.body && typeof options.body === "object") {
    portalId = user?.portalId || options.body.portalid || "admin";
  } else {
    portalId = user?.portalId || "admin";
  }

  // Default headers
  const defaultHeaders = {
    "x-user-id": user.id,
    "x-portal-id": portalId,
    "x-api-type": type, // Replace with your API type logic
  };

  // Merge headers
  options.headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  try {
    // Make the fetch call
    // console.log(`🛠️ API Call from fetchWrapper → URL: ${url} | Type: ${type}`);
    // console.trace();  // This prints the function call stack
    const response = await fetchWithAuth(url, options);

    if (response.status === 401) {
      // If the request is to the login endpoint, do not attempt token refresh or redirect.
      const isLoginRequest = url.includes('/auth/login') || url.includes('/login');
      if (isLoginRequest) {
        return response;
      }

      try {
        try {
          await refreshAccessToken(portalId, options);
        } catch (error) {
          let loginPath = portalId !== "admin" ? `/${portalId}/login` : "/login";

          try {
            // Use raw fetch instead of fetchWrapper to avoid infinite recursion on 401
            const portalResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/portal?portalid=${portalId}`,
            );

            if (portalResponse.ok) {
              const result = await portalResponse.json();
              const portalData = result?.data;
              // Use slug if available, fallback to sanitized legalName
              const slug =
                portalData?.slug ||
                (portalData?.legalName
                  ? portalData.legalName.trim().toLowerCase().replace(/\s+/g, "-")
                  : null);
              if (slug && slug !== "default") {
                loginPath = `/${slug}/login`;
              }
            }
          } catch (error) {
            console.warn(
              "Failed to fetch portal details for redirect:",
              error.message,
            );
          }

          localStorage.clear();

          if (typeof window !== "undefined") {
            window.location.href = loginPath;
          }
        }

        // ✅ Retry request once
        const retryResponse = await fetchWithAuth(url, options);

        return retryResponse;
      } catch (err) {
        console.error("[Auth] Refresh failed");
        return response; // fallback
      }
    }
    else {
      return response;
    }
  } catch (error) {
    console.error("Fetch error:", error.message);
    throw error;
  }
};
