import { getRefreshToken, getUserData, setAuthTokens } from "./auth";
import { clearUserStates } from "./userCleanupService";

let isRefreshing = false;
let refreshPromise = null;

const isBrowser = () => typeof window !== "undefined";

// Helper function to get cookies
const getCookie = (name) => {
  if (!isBrowser()) return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Helper function to get client token
const getClientToken = () => {
  if (!isBrowser()) return "";

  return getCookie("clientToken") || "";
};

const refreshAccessToken = async (portalId) => {
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
          body: JSON.stringify({
            portalId,
            refreshToken: getRefreshToken(),
          }),
        },
      );

      if (!res.ok) {
        throw new Error("REFRESH_FAILED");
      }

      const data = await res.json();  
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
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

const RESERVED_PORTAL_SEGMENTS = new Set([
  "admin",
  "master",
  "login",
  "register",
  "api",
  "_next",
]);

const getActivePortalId = (user) => {
  if (isBrowser()) {
    const segment = window.location.pathname.split("/").filter(Boolean)[0];
    if (segment && !RESERVED_PORTAL_SEGMENTS.has(segment)) {
      return segment;
    }

    const storedPortal = localStorage.getItem("portal");
    if (storedPortal) return storedPortal;
  }

  return user?.portalId || "admin";
};

export const fetchWrapper = async (url, options = {}, type) => {
  // Get dynamic header values (e.g., from localStorage, cookies, or a session)

  const user = getUserData() || {
    id: null,
  };

  let portalId = getActivePortalId(user);

  if (options.body && typeof options.body === "string") {
    try {
      const parsedBody = JSON.parse(options.body);
      portalId =
        parsedBody.portalId ||
        parsedBody.portalid ||
        portalId;
    } catch (error) {
      console.warn("Failed to parse body for portalid:", error);
    }
  } else if (options.body && typeof options.body === "object") {
    portalId = options.body.portalId || options.body.portalid || portalId;
  }

  // Default headers
  const accessToken = getClientToken();
  const defaultHeaders = {
    "x-user-id": user.id,
    "x-portal-id": portalId,
    "x-api-type": type, // Replace with your API type logic
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
          const newAccessToken = await refreshAccessToken(portalId);
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
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

          if (isBrowser()) {
            localStorage.clear();
          }

          if (isBrowser()) {
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
