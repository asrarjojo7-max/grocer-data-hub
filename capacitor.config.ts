import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor configuration for building the Android app from this project.
//
// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION BUILD (APK / AAB) — يستخدم الملفات المحلية داخل التطبيق:
//   1. npm install
//   2. npm run build:mobile   // يبني الويب + يزامن مع android تلقائياً
//   3. npx cap open android   // افتح Android Studio و اضغط Run / Build
//
// FIRST-TIME SETUP (مرة واحدة فقط بعد clone):
//   npx cap add android
//
// ─────────────────────────────────────────────────────────────────────────────
// LIVE-RELOAD أثناء التطوير (اختياري):
// إذا أردت تجربة التطبيق على هاتفك مع تحديث فوري من Lovable Preview،
// أزل التعليق عن قسم `server` بالأسفل ثم نفّذ:
//   npx cap sync android
// تذكّر إعادة تعليقه قبل بناء النسخة النهائية حتى يعمل التطبيق offline.
// ─────────────────────────────────────────────────────────────────────────────
const config: CapacitorConfig = {
  appId: "com.sudatech.nesbaty",
  appName: "نسبتي",
  // Capacitor needs a static SPA build (NOT TanStack SSR worker output).
  // We bundle the app to dist/spa via `npm run build:android`.
  webDir: "dist/spa",
  bundledWebRuntime: false,
  // Live-reload for dev only — uncomment then run `npx cap sync android`.
  // server: {
  //   url: "https://id-preview--73b09833-bb90-4c31-815b-aa57457e1c13.lovable.app",
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0f172a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
    },
  },
};

export default config;
