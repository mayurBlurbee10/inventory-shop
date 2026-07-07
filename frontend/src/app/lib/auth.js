"use client";

import { UserRole } from "@/config/constants";

const isBrowser = () => typeof window !== "undefined";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Get user data from storage (localStorage and cookies)
 * @returns {Object|null} The user data or null if not found
 */

const EXPIRED_COOKIE_DATE = "Thu, 01 Jan 1970 00:00:00 GMT";

const getDomainVariants = () => {
  if (!isBrowser()) return [null];

  const hostname = window.location.hostname;
  const variants = new Set([null, hostname, `.${hostname}`]);
  const hostParts = hostname.split(".");

  if (hostParts.length > 1) {
    for (let i = 1; i < hostParts.length - 1; i += 1) {
      const domain = hostParts.slice(i).join(".");
      variants.add(domain);
      variants.add(`.${domain}`);
    }
  }

  return Array.from(variants);
};

export const clearCookieByName = (name) => {
  if (!isBrowser()) return;

  const domains = getDomainVariants();

  domains.forEach((domain) => {
    const domainPart = domain ? `domain=${domain}; ` : "";
    document.cookie = `${name}=; path=/; ${domainPart}expires=${EXPIRED_COOKIE_DATE}; max-age=0; samesite=lax`;
    document.cookie = `${name}=; path=/; ${domainPart}expires=${EXPIRED_COOKIE_DATE}; max-age=0; samesite=lax; secure`;
    document.cookie = `${name}=; path=/; ${domainPart}expires=${EXPIRED_COOKIE_DATE}; max-age=0`;
  });
};

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (!isBrowser()) return;

  if (accessToken) {
    document.cookie = `clientToken=${accessToken}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? "; secure" : ""}`;
  }

  if (refreshToken) {
    document.cookie = `clientRefreshToken=${refreshToken}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? "; secure" : ""}`;
  }
};

export const getRefreshToken = () => {
  if (!isBrowser()) return null;

  const refreshTokenCookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("clientRefreshToken="));

  return refreshTokenCookie
    ? decodeURIComponent(refreshTokenCookie.split("=")[1])
    : null;
};

export const getUserData = () => {
  try {
    if (!isBrowser()) {
      console.log("Not in browser environment");
      return null;
    }

    // Try to get data from localStorage first
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.log("No user data found in localStorage");
      // Try to get from cookie as fallback
      const cookies = document.cookie.split(";");
      const userCookie = cookies.find((c) => c.trim().startsWith("user="));
      if (!userCookie) {
        console.log("No user data found in cookies");
        return null;
      }
      const userData = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
      // Sync back to localStorage
      // localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }

    const userData = JSON.parse(storedUser);
    // Ensure cookie is in sync
    const cookieStr = `user=${encodeURIComponent(storedUser)}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? "; secure" : ""}`;
    document.cookie = cookieStr;
    return userData;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const getUserDataSync = () => {
  try {
    if (!isBrowser()) {
      return null;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Error getting user data sync:', error);
    return null;
  }
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if the user is an admin
 */
export const isAdmin = () => {
  try {
    if (!isBrowser()) {
      console.log("Not in browser environment");
      return false;
    }

    const userData = getUserData();
    if (!userData) {
      console.log("No user data found for admin check");
      return false;
    }

    const isUserAdmin = userData.role !== UserRole.USER;
    // const isUserAdmin = userData.role === UserRole.ADMIN || userData.role === UserRole.SUPER_ADMIN;
    return isUserAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Store user data in storage (localStorage and cookies)
 * @param {Object} userData The user data to store
 */
export const setUserData = (userData) => {
  try {
    if (!isBrowser()) {
      console.log("Not in browser environment");
      return;
    }

    console.log("Storing user data:", userData);
    const userDataStr = JSON.stringify(userData);

    // Store in localStorage
    localStorage.setItem("user", userDataStr);

    // Store in cookie with options
    const cookieStr = `user=${encodeURIComponent(userDataStr)}; path=${COOKIE_OPTIONS.path}; samesite=${COOKIE_OPTIONS.sameSite}; max-age=${COOKIE_OPTIONS.maxAge}${COOKIE_OPTIONS.secure ? "; secure" : ""}`;
    document.cookie = cookieStr;

    // Verify the data was stored correctly
    const storedData = localStorage.getItem("user");
    const parsedData = JSON.parse(storedData);
    console.log("Verified stored user data:", parsedData);
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

/**
 * Clear user data from storage (localStorage and cookies)
 */
export const clearUserData = () => {
  try {
    if (!isBrowser()) {
      console.log("Not in browser environment");
      return;
    }

    console.log("Clearing user data");
    // Clear from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("newLoan");
    localStorage.removeItem("loan");
    localStorage.removeItem("portal");

    // Clear from cookies
    clearCookieByName("user");
    clearCookieByName("token");
    clearCookieByName("refreshToken");
    clearCookieByName("clientToken");
    clearCookieByName("clientRefreshToken");
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if the user is authenticated
 */
export const isAuthenticated = () => {
  try {
    if (!isBrowser()) {
      console.log("Not in browser environment");
      return false;
    }

    const userData = getUserData();
    const isUserAuthenticated = !!userData;
    console.log("Is user authenticated?", isUserAuthenticated);
    return isUserAuthenticated;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};
