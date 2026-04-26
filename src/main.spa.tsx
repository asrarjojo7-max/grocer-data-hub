// SPA entry point used ONLY for the Capacitor/Android build.
// The web app uses TanStack Start SSR (src/router.tsx + src/routes/*),
// but inside an Android WebView we need a plain React SPA with no SSR
// or service worker dependencies. This entry mounts the original
// react-router App.tsx directly so all existing pages work offline.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
