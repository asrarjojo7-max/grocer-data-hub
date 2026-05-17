// SPA entry point used ONLY for the Capacitor/Android build.
// The web app uses TanStack Start SSR (src/router.tsx + src/routes/*),
// but inside an Android WebView we need a plain React SPA with no SSR
// or service worker dependencies. This entry mounts the original
// react-router App.tsx directly so all existing pages work offline.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { normalizeInitialDeepLink, registerDeepLinkListener } from "./lib/deepLinks";

// Cold-start deep link: rewrite `/receipts/123` → `/#/receipts/123` before
// React mounts so HashRouter resolves the correct route.
normalizeInitialDeepLink();

// Warm-start deep links (notification taps while app is running).
void registerDeepLinkListener();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
