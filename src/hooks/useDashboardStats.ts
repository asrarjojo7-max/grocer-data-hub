import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalMetersToday: number;
  totalAmountToday: number;
  totalCommissionToday: number;
  totalNetToday: number;
  totalMetersMonth: number;
  totalAmountMonth: number;
  totalCommissionMonth: number;
  totalNetMonth: number;
  receiptsToday: number;
  pendingReceipts: number;
  activeBranches: number;
  totalBranches: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats-v2"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const { data: branches, error: bErr } = await supabase
        .from("branches")
        .select("id, is_active");
      if (bErr) throw bErr;

      const { data: receipts, error: rErr } = await (supabase as any)
        .from("print_receipts")
        .select("total_meters, total_amount, commission_amount, net_amount, is_confirmed, receipt_date")
        .gte("receipt_date", monthAgo);
      if (rErr) throw rErr;

      const todayRows = (receipts || []).filter((r: any) => r.receipt_date >= today);
      const monthRows = receipts || [];

      const sum = (arr: any[], key: string) =>
        arr.reduce((a, r) => a + Number(r[key] || 0), 0);

      return {
        totalMetersToday: sum(todayRows, "total_meters"),
        totalAmountToday: sum(todayRows, "total_amount"),
        totalCommissionToday: sum(todayRows, "commission_amount"),
        totalNetToday: sum(todayRows, "net_amount"),
        totalMetersMonth: sum(monthRows, "total_meters"),
        totalAmountMonth: sum(monthRows, "total_amount"),
        totalCommissionMonth: sum(monthRows, "commission_amount"),
        totalNetMonth: sum(monthRows, "net_amount"),
        receiptsToday: todayRows.length,
        pendingReceipts: monthRows.filter((r: any) => !r.is_confirmed).length,
        activeBranches: branches?.filter((b) => b.is_active).length || 0,
        totalBranches: branches?.length || 0,
      };
    },
  });
}

export interface TopDesigner {
  user_id: string;
  full_name: string;
  totalMeters: number;
  totalCommission: number;
  receiptsCount: number;
}

export function useTopDesigners(limit = 5) {
  return useQuery({
    queryKey: ["top-designers", limit],
    queryFn: async (): Promise<TopDesigner[]> => {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const { data: receipts, error } = await (supabase as any)
        .from("print_receipts")
        .select("user_id, total_meters, commission_amount")
        .gte("receipt_date", monthAgo)
        .not("user_id", "is", null);
      if (error) throw error;

      const map = new Map<string, { meters: number; commission: number; count: number }>();
      (receipts || []).forEach((r: any) => {
        const cur = map.get(r.user_id) || { meters: 0, commission: 0, count: 0 };
        cur.meters += Number(r.total_meters || 0);
        cur.commission += Number(r.commission_amount || 0);
        cur.count += 1;
        map.set(r.user_id, cur);
      });

      const userIds = Array.from(map.keys());
      if (userIds.length === 0) return [];

      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      return Array.from(map.entries())
        .map(([user_id, v]) => ({
          user_id,
          full_name: (profileMap.get(user_id) as string) || "مصمم",
          totalMeters: v.meters,
          totalCommission: v.commission,
          receiptsCount: v.count,
        }))
        .sort((a, b) => b.totalMeters - a.totalMeters)
        .slice(0, limit);
    },
  });
}

export interface RecentReceipt {
  id: string;
  customerName: string;
  meters: number;
  amount: number;
  createdAt: string;
  isConfirmed: boolean;
}

export function useRecentReceipts(limit = 5) {
  return useQuery({
    queryKey: ["recent-receipts", limit],
    queryFn: async (): Promise<RecentReceipt[]> => {
      const { data, error } = await (supabase as any)
        .from("print_receipts")
        .select("id, customer_name, total_meters, total_amount, created_at, is_confirmed")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        customerName: r.customer_name || "—",
        meters: Number(r.total_meters || 0),
        amount: Number(r.total_amount || 0),
        createdAt: r.created_at,
        isConfirmed: r.is_confirmed,
      }));
    },
  });
}
