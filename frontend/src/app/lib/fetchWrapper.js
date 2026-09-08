import { getRefreshToken, getUserData, setAuthTokens } from "./auth";
import { clearUserStates } from "./userCleanupService";
import {
  encryptApiPayload,
  decryptApiPayload,
  encryptSessionKeyWithRSA,
  serializeFormData,
} from "./cryptoAsymmetric";

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
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            portalId,
            refreshToken: getRefreshToken(),
          }),
        }
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

const wrapResponseWithDecryption = (response, rawSessionKey) => {
  if (!response || !response.json) return response;

  const originalJson = response.json.bind(response);
  response.json = async () => {
    const data = await originalJson();
    if (data && typeof data === "object" && data.iv && data.data && data.tag && rawSessionKey) {
      return await decryptApiPayload(data, rawSessionKey);
    }
    return data;
  };
  return response;
};

export const fetchWrapper = async (url, options = {}, type) => {
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
    "x-api-type": type,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  // Merge headers
  options.headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Request Encryption Flow
  let rawSessionKey = null;
  const method = (options.method || "GET").toUpperCase();
  const isEncryptionEnabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === "true";

  if (isEncryptionEnabled) {
    if (["POST", "PUT", "PATCH"].includes(method) && options.body) {
      let bodyData = options.body;
      if (typeof bodyData === "string") {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (err) {
          // Keep string if non-JSON
        }
      }
      const isFormData =
        typeof FormData !== "undefined" && bodyData instanceof FormData;
      const isPlainObject =
        typeof bodyData === "object" && bodyData !== null && !isFormData;

      if (isFormData || isPlainObject) {
        try {
          const dataToEncrypt = isFormData
            ? await serializeFormData(bodyData)
            : bodyData;
          const { payload, rawSessionKey: key } =
            await encryptApiPayload(dataToEncrypt);
          rawSessionKey = key;
          options.body = JSON.stringify(payload);

          const nextHeaders = { ...(options.headers || {}) };
          if (nextHeaders["Content-Type"]?.includes("multipart/form-data")) {
            delete nextHeaders["Content-Type"];
          }
          if (nextHeaders["content-type"]?.includes("multipart/form-data")) {
            delete nextHeaders["content-type"];
          }
          options.headers = {
            ...nextHeaders,
            "Content-Type": "application/json",
            "x-api-encrypted": "true",
          };
        } catch (encryptError) {
          console.warn("[fetchWrapper] Request encryption warning:", encryptError.message);
        }
      }
    } else if (method === "GET" && isBrowser()) {
      const sessionKeyRaw = window.crypto.getRandomValues(new Uint8Array(32));
      rawSessionKey = sessionKeyRaw;
      const publicKeyPem =
        process.env.NEXT_PUBLIC_SERVER_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_SERVER_PUBLIC_ENCRYPTION_KEY;
      if (publicKeyPem) {
        const encryptedKey = await encryptSessionKeyWithRSA(sessionKeyRaw, publicKeyPem);
        if (encryptedKey) {
          options.headers = {
            ...options.headers,
            "x-session-key": encryptedKey,
            "x-api-encrypted": "true",
          };
        }
      }
    }
  }

  try {
    const response = await fetchWithAuth(url, options);

    if (response.status === 401) {
      const isLoginRequest = url.includes("/auth/login") || url.includes("/login");
      if (isLoginRequest) {
        return wrapResponseWithDecryption(response, rawSessionKey);
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
            const portalResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/portal?portalid=${portalId}`
            );

            if (portalResponse.ok) {
              const result = await portalResponse.json();
              const portalData = result?.data;
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
              error.message
            );
          }

          if (isBrowser()) {
            localStorage.clear();
          }

          if (isBrowser()) {
            window.location.href = loginPath;
          }
        }

        // Retry request once
        const retryResponse = await fetchWithAuth(url, options);
        return wrapResponseWithDecryption(retryResponse, rawSessionKey);
      } catch (err) {
        console.error("[Auth] Refresh failed");
        return wrapResponseWithDecryption(response, rawSessionKey);
      }
    } else {
      return wrapResponseWithDecryption(response, rawSessionKey);
    }
  } catch (error) {
    console.error("Fetch error:", error.message);
    throw error;
  }
};
