import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGreenApiConnection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addGreenApiConnection = useMutation({
    mutationFn: async ({
      branchId,
      phoneNumber,
      instanceId,
      apiToken,
    }: {
      branchId: string;
      phoneNumber: string;
      instanceId: string;
      apiToken: string;
    }) => {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .insert({
          branch_id: branchId,
          phone_number: phoneNumber,
          connection_type: "green_api",
          green_api_instance_id: instanceId,
          green_api_token: apiToken,
          status: "pending",
        })
        .select("*, branches(*)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connections"] });
      toast({
        title: "تم إضافة الربط",
        description: "تم حفظ بيانات Green API بنجاح",
      });
    },
    onError: (error: any) => {
      let message = "فشل في إضافة الربط";
      if (error.code === "23505") {
        message = "هذا الفرع أو الرقم مرتبط مسبقاً";
      }
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
      console.error("Error adding Green API connection:", error);
    },
  });

  const testGreenApiConnection = useMutation({
    mutationFn: async ({
      instanceId,
      apiToken,
    }: {
      instanceId: string;
      apiToken: string;
    }) => {
      // Test connection by getting account settings
      const response = await fetch(
        `https://api.green-api.com/waInstance${instanceId}/getSettings/${apiToken}`
      );

      if (!response.ok) {
        throw new Error("فشل الاتصال بـ Green API");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "الاتصال يعمل",
        description: "تم التحقق من صحة بيانات Green API بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الاختبار",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setupGreenApiWebhook = useMutation({
    mutationFn: async ({
      instanceId,
      apiToken,
      webhookUrl,
    }: {
      instanceId: string;
      apiToken: string;
      webhookUrl: string;
    }) => {
      const response = await fetch(
        `https://api.green-api.com/waInstance${instanceId}/setSettings/${apiToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookUrl: webhookUrl,
            webhookUrlToken: "",
            delaySendMessagesMilliseconds: 1000,
            markIncomingMessagesReaded: "yes",
            markIncomingMessagesReadedOnReply: "yes",
            outgoingWebhook: "yes",
            outgoingMessageWebhook: "yes",
            incomingWebhook: "yes",
            deviceWebhook: "no",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("فشل إعداد Webhook");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الإعداد",
        description: "تم إعداد Webhook بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    addGreenApiConnection,
    testGreenApiConnection,
    setupGreenApiWebhook,
  };
};
