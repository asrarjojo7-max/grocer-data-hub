import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PrintReceipt = {
  id: string;
  user_id: string | null;
  branch_id: string | null;
  customer_name: string | null;
  receipt_date: string;
  total_meters: number;
  price_per_meter: number;
  total_amount: number;
  commission_percentage: number;
  commission_amount: number;
  net_amount: number;
  image_url: string | null;
  extracted_data: any;
  ai_confidence: number | null;
  ai_notes: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  notes: string | null;
  source: string;
  whatsapp_from_number: string | null;
  created_at: string;
  updated_at: string;
};

export function useReceipts(onlyMine = false) {
  return useQuery({
    queryKey: ["print_receipts", onlyMine],
    queryFn: async () => {
      let query = supabase.from("print_receipts" as any).select("*").order("created_at", { ascending: false });
      if (onlyMine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PrintReceipt[];
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles" as any).select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useExtractReceipt() {
  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const { data, error } = await supabase.functions.invoke("extract-print-receipt", {
        body: { imageBase64 },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data as {
        customer_name: string | null;
        receipt_date: string | null;
        total_meters: number | null;
        meters_source: string;
        ai_confidence: number;
        ai_notes: string;
      };
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "فشل التحليل"),
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<PrintReceipt> & { image_file?: File | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      let image_url: string | null = r.image_url ?? null;
      if (r.image_file) {
        const path = `${user.id}/${Date.now()}-${r.image_file.name}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, r.image_file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);
        image_url = pub.publicUrl;
      }

      const { image_file, ...rest } = r as any;
      const { data, error } = await supabase.from("print_receipts" as any).insert({
        ...rest,
        image_url,
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["print_receipts"] });
      toast.success("تم حفظ الإيصال");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "فشل الحفظ"),
  });
}

export function useUpdateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PrintReceipt> }) => {
      const { error } = await supabase.from("print_receipts" as any).update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["print_receipts"] });
      toast.success("تم التحديث");
    },
  });
}

export function useDeleteReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("print_receipts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["print_receipts"] });
      toast.success("تم الحذف");
    },
  });
}
