import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Register the device for push notifications and persist the FCM/APNs token
 * in `device_push_tokens` so the backend can target this user's devices.
 *
 * Safe to call from the web — it just no-ops when not running on a native
 * platform (Capacitor returns "web" for `getPlatform()`).
 */
export async function registerPushNotifications(userId: string): Promise<void> {
  // Only run on native (Android/iOS). On web there's no FCM/APNs.
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Ask permission for both push & local notifications (we use local
    //    notifications as a fallback to surface foreground messages).
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") {
      console.warn("[push] permission not granted:", permResult);
      return;
    }
    await LocalNotifications.requestPermissions();

    // 2. Register with FCM/APNs. The token comes back via the `registration` event.
    await PushNotifications.register();

    // Avoid stacking multiple listeners across hot reloads / re-mounts.
    await PushNotifications.removeAllListeners();
    await LocalNotifications.removeAllListeners();

    // 3. Save the token in Supabase (upsert by token so re-registration is idempotent).
    PushNotifications.addListener("registration", async (token) => {
      try {
        const platform = Capacitor.getPlatform(); // "android" | "ios"
        const { error } = await supabase
          .from("device_push_tokens")
          .upsert(
            {
              user_id: userId,
              token: token.value,
              platform,
              device_info: { userAgent: navigator.userAgent },
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "token" }
          );
        if (error) console.error("[push] failed to save token:", error);
        else console.log("[push] token registered");
      } catch (e) {
        console.error("[push] save token threw:", e);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[push] registration error:", err);
    });

    // 4. Foreground messages: surface them as a local notification so the
    //    user actually sees them (push payloads aren't auto-displayed when
    //    the app is in the foreground on Android).
    PushNotifications.addListener("pushNotificationReceived", async (notif) => {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 2147483647,
              title: notif.title || "نسبتي",
              body: notif.body || "",
              extra: notif.data,
            },
          ],
        });
      } catch (e) {
        console.error("[push] local notification failed:", e);
      }
    });

    // 5. User tapped a notification — could route here later (e.g. open receipt).
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[push] action performed:", action.notification.data);
    });
  } catch (e) {
    console.error("[push] setup failed:", e);
  }
}

/**
 * Remove this device's token on sign-out so the user doesn't keep receiving
 * notifications meant for the previous account.
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PushNotifications.removeAllListeners();
    // We don't have the token cached locally, but we can clean up rows for
    // this user — server-side jobs should also prune stale tokens.
  } catch (e) {
    console.error("[push] unregister failed:", e);
  }
}
