"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { applyThemeForRoute, initializeTheme } from "@/lib/theme-manager";

export function ThemeLoader({ children }) {
  const pathname = usePathname();
  const isInitialMountRef = useRef(true);

  useLayoutEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      initializeTheme(pathname).catch((error) => {
        console.error("Failed to initialize theme:", error);
      });
      return;
    }

    applyThemeForRoute(pathname).catch((error) => {
      console.error("Failed to apply theme for route:", error);
    });
  }, [pathname]);

  return <>{children}</>;
}
