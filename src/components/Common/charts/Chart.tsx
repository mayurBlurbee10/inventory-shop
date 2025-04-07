"use client";

import { useEffect, useRef } from "react";

const Chart = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isWidgetLoaded = useRef(false);

  useEffect(() => {
    const originalConsoleError = console.error;

    // Suppress specific iframe error
    console.error = function (...args) {
      if (
        typeof args[0] === "string" &&
        args[0].includes("contentWindow is not available")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    if (isWidgetLoaded.current || !containerRef.current) return;
    isWidgetLoaded.current = true;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      dateRange: "12M",
      exchange: "US",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: false,
      showSymbolLogo: false,
      showFloatingTooltip: false,
      width: "100%", // responsive width
      height: "550",
      plotLineColorGrowing: "rgba(41, 98, 255, 1)",
      plotLineColorFalling: "rgba(41, 98, 255, 1)",
      gridLineColor: "rgba(46, 46, 46, 0)",
      scaleFontColor: "rgba(15, 15, 15, 1)",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
    });

    containerRef.current.appendChild(script);

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="w-full max-w-full overflow-hidden tradingview-widget-container">
      <div className="tradingview-widget-container__widget" ref={containerRef} />
      <div className="tradingview-widget-copyright text-sm mt-2 text-center">
        <a
          href="https://www.tradingview.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
        </a>
      </div>
    </div>
  );
};

export default Chart;
