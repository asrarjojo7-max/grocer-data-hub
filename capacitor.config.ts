import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor configuration for building the Android app from this project.
//
// Build flow (run locally on your machine after cloning the repo):
//   1. npm install
//   2. npm run build        // produces .output/public for the web bundle
//   3. npx cap add android  // first-time only — creates the android/ folder
//   4. npx cap sync android // copy web assets + plugins into android/
//   5. npx cap open android // opens Android Studio to build the APK / AAB
//
// For live-reload development against the hosted Lovable preview, the `server.url`
// below points the native shell at the Lovable preview URL. Remove it (or comment it
// out) before producing a release build so the app uses the bundled offline assets.
const config: CapacitorConfig = {
  appId: "com.sudatech.nesbaty",
  appName: "نسبتي",
  webDir: ".output/public",
  bundledWebRuntime: false,
  server: {
    url: "https://id-preview--73b09833-bb90-4c31-815b-aa57457e1c13.lovable.app",
    cleartext: true,
  },
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
