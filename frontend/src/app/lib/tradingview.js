let installed = false;

/**
 * TradingView embed scripts throw a harmless
 * "contentWindow is not available" console error. Suppress it exactly once
 * (globally) so multiple widgets don't chain/leak console.error wrappers.
 */
export function installTradingViewErrorSuppressor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("contentWindow is not available")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}
