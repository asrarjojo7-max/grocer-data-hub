import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";

/**
 * Subscribes to new print_receipts inserts for the current user and:
 *  1) Shows an in-app sonner toast.
 *  2) Fires a system-level notification (Web Notifications API on browser,
 *     Capacitor LocalNotifications on Android/iOS once wrapped) so the user
 *     is alerted even if the app is in the background.
 *  3) Invalidates dashboard queries so numbers refresh instantly.
 */
export function useReceiptRealtimeToast() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Ask for OS notification permission once when the user is logged in.
  useEffect(() => {
    if (!user?.id) return;
    requestNotificationPermission().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`receipts-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "print_receipts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const r: any = payload.new;
          const meters = Number(r.total_meters || 0);
          const commission = Number(r.commission_amount || 0);
          const customer = r.customer_name || "بدون اسم";

          if (r?.source === "whatsapp") {
            const title = "📩 إيصال جديد من واتساب";
            const body = `${customer} • ${meters.toLocaleString("ar-EG")} م • عمولتك ${commission.toLocaleString("ar-EG")} ج.س`;
            toast.success(title, { description: body, duration: 6000 });
            showNotification({ title, body, url: "/my-receipts", tag: r.id });
          }

          // Only invalidate the lists that actually display the new row;
          // skip top-designers (rarely visible, recomputed on visit anyway).
          qc.invalidateQueries({ queryKey: ["print_receipts"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats-v2"] });
          qc.invalidateQueries({ queryKey: ["recent-receipts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);
}
