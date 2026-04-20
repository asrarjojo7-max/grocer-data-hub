import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function downloadGreenApiMedia(downloadUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(downloadUrl);
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    const uint8 = new Uint8Array(ab);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const base64 = btoa(binary);
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("downloadGreenApiMedia error:", e);
    return null;
  }
}

async function uploadToStorage(supabase: any, base64DataUrl: string, branchId: string): Promise<string | null> {
  try {
    const match = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const ext = contentType.split("/")[1] || "jpg";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `whatsapp/${branchId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, bytes, { contentType });
    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.error("uploadToStorage failed:", e);
    return null;
  }
}

async function matchDesignerByPhone(supabase: any, fromNumber: string): Promise<{ id: string; full_name: string | null; commission_percentage: number } | null> {
  try {
    const digits = (fromNumber || "").replace(/\D/g, "");
    if (digits.length < 9) return null;
    const suffix = digits.slice(-9);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, commission_percentage")
      .not("phone", "is", null);
    if (error || !data) return null;
    const match = data.find((p: any) => {
      const pd = (p.phone || "").replace(/\D/g, "");
      return pd.length >= 9 && pd.slice(-9) === suffix;
    });
    return match ? { id: match.id, full_name: match.full_name, commission_percentage: Number(match.commission_percentage ?? 10) } : null;
  } catch (e) {
    console.error("matchDesignerByPhone error:", e);
    return null;
  }
}

async function extractPrintReceipt(imageBase64: string): Promise<any | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/extract-print-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!resp.ok) {
      console.error("extract-print-receipt failed:", resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    return json.success ? json.data : null;
  } catch (e) {
    console.error("extractPrintReceipt error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("[green-api-webhook] received:", body.typeWebhook, "instance=", body.instanceData?.idInstance, "chat=", body.senderData?.chatId, "type=", body.messageData?.typeMessage);

    if (body.typeWebhook !== "incomingMessageReceived") {
      return new Response(JSON.stringify({ status: "ignored", reason: body.typeWebhook }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceId = body.instanceData?.idInstance;
    const messageData = body.messageData;
    const senderData = body.senderData;
    if (!instanceId || !messageData) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageType = messageData.typeMessage;
    const messageId = body.idMessage;
    const fromNumber = senderData?.sender || "";
    const chatId: string = senderData?.chatId || "";
    const senderName: string | null = senderData?.senderName || senderData?.chatName || null;

    // 1) Try DESIGNER personal link first (one designer = one instance, monitors a chosen group)
    const { data: designerLink } = await supabase
      .from("designer_whatsapp_links")
      .select("*")
      .eq("green_api_instance_id", instanceId.toString())
      .maybeSingle();

    if (designerLink) {
      console.log(`[designer-link] user=${designerLink.user_id} chatId=${chatId} type=${messageType} monitored=${designerLink.monitored_chat_id}`);

      // Only filter NON-image messages by chat. Always accept images so designers can send
      // receipts either in the monitored group OR directly to their own number.
      if (messageType !== "imageMessage") {
        if (designerLink.monitored_chat_id && chatId !== designerLink.monitored_chat_id) {
          return new Response(JSON.stringify({ status: "ignored_non_image" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (messageType === "imageMessage") {
        console.log(`[designer-link] processing image from chat=${chatId}`);
        const downloadUrl = messageData.fileMessageData?.downloadUrl;
        if (!downloadUrl) {
          console.warn("[designer-link] no downloadUrl on imageMessage");
        } else {
          const imageBase64 = await downloadGreenApiMedia(downloadUrl);
          if (!imageBase64) {
            console.warn("[designer-link] failed to download media");
          } else {
            const extracted = await extractPrintReceipt(imageBase64);
            console.log("[designer-link] extracted:", JSON.stringify(extracted));

            if (extracted && extracted.is_receipt === false) {
              console.log("[designer-link] image is NOT a receipt, ignoring");
            } else {
              const publicUrl = await uploadToStorage(supabase, imageBase64, designerLink.user_id);

              const { data: profile } = await supabase
                .from("profiles")
                .select("commission_percentage, full_name")
                .eq("id", designerLink.user_id)
                .maybeSingle();

              const pricePerMeter = 300;
              const meters = Number(extracted?.total_meters ?? 0);
              const totalAmount = meters * pricePerMeter;
              const commissionPerMeter = Number(profile?.commission_percentage ?? 0);
              const commissionAmount = meters * commissionPerMeter;
              const netAmount = totalAmount - commissionAmount;

              const { error: insErr } = await supabase.from("print_receipts").insert({
                user_id: designerLink.user_id,
                branch_id: null,
                customer_name: extracted?.customer_name ?? null,
                receipt_date: extracted?.receipt_date ?? new Date().toISOString().split("T")[0],
                total_meters: meters,
                price_per_meter: pricePerMeter,
                total_amount: totalAmount,
                commission_percentage: commissionPerMeter,
                commission_amount: commissionAmount,
                net_amount: netAmount,
                image_url: publicUrl,
                extracted_data: extracted,
                ai_confidence: extracted?.ai_confidence ?? null,
                ai_notes: extracted?.ai_notes ?? null,
                is_confirmed: false,
                source: "whatsapp",
                whatsapp_from_number: fromNumber,
                notes: `وارد من واتساب (${senderName || "غير معروف"}) — مجموعة: ${designerLink.monitored_chat_name || "كل المحادثات"}`,
              });
              if (insErr) console.error("[designer-link] insert error:", insErr);
              else console.log("[designer-link] receipt saved successfully");
            }
          }
        }
      }

      await supabase
        .from("designer_whatsapp_links")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", designerLink.id);

      return new Response(JSON.stringify({ status: "processed_designer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Fallback to legacy branch-level connection
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("*, branches(*)")
      .eq("green_api_instance_id", instanceId.toString())
      .single();

    if (connectionError || !connection) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("whatsapp_messages").insert({
      whatsapp_connection_id: connection.id,
      message_id: messageId,
      from_number: fromNumber,
      message_type: messageType,
      content:
        messageData.textMessageData?.textMessage ||
        messageData.extendedTextMessageData?.text ||
        null,
      processed: false,
    });

    if (messageType === "imageMessage") {
      const downloadUrl = messageData.fileMessageData?.downloadUrl;
      if (!downloadUrl) {
        console.warn("No downloadUrl in imageMessage");
      } else {
        const imageBase64 = await downloadGreenApiMedia(downloadUrl);
        if (imageBase64) {
          const publicUrl = await uploadToStorage(supabase, imageBase64, connection.branch_id);
          const extracted = await extractPrintReceipt(imageBase64);

          const designer = await matchDesignerByPhone(supabase, fromNumber);
          const pricePerMeter = Number(connection.branches?.default_price_per_meter ?? 300);
          const meters = Number(extracted?.total_meters ?? 0);
          const totalAmount = meters * pricePerMeter;
          const commissionPerMeter = Number(designer?.commission_percentage ?? 0);
          const commissionAmount = meters * commissionPerMeter;
          const netAmount = totalAmount - commissionAmount;

          const { error: insErr } = await supabase.from("print_receipts").insert({
            user_id: designer?.id ?? null,
            branch_id: connection.branch_id,
            customer_name: extracted?.customer_name ?? null,
            receipt_date: extracted?.receipt_date ?? new Date().toISOString().split("T")[0],
            total_meters: meters,
            price_per_meter: pricePerMeter,
            total_amount: totalAmount,
            commission_percentage: commissionPerMeter,
            commission_amount: commissionAmount,
            net_amount: netAmount,
            image_url: publicUrl,
            extracted_data: extracted,
            ai_confidence: extracted?.ai_confidence ?? null,
            ai_notes: extracted?.ai_notes ?? null,
            is_confirmed: false,
            source: "whatsapp",
            whatsapp_from_number: fromNumber,
            notes: designer
              ? `وارد من واتساب Green API — مرتبط بالمصمم ${designer.full_name ?? ""}`
              : `وارد من واتساب Green API من رقم غير مسجل (${fromNumber})`,
          });
          if (insErr) console.error("Insert print_receipt error:", insErr);
        }
      }
    }

    await supabase
      .from("whatsapp_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection.id);

    return new Response(JSON.stringify({ status: "processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Green API webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
