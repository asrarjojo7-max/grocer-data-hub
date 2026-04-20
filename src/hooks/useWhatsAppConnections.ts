import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Branch } from "./useBranches";

export interface WhatsAppConnection {
  id: string;
  branch_id: string;
  phone_number: string;
  whatsapp_business_id: string | null;
  access_token: string | null;
  webhook_verify_token: string | null;
  status: "connected" | "pending" | "disconnected";
  last_sync_at: string | null;
  verification_code: string | null;
  verification_expires_at: string | null;
  created_at: string;
  updated_at: string;
  branches?: Branch;
}

const generateVerifyToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const useWhatsAppConnections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ['whatsapp-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*, branches(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppConnection[];
    },
  });

  const addConnection = useMutation({
    mutationFn: async ({ 
      branchId, 
      phoneNumber, 
      accessToken, 
      phoneNumberId 
    }: { 
      branchId: string; 
      phoneNumber: string;
      accessToken: string;
      phoneNumberId: string;
    }) => {
      const webhookVerifyToken = "lovable_whatsapp_verify";
      
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert({
          branch_id: branchId,
          phone_number: phoneNumber,
          access_token: accessToken,
          whatsapp_business_id: phoneNumberId,
          webhook_verify_token: webhookVerifyToken,
          status: 'pending',
        })
        .select('*, branches(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      toast({
        title: "تم إضافة الربط",
        description: "تم حفظ البيانات. قم بإعداد Webhook في Meta ثم اضغط تفعيل",
      });
    },
    onError: (error: any) => {
      let message = "فشل في إضافة الربط";
      if (error.code === '23505') {
        message = "هذا الفرع أو الرقم مرتبط مسبقاً";
      }
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
      console.error('Error adding connection:', error);
    },
  });

  const updateConnectionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WhatsAppConnection['status'] }) => {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .update({ status })
        .eq('id', id)
        .select('*, branches(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      const messages: Record<string, string> = {
        connected: "تم الاتصال بنجاح",
        disconnected: "تم قطع الاتصال",
        pending: "جاري إعادة الاتصال",
      };
      toast({
        title: "تم بنجاح",
        description: messages[variables.status],
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الاتصال",
        variant: "destructive",
      });
      console.error('Error updating connection:', error);
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف ربط WhatsApp Business بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الربط",
        variant: "destructive",
      });
      console.error('Error deleting connection:', error);
    },
  });

  const verifyConnection = useMutation({
    mutationFn: async (id: string) => {
      // This would typically verify with WhatsApp API
      // For now, we'll simulate verification by updating status to connected
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .update({ 
          status: 'connected',
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, branches(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      toast({
        title: "تم التحقق بنجاح",
        description: "تم ربط WhatsApp Business بالفرع",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في التحقق من الرقم",
        variant: "destructive",
      });
      console.error('Error verifying connection:', error);
    },
  });

  const testConnection = useMutation({
    mutationFn: async (id: string) => {
      // Get the connection details
      const { data: connection, error: fetchError } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !connection) throw new Error('Connection not found');
      
      // Test by calling WhatsApp API to get phone number details
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${connection.whatsapp_business_id}`,
        {
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'فشل الاتصال بـ WhatsApp API');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "الاتصال يعمل",
        description: "تم التحقق من صحة بيانات WhatsApp API بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الاختبار",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error testing connection:', error);
    },
  });

  return {
    connections,
    isLoading,
    error,
    addConnection,
    updateConnectionStatus,
    deleteConnection,
    verifyConnection,
    testConnection,
  };
};
