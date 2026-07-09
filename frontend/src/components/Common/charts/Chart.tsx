"use client";

import { useEffect, useRef } from "react";
import { installTradingViewErrorSuppressor } from "../../../app/lib/tradingview";

type ColorTheme = "light" | "dark";

const getMode = (): ColorTheme =>
  typeof window !== "undefined" && localStorage.getItem("mode") === "dark"
    ? "dark"
    : "light";

const StockMarketChart = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    installTradingViewErrorSuppressor();

    const loadWidget = (colorTheme: ColorTheme) => {
      const widget = widgetRef.current;
      if (!widget) return;

      widget.innerHTML = "";

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
      script.innerHTML = JSON.stringify({
        colorTheme,
        dateRange: "12M",
        exchange: "US",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: false,
        showFloatingTooltip: false,
        width: "100%",
        height: "550",
        plotLineColorGrowing: "rgba(41, 98, 255, 1)",
        plotLineColorFalling: "rgba(41, 98, 255, 1)",
        gridLineColor: "rgba(46, 46, 46, 0)",
        scaleFontColor:
          colorTheme === "dark"
            ? "rgba(240, 240, 240, 1)"
            : "rgba(15, 15, 15, 1)",
        belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
        belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
        belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
        belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
        symbolActiveColor: "rgba(41, 98, 255, 0.12)",
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
    <div className="w-full max-w-full overflow-hidden tradingview-widget-container rounded-lg bg-secondary text-secondary-foreground">
      <div className="tradingview-widget-container__widget" ref={widgetRef} />
      <div className="tradingview-widget-copyright text-center text-sm mt-2">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </div>
    </div>
  );
};

const MarketOverviewChart = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    installTradingViewErrorSuppressor();

    const loadWidget = (colorTheme: ColorTheme) => {
      const widget = widgetRef.current;
      if (!widget) return;

      widget.innerHTML = "";

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
      script.innerHTML = JSON.stringify({
        colorTheme,
        dateRange: "12M",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "550",
        plotLineColorGrowing: "rgba(41, 98, 255, 1)",
        plotLineColorFalling: "rgba(41, 98, 255, 1)",
        gridLineColor: "rgba(46, 46, 46, 0)",
        scaleFontColor:
          colorTheme === "dark"
            ? "rgba(240, 240, 240, 1)"
            : "rgba(15, 15, 15, 1)",
        belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
        belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
        belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
        belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
        symbolActiveColor: "rgba(41, 98, 255, 0.12)",
        tabs: [
          {
            title: "Indices",
            symbols: [
              { s: "FOREXCOM:SPXUSD", d: "S&P 500 Index" },
              { s: "FOREXCOM:NSXUSD", d: "US 100 Cash CFD" },
              { s: "FOREXCOM:DJI", d: "Dow Jones Industrial Average Index" },
              { s: "INDEX:NKY", d: "Japan 225" },
              { s: "INDEX:DEU40", d: "DAX Index" },
              { s: "FOREXCOM:UKXGBP", d: "FTSE 100 Index" }
            ],
            originalTitle: "Indices"
          },
          {
            title: "Forex",
            symbols: [
              { s: "FX:EURUSD", d: "EUR to USD" },
              { s: "FX:GBPUSD", d: "GBP to USD" },
              { s: "FX:USDJPY", d: "USD to JPY" },
              { s: "FX:USDCHF", d: "USD to CHF" },
              { s: "FX:AUDUSD", d: "AUD to USD" },
              { s: "FX:USDCAD", d: "USD to CAD" }
            ],
            originalTitle: "Forex"
          },
          {
            title: "Futures",
            symbols: [
              { s: "BMFBOVESPA:ISP1!", d: "S&P 500 Index Futures" },
              { s: "BMFBOVESPA:EUR1!", d: "Euro Futures" },
              { s: "PYTH:WTI3!", d: "WTI CRUDE OIL" },
              { s: "BMFBOVESPA:ETH1!", d: "Hydrous ethanol" },
              { s: "BMFBOVESPA:CCM1!", d: "Corn" }
            ],
            originalTitle: "Futures"
          },
          {
            title: "Bonds",
            symbols: [
              { s: "EUREX:FGBL1!", d: "Euro Bund" },
              { s: "EUREX:FBTP1!", d: "Euro BTP" },
              { s: "EUREX:FGBM1!", d: "Euro BOBL" }
            ],
            originalTitle: "Bonds"
          }
        ]
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
    <div className="w-full max-w-full overflow-hidden tradingview-widget-container rounded-lg bg-background text-foreground">
      <div className="tradingview-widget-container__widget" ref={widgetRef} />
      <div className="tradingview-widget-copyright text-center text-sm mt-2">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </div>
    </div>
  );
};

export { StockMarketChart, MarketOverviewChart };
