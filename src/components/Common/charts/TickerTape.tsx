"use client";

import { useEffect, useRef } from "react";

const TickerTape = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    const originalConsoleError = console.error;

    // Suppress iframe contentWindow error
    console.error = function (...args) {
      if (
        typeof args[0] === "string" &&
        args[0].includes("contentWindow is not available")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    if (isLoaded.current || !containerRef.current) return;
    isLoaded.current = true;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
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
      isTransparent: false,
      displayMode: "regular",
      colorTheme: "light",
      locale: "en",
    });

    containerRef.current.appendChild(script);

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="w-full flex justify-center">
      <div
        className="tradingview-widget-container w-full max-w-6xl"
      >
        <div
          className="tradingview-widget-container__widget"
          ref={containerRef}
        />
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
