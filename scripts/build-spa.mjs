#!/usr/bin/env node
/**
 * Build a static SPA bundle suitable for Capacitor / Android Studio.
 *
 * The default `vite build` in this project produces a Cloudflare Worker SSR
 * bundle (.output/), which cannot run inside an Android WebView. This script
 * runs a separate Vite build with SSR turned off and copies the resulting
 * static assets into dist/spa/, which capacitor.config.ts points to.
 *
 * Usage:
 *   node scripts/build-spa.mjs
 *   # then: npx cap sync android
 *   # then: npx cap open android
 */
import { build } from "vite";
import { existsSync, rmSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist", "spa");

console.log("[build-spa] cleaning dist/spa…");
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

console.log("[build-spa] running Vite build in SPA mode…");
await build({
  root,
  // Bypass the lovable tanstack config (which forces SSR + Cloudflare).
  // We only want a plain Vite SPA build of the React app entry.
  configFile: false,
  plugins: [
    (await import("@vitejs/plugin-react")).default(),
    (await import("@tailwindcss/vite")).default(),
  ],
  resolve: {
    alias: { "@": path.join(root, "src") },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? ""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ""),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(process.env.VITE_SUPABASE_PROJECT_ID ?? ""),
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, "index.spa.html"),
    },
  },
});

// Rename built index.spa.html → index.html (Capacitor expects index.html).
const builtHtml = path.join(outDir, "index.spa.html");
const finalHtml = path.join(outDir, "index.html");
if (existsSync(builtHtml)) {
  copyFileSync(builtHtml, finalHtml);
  rmSync(builtHtml);
}

console.log("[build-spa] ✓ output ready at:", outDir);
console.log("[build-spa] next steps:");
console.log("  npx cap sync android");
console.log("  npx cap open android");
