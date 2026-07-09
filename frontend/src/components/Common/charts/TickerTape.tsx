"use client";

import { useEffect, useRef } from "react";
import { installTradingViewErrorSuppressor } from "../../../app/lib/tradingview";

type ColorTheme = "light" | "dark";

const TickerTape = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    installTradingViewErrorSuppressor();

    const getMode = (): ColorTheme =>
      typeof window !== "undefined" && localStorage.getItem("mode") === "dark"
        ? "dark"
        : "light";

    const loadWidget = (colorTheme: ColorTheme) => {
      const widget = widgetRef.current;
      if (!widget) return;

      widget.innerHTML = "";

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.async = true;
      script.type = "text/javascript";
      script.innerHTML = JSON.stringify({
        symbols: [
          { proName: "FOREXCOM:SPXUSD", title: "S&P 500 Index" },
          { proName: "FOREXCOM:NSXUSD", title: "US 100 Cash CFD" },
          { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
          { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
          { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
        ],
        showSymbolLogo: false,
        // Transparent so the widget blends with the current theme background.
        isTransparent: true,
        displayMode: "regular",
        colorTheme,
        locale: "en",
      });

      widget.appendChild(script);
    };

    loadWidget(getMode());

    // Reload the widget with the matching color theme when the theme changes.
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
    <div className="w-full flex justify-center">
      <div className="tradingview-widget-container w-full max-w-6xl rounded-lg bg-secondary text-foreground">
        <div className="tradingview-widget-container__widget" ref={widgetRef} />
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noopener noreferrer"
            target="_blank"
          />
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
