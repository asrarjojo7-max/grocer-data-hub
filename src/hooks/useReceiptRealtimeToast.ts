import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Subscribes to new print_receipts inserts for the current user and shows a toast
 * whenever one arrives via WhatsApp. Also invalidates dashboard queries so numbers
 * update instantly without a manual refresh.
 */
export function useReceiptRealtimeToast() {
  const { user } = useAuth();
  const qc = useQueryClient();

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
          if (r?.source === "whatsapp") {
            const meters = Number(r.total_meters || 0);
            const commission = Number(r.commission_amount || 0);
            toast.success("📩 إيصال جديد من واتساب", {
              description: `${meters.toLocaleString("ar-EG")} متر • عمولتك ${commission.toLocaleString("ar-EG")} ج.س`,
              duration: 6000,
            });
          }
          qc.invalidateQueries({ queryKey: ["print_receipts"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats-v2"] });
          qc.invalidateQueries({ queryKey: ["top-designers"] });
          qc.invalidateQueries({ queryKey: ["recent-receipts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);
}
