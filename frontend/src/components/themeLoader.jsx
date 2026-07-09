"use client";

import { useEffect, useLayoutEffect } from "react";
import {
  applyLocalTheme,
  loadTheme,
  reloadThemeAfterLogin,
  USER_AUTHENTICATED_EVENT,
} from "@/lib/theme-manager";

export function ThemeLoader({ children }) {
  useLayoutEffect(() => {
    applyLocalTheme();
  }, []);

  useEffect(() => {
    loadTheme().catch((error) => {
      console.error("Failed to load theme:", error);
    });
  }, []);

  useEffect(() => {
    const handleUserAuthenticated = (event) => {
      const { portalId } = event.detail || {};
      reloadThemeAfterLogin({ portalId }).catch((error) => {
        console.error("Failed to reload theme after login:", error);
      });
    };

    window.addEventListener(USER_AUTHENTICATED_EVENT, handleUserAuthenticated);
    return () => {
      window.removeEventListener(
        USER_AUTHENTICATED_EVENT,
        handleUserAuthenticated,
      );
    };
  }, []);

  return <>{children}</>;
}
