"use client";

import { useEffect, useRef } from "react";

const TopStories = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isWidgetLoaded = useRef(false);

  useEffect(() => {
    if (isWidgetLoaded.current || !containerRef.current) return;
    isWidgetLoaded.current = true;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      feedMode: "all_symbols",
      isTransparent: false,
      displayMode: "compact",
      width: "100%", // responsive
      height: "250",
      colorTheme: "light",
      locale: "en"
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-full overflow-y-auto border border-gray-200 rounded-md">
      <div
        className="tradingview-widget-container__widget"
        ref={containerRef}
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
