import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Transfer = Tables<"transfers"> & {
  branches?: { name: string } | null;
};

export function useTransfers() {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select(`
          *,
          branches (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Transfer[];
    },
  });
}

export function useConfirmTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("transfers")
        .update({ 
          is_confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", transferId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("تم تأكيد التحويل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تأكيد التحويل");
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", transferId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("تم حذف التحويل");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف التحويل");
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tables<"transfers">> }) => {
      const { error } = await supabase
        .from("transfers")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("تم تحديث التحويل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث التحويل");
    },
  });
}

export type ExtractedTransferData = {
  amount: number | null;
  date: string | null;
  sender_name: string | null;
  reference_number: string | null;
  confidence: number;
};

export function useExtractTransferAmount() {
  return useMutation({
    mutationFn: async ({ imageBase64, transferId }: { imageBase64: string; transferId?: string }): Promise<ExtractedTransferData> => {
      const { data, error } = await supabase.functions.invoke('extract-transfer-amount', {
        body: { imageBase64, transferId },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as ExtractedTransferData;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء استخراج البيانات");
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      branch_id: string;
      amount: number;
      transfer_date: string;
      sender_name?: string;
      sender_phone?: string;
      image_url?: string;
      notes?: string;
    }) => {
      const { data: newTransfer, error } = await supabase
        .from("transfers")
        .insert({
          ...data,
          is_confirmed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return newTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("تم إضافة التحويل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة التحويل");
    },
  });
}
