import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Branch {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBranches = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading, error } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Branch[];
    },
  });

  const addBranch = useMutation({
    mutationFn: async (branch: { name: string; location?: string; phone?: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .insert(branch)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الفرع بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفرع",
        variant: "destructive",
      });
      console.error('Error adding branch:', error);
    },
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Branch> & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الفرع بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفرع",
        variant: "destructive",
      });
      console.error('Error updating branch:', error);
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفرع بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الفرع",
        variant: "destructive",
      });
      console.error('Error deleting branch:', error);
    },
  });

  return {
    branches,
    isLoading,
    error,
    addBranch,
    updateBranch,
    deleteBranch,
  };
};
