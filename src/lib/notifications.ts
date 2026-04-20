/**
 * Unified notification helper.
 *
 * - On the web: uses the browser Notifications API so the user gets a system
 *   notification even if the tab is in the background (as long as the browser
 *   is open and permission was granted).
 * - When wrapped with Capacitor (Android Studio build): dynamically uses
 *   @capacitor/local-notifications to show a real OS-level notification that
 *   appears in the status bar even when the app is closed.
 *
 * This file is safe to import on the server (SSR) — it guards every browser
 * API behind `typeof window !== "undefined"` and only calls Capacitor when
 * the native bridge is detected.
 */

export type AppNotification = {
  title: string;
  body: string;
  /** Deep-link path opened when the user taps the notification (Capacitor only). */
  url?: string;
  /** Stable id so duplicate notifications don't stack. */
  tag?: string;
};

/** True when running inside a Capacitor (Android/iOS) shell. */
function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-ignore - Capacitor injects this global
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/** Ask for permission once at app start so notifications are ready instantly later. */
export async function requestNotificationPermission(): Promise<"granted" | "denied" | "default"> {
  if (typeof window === "undefined") return "default";

  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === "granted" ? "granted" : "denied";
    } catch (e) {
      console.warn("Capacitor LocalNotifications not available", e);
      return "default";
    }
  }

  if (!("Notification" in window)) return "default";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "default";
  }
}

/** Fire a notification using the best transport available on the current platform. */
export async function showNotification(n: AppNotification): Promise<void> {
  if (typeof window === "undefined") return;

  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 2_000_000_000),
            title: n.title,
            body: n.body,
            extra: { url: n.url },
            smallIcon: "ic_stat_icon_config_sample",
          },
        ],
      });
      return;
    } catch (e) {
      console.warn("Native notification failed, falling back to web", e);
    }
  }

  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const notif = new Notification(n.title, {
      body: n.body,
      tag: n.tag,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
    if (n.url) {
      notif.onclick = () => {
        window.focus();
        window.location.href = n.url!;
      };
    }
  } catch (e) {
    console.warn("Web Notification failed", e);
  }
}
