"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { applyThemeForRoute, initializeTheme } from "@/lib/theme-manager";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ThemeLoader({ children }) {
  const pathname = usePathname();
  const isInitialMountRef = useRef(true);
  const [isThemeInitializing, setIsThemeInitializing] = useState(true);

  useLayoutEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      setIsThemeInitializing(true);

      initializeTheme(pathname)
        .catch((error) => {
          console.error("Failed to initialize theme:", error);
        })
        .finally(() => {
          setIsThemeInitializing(false);
        });
      return;
    }

    applyThemeForRoute(pathname).catch((error) => {
      console.error("Failed to apply theme for route:", error);
    });
  }, [pathname]);

  if (isThemeInitializing) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-screen items-center justify-center bg-background font-lato">
          <LoaderSpinner size={40} className="text-secondary-foreground" />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
  );
}
