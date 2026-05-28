export const getBackendUrl = (): string => {
  if (typeof window === "undefined") {
    return "https://ais-dev-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app";
  }
  const origin = window.location.origin;

  // Dynamically cache any valid secure remote origin the client visits
  if (origin && origin.startsWith("http") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    try {
      localStorage.setItem("cached_backend_url", origin);
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  }

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
    // Check if we previously cached a valid live cloud run url (e.g., from opening it in standard browser or previous runtime)
    try {
      const cached = localStorage.getItem("cached_backend_url");
      if (cached && cached.startsWith("http") && !cached.includes("localhost")) {
        return cached;
      }
    } catch (e) {
      console.warn("Storage read failed:", e);
    }

    // Default development-first resilient fallback pointing to the active dev container with our new routes
    return "https://ais-dev-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app";
  }

  // Normal browser (desktop or standard mobile Chrome/Safari)
  return origin;
};

export const getApiUrl = (path: string): string => {
  const base = getBackendUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
