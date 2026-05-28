export const getBackendUrl = (): string => {
  if (typeof window === "undefined") {
    return "https://ais-pre-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app";
  }
  const origin = window.location.origin;

  // Detect if running inside a WebView/APK wrapper
  const isWebView = (
    /wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent) ||
    window.location.protocol === "file:" ||
    (navigator.userAgent.includes("Android") && navigator.userAgent.includes("Version/"))
  );

  if (isWebView) {
    // If the webview loads our actual secure remote domain directly, respect that origin
    if (origin && origin.startsWith("http") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin;
    }
    // Otherwise (file://, local cap/cordova host), route to our live secure Cloud Run server
    return "https://ais-pre-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app";
  }

  // Normal browser (desktop or standard mobile Chrome/Safari)
  return origin;
};

export const getApiUrl = (path: string): string => {
  const base = getBackendUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
