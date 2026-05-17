// Deep-link bridge for the Capacitor (Android/iOS) build.
//
// The native app uses HashRouter (see src/App.tsx), so all in-app URLs look
// like `myapp://host/#/receipts/123` or `https://nesbaty.lovable.app/#/receipts/123`.
// However, push notifications, custom-scheme links, and OS share sheets often
// hand us a *path-style* URL (no hash), e.g. `myapp://host/receipts/123` or
// `https://nesbaty.lovable.app/receipts/123`. Without a bridge, HashRouter
// just renders `/` because it ignores the pathname.
//
// This module:
//   1. On cold start, if the initial URL has a non-root pathname but no hash,
//      rewrites the location to the equivalent hash route before React mounts.
//   2. On warm start (app already running), listens to Capacitor's
//      `App.appUrlOpen` event and navigates via `location.hash` so HashRouter
//      picks it up — without a full page reload.
//
// Safe to import on web: it no-ops outside Capacitor.

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-ignore - Capacitor injects this global at runtime
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/** Extract the in-app path (`/foo/bar?x=1`) from any URL-ish string. */
function toAppPath(rawUrl: string): string | null {
  try {
    // Already a hash route → strip the leading `#`.
    const hashIdx = rawUrl.indexOf("#/");
    if (hashIdx !== -1) return rawUrl.slice(hashIdx + 1);

    const u = new URL(rawUrl, "http://localhost");
    const path = u.pathname || "/";
    const search = u.search || "";
    if (path === "/" && !search) return null;
    return `${path}${search}`;
  } catch {
    return null;
  }
}

/**
 * Run once, *before* React mounts, to normalize a deep-link cold start.
 * If the WebView was opened at `/receipts/123` (no hash), rewrite to
 * `/#/receipts/123` so HashRouter resolves the route.
 */
export function normalizeInitialDeepLink(): void {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  if (hash && hash.startsWith("#/")) return; // already a hash route
  if (pathname === "/" || pathname === "") return; // nothing to migrate
  const target = `${pathname}${search}`;
  window.history.replaceState(null, "", `/#${target}`);
}

/**
 * Register a listener so warm-start deep links (notification taps while the
 * app is already running) navigate to the right page.
 */
export async function registerDeepLinkListener(): Promise<void> {
  if (!isNative()) return;
  try {
    const { App } = await import("@capacitor/app");
    await App.removeAllListeners();
    App.addListener("appUrlOpen", ({ url }) => {
      const appPath = toAppPath(url);
      if (!appPath) return;
      // HashRouter listens to `hashchange`, so this is enough to navigate.
      window.location.hash = `#${appPath}`;
    });
  } catch (e) {
    console.warn("[deepLinks] Capacitor App plugin not available", e);
  }
}
