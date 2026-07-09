"use client";

import { useEffect, useRef } from "react";
import { installTradingViewErrorSuppressor } from "../../../app/lib/tradingview";

type ColorTheme = "light" | "dark";

const getMode = (): ColorTheme =>
  typeof window !== "undefined" && localStorage.getItem("mode") === "dark"
    ? "dark"
    : "light";

const TopStories = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    installTradingViewErrorSuppressor();

    const loadWidget = (colorTheme: ColorTheme) => {
      const widget = widgetRef.current;
      if (!widget) return;

      widget.innerHTML = "";

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
      script.async = true;
      script.type = "text/javascript";
      script.innerHTML = JSON.stringify({
        feedMode: "all_symbols",
        isTransparent: true,
        displayMode: "compact",
        width: "100%", // responsive
        height: "250",
        colorTheme,
        locale: "en",
      });

      widget.appendChild(script);
    };

    loadWidget(getMode());

    const handleModeChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      loadWidget(detail === "dark" ? "dark" : "light");
    };

    window.addEventListener("theme-mode-changed", handleModeChange);

    return () => {
      window.removeEventListener("theme-mode-changed", handleModeChange);
    };
  }, []);

  return (
    <div className="w-full max-w-full overflow-y-auto border-b border-border bg-secondary text-secondary-foreground">
      <div
        className="tradingview-widget-container__widget"
        ref={widgetRef}
      />
      <div className="tradingview-widget-copyright text-sm mt-2 text-center">
        <a
          href="https://www.tradingview.com/"
          rel="noopener noreferrer"
          target="_blank"
        />
      </div>
    </div>
  );
};

export default TopStories;
