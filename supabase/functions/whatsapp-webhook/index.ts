import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Download image from WhatsApp Media API and return as base64 data URL
async function downloadWhatsAppMedia(mediaId: string, accessToken: string): Promise<string | null> {
  try {
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mediaResponse.ok) {
      console.error("Failed to get media URL:", await mediaResponse.text());
      return null;
    }
    const mediaData = await mediaResponse.json();
    const mediaUrl = mediaData.url;
    if (!mediaUrl) return null;

    const imageResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!imageResponse.ok) return null;

    const arrayBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    const base64 = btoa(binary);
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error downloading WhatsApp media:", error);
    return null;
  }
}

// Upload base64 to receipts storage and return public URL
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

// Match designer profile by phone number (compares last 9 digits)
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

// Call extract-print-receipt edge function
async function extractPrintReceipt(imageBase64: string, supabase: any): Promise<any | null> {
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);

    // Webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const VERIFY_TOKEN = "lovable_whatsapp_verify";
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
      return new Response("Verification failed", { status: 403, headers: corsHeaders });
    }

    if (req.method === "POST") {
      const body = await req.json();
      console.log("WhatsApp webhook payload:", JSON.stringify(body));

      const value = body.entry?.[0]?.changes?.[0]?.value;
      if (value?.messages) {
        for (const message of value.messages) {
          const fromNumber = message.from;
          const messageId = message.id;
          const messageType = message.type;

          const { data: connection } = await supabase
            .from("whatsapp_connections")
            .select("*, branches(*)")
            .eq("phone_number", `+${value.metadata.display_phone_number}`)
            .single();

          if (!connection) continue;

          let content: string | null = null;
          let mediaBase64: string | null = null;

          if (messageType === "text") {
            content = message.text?.body;
          } else if (messageType === "image") {
            content = message.image?.caption ?? null;
            if (message.image?.id && connection.access_token) {
              mediaBase64 = await downloadWhatsAppMedia(message.image.id, connection.access_token);
            }
          }

          await supabase.from("whatsapp_messages").insert({
            whatsapp_connection_id: connection.id,
            message_id: messageId,
            from_number: fromNumber,
            message_type: messageType,
            content,
            media_url: mediaBase64 ? "uploaded" : null,
          });

          // Process print receipt image
          if (messageType === "image" && mediaBase64) {
            const publicUrl = await uploadToStorage(supabase, mediaBase64, connection.branch_id);
            const extracted = await extractPrintReceipt(mediaBase64, supabase);

            // Match designer by phone (last 9 digits to ignore country code variations)
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
                ? `وارد من واتساب — مرتبط بالمصمم ${designer.full_name ?? ""}`
                : `وارد من واتساب من رقم غير مسجل (${fromNumber})`,
            });
            if (insErr) console.error("Insert print_receipt error:", insErr);
          }

          await supabase
            .from("whatsapp_connections")
            .update({ last_sync_at: new Date().toISOString() })
            .eq("id", connection.id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
