#!/usr/bin/env node
/**
 * One-command Android APK builder for Nesbaty.
 *
 * Usage:
 *   npm run build:apk         → builds release APK
 *   npm run build:apk:debug   → builds debug APK
 *
 * Steps performed:
 *   1. Ensure Android platform is added (auto-runs `npx cap add android` if missing).
 *   2. Build SPA bundle (vite static, no SSR).
 *   3. Sync web assets into android/ (`npx cap sync android`).
 *   4. Run Gradle assembleRelease / assembleDebug.
 *   5. Copy the resulting APK into `dist/apk/` so it is easy to find.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const distApkDir = path.join(root, "dist", "apk");

const isDebug = process.argv.includes("--debug");
const gradleTask = isDebug ? "assembleDebug" : "assembleRelease";
const buildType = isDebug ? "debug" : "release";

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

// ─── 1. Ensure Android platform exists ────────────────────────────────────
if (!existsSync(androidDir)) {
  console.log("Android platform not found. Adding it now…");
  run("npx cap add android");
} else {
  console.log("✓ Android platform already present");
}

// ─── 2. Build SPA bundle ──────────────────────────────────────────────────
run("node scripts/build-spa.mjs");

// ─── 3. Sync Capacitor ────────────────────────────────────────────────────
run("npx cap sync android");

// ─── 4. Gradle build ────────────────────────────────────────────────────────
const gradlew = process.platform === "win32" ? "android\\gradlew.bat" : "./gradlew";
run(`${gradlew} ${gradleTask}`, { cwd: androidDir });

// ─── 5. Locate & copy APK ───────────────────────────────────────────────────
const apkSourceDir = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "apk",
  buildType
);

if (!existsSync(apkSourceDir)) {
  console.error(`❌ APK output directory not found: ${apkSourceDir}`);
  process.exit(1);
}

const apks = readdirSync(apkSourceDir).filter((f) => f.endsWith(".apk"));
if (apks.length === 0) {
  console.error("❌ No APK file found after build.");
  process.exit(1);
}

mkdirSync(distApkDir, { recursive: true });
for (const apk of apks) {
  const src = path.join(apkSourceDir, apk);
  const dest = path.join(distApkDir, apk);
  copyFileSync(src, dest);
  console.log(`\n✅ APK ready → ${path.relative(root, dest)}`);
}

console.log("\n🎉 All done! Install on device with:");
console.log(`   adb install "${path.join(distApkDir, apks[0])}"`);
