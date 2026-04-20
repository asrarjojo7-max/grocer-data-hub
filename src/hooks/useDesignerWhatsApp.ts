import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DesignerWhatsAppLink = {
  id: string;
  user_id: string;
  phone_number: string;
  green_api_instance_id: string;
  green_api_token: string;
  monitored_chat_id: string | null;
  monitored_chat_name: string | null;
  status: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useMyWhatsAppLink() {
  return useQuery({
    queryKey: ["my-wa-link"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("designer_whatsapp_links" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as DesignerWhatsAppLink) || null;
    },
  });
}

export function useTestGreenApi() {
  return useMutation({
    mutationFn: async ({ instanceId, apiToken }: { instanceId: string; apiToken: string }) => {
      const id = instanceId.trim();
      const tk = apiToken.trim();
      if (!id || !tk) throw new Error("أدخل Instance ID و API Token");
      let r: Response;
      try {
        r = await fetch(`https://api.green-api.com/waInstance${id}/getStateInstance/${tk}`);
      } catch {
        throw new Error("تعذّر الاتصال بـ Green API — تحقق من الإنترنت");
      }
      if (r.status === 401 || r.status === 403) throw new Error("Instance ID أو Token غير صحيح");
      if (!r.ok) throw new Error(`فشل التحقق (${r.status}) — تأكد من البيانات`);
      const d = await r.json();
      if (d.stateInstance !== "authorized") {
        throw new Error("الـ Instance غير مفعّل — امسح QR من لوحة Green API أولاً");
      }
      return d;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGreenApiChats() {
  return useMutation({
    mutationFn: async ({ instanceId, apiToken }: { instanceId: string; apiToken: string }) => {
      const id = instanceId.trim();
      const tk = apiToken.trim();
      // Try getChats first (returns groups + DMs), fallback to getContacts
      let raw: Array<{ id: string; name?: string; type?: string }> = [];
      try {
        const r = await fetch(`https://api.green-api.com/waInstance${id}/getChats/${tk}`);
        if (r.ok) raw = await r.json();
      } catch { /* ignore */ }

      if (!raw || raw.length === 0) {
        const r2 = await fetch(`https://api.green-api.com/waInstance${id}/getContacts/${tk}`);
        if (!r2.ok) throw new Error("فشل جلب المحادثات");
        raw = await r2.json();
      }

      const groups = (raw || [])
        .filter((c) => typeof c.id === "string" && c.id.endsWith("@g.us"))
        .map((c) => ({ id: c.id, name: c.name || c.id.replace("@g.us", "") }));
      return groups;
    },
    onError: (e: Error) => toast.error(e.message || "فشل جلب المجموعات"),
  });
}

export function useSetupGreenApiWebhook() {
  return useMutation({
    mutationFn: async ({ instanceId, apiToken }: { instanceId: string; apiToken: string }) => {
      const id = instanceId.trim();
      const tk = apiToken.trim();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/green-api-webhook`;
      const r = await fetch(`https://api.green-api.com/waInstance${id}/setSettings/${tk}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          webhookUrlToken: "",
          incomingWebhook: "yes",
          outgoingWebhook: "no",
          outgoingMessageWebhook: "no",
          stateWebhook: "no",
          deviceWebhook: "no",
        }),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        console.error("setSettings failed:", r.status, text);
        throw new Error("فشل إعداد Webhook في Green API");
      }
      return await r.json();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDiagnoseGreenApi() {
  return useMutation({
    mutationFn: async ({ instanceId, apiToken }: { instanceId: string; apiToken: string }) => {
      const id = instanceId.trim();
      const tk = apiToken.trim();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const expectedUrl = `https://${projectId}.supabase.co/functions/v1/green-api-webhook`;

      const stateRes = await fetch(`https://api.green-api.com/waInstance${id}/getStateInstance/${tk}`);
      const state = stateRes.ok ? await stateRes.json() : null;

      const settingsRes = await fetch(`https://api.green-api.com/waInstance${id}/getSettings/${tk}`);
      const settings = settingsRes.ok ? await settingsRes.json() : null;

      const issues: string[] = [];
      if (state?.stateInstance !== "authorized") issues.push("الـ Instance غير مفعّل — امسح QR من Green API");
      if (settings?.webhookUrl !== expectedUrl) issues.push(`Webhook URL غير مطابق. الحالي: ${settings?.webhookUrl || "(فارغ)"}`);
      if (settings?.incomingWebhook !== "yes") issues.push("incomingWebhook معطّل");

      if (issues.length === 0) toast.success("كل شيء سليم ✅ Green API يرسل للنظام");
      else toast.error(issues.join(" • "), { duration: 9000 });

      return { state, settings, expectedUrl, issues };
    },
    onError: (e: Error) => toast.error(e.message || "فشل التشخيص"),
  });
}

export function useSaveWhatsAppLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      phone_number: string;
      green_api_instance_id: string;
      green_api_token: string;
      monitored_chat_id?: string | null;
      monitored_chat_name?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Also save phone in profile for matching
      await supabase.from("profiles").update({ phone: payload.phone_number }).eq("id", user.id);

      const { data, error } = await supabase
        .from("designer_whatsapp_links" as any)
        .upsert({ ...payload, user_id: user.id, status: "connected" }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-wa-link"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("تم ربط حسابك بالواتساب بنجاح ✅");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWhatsAppLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("designer_whatsapp_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-wa-link"] });
      toast.success("تم فصل الحساب");
    },
  });
}
