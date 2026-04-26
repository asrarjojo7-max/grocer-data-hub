import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hashFile, hashFiles, fileToDataUrl } from "@/lib/imageHash";
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
  commission_per_meter: number;
  commission_amount: number;
  net_amount: number;
  image_url: string | null;
  image_urls: string[] | null;
  image_hash: string | null;
  image_hashes: string[] | null;
  pages_count: number;
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

// Look up existing receipts by image hash(es) for the current user.
// Used to warn the designer that this exact image (or a page from it) was
// already uploaded so commissions cannot be claimed twice for the same receipt.
export async function findReceiptsByHashes(hashes: string[]): Promise<PrintReceipt[]> {
  if (!hashes.length) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const inList = hashes.map((h) => `"${h}"`).join(",");
  const { data, error } = await supabase
    .from("print_receipts" as any)
    .select("*")
    .eq("user_id", user.id)
    .or(`image_hash.in.(${inList}),image_hashes.cs.${JSON.stringify(hashes)}`);
  if (error) {
    console.warn("duplicate check failed:", error);
    return [];
  }
  return (data || []) as unknown as PrintReceipt[];
}

// Invalidate every query that depends on print_receipts so the dashboard,
// recent list, top designers and reports all refresh after a mutation.
function invalidateReceiptQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["print_receipts"] });
  qc.invalidateQueries({ queryKey: ["dashboard-stats-v2"] });
  qc.invalidateQueries({ queryKey: ["top-designers"] });
  qc.invalidateQueries({ queryKey: ["recent-receipts"] });
}

export function useReceipts(onlyMine = false, limit = 200) {
  return useQuery({
    queryKey: ["print_receipts", onlyMine, limit],
    queryFn: async () => {
      let query = supabase
        .from("print_receipts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (onlyMine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PrintReceipt[];
    },
    staleTime: 30_000,
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

// Extract data from one or more receipt page images. The edge function accepts
// `imagesBase64[]` so we can send a multi-page receipt as a single analysis call
// and get back combined line items + a single total.
export function useExtractReceipt() {
  return useMutation({
    mutationFn: async (images: string | string[]) => {
      const imagesBase64 = Array.isArray(images) ? images : [images];
      const { data, error } = await supabase.functions.invoke("extract-print-receipt", {
        body: { imagesBase64 },
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
    mutationFn: async (
      r: Partial<PrintReceipt> & { image_file?: File | null; image_files?: File[] | null }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Collect all files (single or multi-page) and dedupe-check by hash first.
      const files: File[] = (r.image_files && r.image_files.length)
        ? r.image_files
        : (r.image_file ? [r.image_file] : []);

      let image_hashes: string[] = [];
      if (files.length) {
        image_hashes = await hashFiles(files);
        const dupes = await findReceiptsByHashes(image_hashes);
        if (dupes.length) {
          const ids = dupes.map((d) => d.id.slice(0, 8)).join("، ");
          throw new Error(`هذا الإيصال (أو إحدى صفحاته) تم رفعه من قبل — رقم #${ids}`);
        }
      }

      // Upload each page to storage.
      const image_urls: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, f);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);
        image_urls.push(pub.publicUrl);
      }

      const image_url: string | null = image_urls[0] ?? r.image_url ?? null;
      const image_hash: string | null = image_hashes[0] ?? null;

      const { image_file, image_files, ...rest } = r as any;
      const { data, error } = await supabase.from("print_receipts" as any).insert({
        ...rest,
        image_url,
        image_urls: image_urls.length ? image_urls : null,
        image_hash,
        image_hashes: image_hashes.length ? image_hashes : null,
        pages_count: Math.max(1, files.length || 1),
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateReceiptQueries(qc);
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
      invalidateReceiptQueries(qc);
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
      invalidateReceiptQueries(qc);
      toast.success("تم الحذف");
    },
  });
}
