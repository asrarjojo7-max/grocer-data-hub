import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 90-second window: any image arriving from the same sender within this
// window is appended to the same pending group instead of creating a new
// receipt. Adjust here if needed.
const GROUP_WINDOW_MS = 90_000;

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

async function uploadToStorage(supabase: any, base64DataUrl: string, scopeId: string): Promise<string | null> {
  try {
    const match = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const ext = contentType.split("/")[1] || "jpg";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `whatsapp/${scopeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

// Compute SHA-256 of base64 image bytes for duplicate detection.
async function sha256Hex(base64DataUrl: string): Promise<string | null> {
  try {
    const m = base64DataUrl.match(/^data:.+;base64,(.+)$/);
    if (!m) return null;
    const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
    const buf = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

async function matchDesignerByPhone(supabase: any, fromNumber: string): Promise<{ id: string; full_name: string | null; commission_per_meter: number } | null> {
  try {
    const digits = (fromNumber || "").replace(/\D/g, "");
    if (digits.length < 9) return null;
    const suffix = digits.slice(-9);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, commission_per_meter")
      .not("phone", "is", null);
    if (error || !data) return null;
    const match = data.find((p: any) => {
      const pd = (p.phone || "").replace(/\D/g, "");
      return pd.length >= 9 && pd.slice(-9) === suffix;
    });
    return match ? { id: match.id, full_name: match.full_name, commission_per_meter: Number(match.commission_per_meter ?? 10) } : null;
  } catch (e) {
    console.error("matchDesignerByPhone error:", e);
    return null;
  }
}

// Call extract-print-receipt with one OR many images. The edge function
// accepts both `imageBase64` (single) and `imagesBase64[]` (multi-page).
async function extractPrintReceipt(images: string[]): Promise<any | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/extract-print-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ imagesBase64: images }),
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

// Persist a pending group as a final print_receipts row (called when the
// 90-second window closes or when a single-image scenario is processed).
async function finalizeReceiptFromGroup(
  supabase: any,
  group: {
    user_id: string | null;
    branch_id: string | null;
    image_data_urls: string[];
    image_storage_urls: string[];
    image_hashes: string[];
    from_number: string;
    sender_name: string | null;
    monitored_chat_name?: string | null;
  }
) {
  if (!group.image_data_urls.length) return;

  const extracted = await extractPrintReceipt(group.image_data_urls);
  if (extracted && extracted.is_receipt === false) {
    console.log("[finalize] image group is not a receipt, skipping");
    return;
  }

  // Look up commission rate from the matched designer profile.
  let commissionPerMeter = 0;
  if (group.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("commission_per_meter")
      .eq("id", group.user_id)
      .maybeSingle();
    commissionPerMeter = Number(profile?.commission_per_meter ?? 0);
  } else {
    const designer = await matchDesignerByPhone(supabase, group.from_number);
    if (designer) commissionPerMeter = designer.commission_per_meter;
  }

  // Default price falls back to branch default or 300.
  let pricePerMeter = 300;
  if (group.branch_id) {
    const { data: branch } = await supabase
      .from("branches")
      .select("default_price_per_meter")
      .eq("id", group.branch_id)
      .maybeSingle();
    pricePerMeter = Number(branch?.default_price_per_meter ?? 300);
  }

  const meters = Number(extracted?.total_meters ?? 0);
  const totalAmount = meters * pricePerMeter;
  const commissionAmount = meters * commissionPerMeter;
  const netAmount = totalAmount - commissionAmount;

  const { error: insErr } = await supabase.from("print_receipts").insert({
    user_id: group.user_id,
    branch_id: group.branch_id,
    customer_name: extracted?.customer_name ?? null,
    receipt_date: extracted?.receipt_date ?? new Date().toISOString().split("T")[0],
    total_meters: meters,
    price_per_meter: pricePerMeter,
    total_amount: totalAmount,
    commission_per_meter: commissionPerMeter,
    commission_amount: commissionAmount,
    net_amount: netAmount,
    image_url: group.image_storage_urls[0] ?? null,
    image_urls: group.image_storage_urls.length ? group.image_storage_urls : null,
    image_hash: group.image_hashes[0] ?? null,
    image_hashes: group.image_hashes.length ? group.image_hashes : null,
    pages_count: Math.max(1, group.image_data_urls.length),
    extracted_data: extracted,
    ai_confidence: extracted?.ai_confidence ?? null,
    ai_notes: extracted?.ai_notes ?? null,
    is_confirmed: false,
    source: "whatsapp",
    whatsapp_from_number: group.from_number,
    notes: `وارد من واتساب (${group.sender_name || "غير معروف"}) — ${group.image_data_urls.length} صفحة`,
  });
  if (insErr) console.error("[finalize] insert error:", insErr);
  else console.log(`[finalize] saved receipt with ${group.image_data_urls.length} pages from ${group.from_number}`);
}

// Sweep expired groups: anything past expires_at and still 'collecting'
// should be finalized into a real print_receipts row. Best-effort, ignores
// failures so the main webhook keeps working.
async function sweepExpiredGroups(supabase: any) {
  try {
    const nowIso = new Date().toISOString();
    const { data: expired } = await supabase
      .from("whatsapp_pending_groups")
      .select("*")
      .eq("status", "collecting")
      .lt("expires_at", nowIso)
      .limit(20);

    for (const g of expired || []) {
      // Mark processing first so concurrent webhooks don't double-finalize.
      const { error: lockErr } = await supabase
        .from("whatsapp_pending_groups")
        .update({ status: "processing" })
        .eq("id", g.id)
        .eq("status", "collecting");
      if (lockErr) continue;

      try {
        await finalizeReceiptFromGroup(supabase, {
          user_id: g.user_id,
          branch_id: g.branch_id,
          image_data_urls: g.image_data_urls || [],
          image_storage_urls: g.image_storage_urls || [],
          image_hashes: g.image_hashes || [],
          from_number: g.from_number,
          sender_name: g.sender_name,
        });
        await supabase.from("whatsapp_pending_groups").update({ status: "done" }).eq("id", g.id);
      } catch (e) {
        console.error("sweep finalize failed:", e);
        await supabase.from("whatsapp_pending_groups").update({ status: "error" }).eq("id", g.id);
      }
    }
  } catch (e) {
    console.error("sweepExpiredGroups error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Opportunistic cleanup of any expired groups from previous webhooks.
    // This guarantees groups still finalize even if no new image arrives
    // immediately after the 90-second window expires.
    await sweepExpiredGroups(supabase);

    const body = await req.json();
    console.log("[green-api-webhook] received:", body.typeWebhook, "instance=", body.instanceData?.idInstance, "chat=", body.senderData?.chatId, "type=", body.messageData?.typeMessage);

    const allowedTypes = ["incomingMessageReceived", "outgoingMessageReceived", "outgoingAPIMessageReceived"];
    if (!allowedTypes.includes(body.typeWebhook)) {
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

    // Resolve which "scope" this image belongs to (designer link vs branch).
    const { data: designerLink } = await supabase
      .from("designer_whatsapp_links")
      .select("*")
      .eq("green_api_instance_id", instanceId.toString())
      .maybeSingle();

    let scope: { user_id: string | null; branch_id: string | null; storageScopeId: string } | null = null;

    if (designerLink) {
      // Filter NON-image messages by chat (legacy behavior).
      if (messageType !== "imageMessage") {
        if (designerLink.monitored_chat_id && chatId !== designerLink.monitored_chat_id) {
          return new Response(JSON.stringify({ status: "ignored_non_image" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      scope = { user_id: designerLink.user_id, branch_id: null, storageScopeId: designerLink.user_id };
    } else {
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("id, branch_id")
        .eq("green_api_instance_id", instanceId.toString())
        .maybeSingle();
      if (!connection) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the message for the legacy branch-based flow.
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

      const designer = await matchDesignerByPhone(supabase, fromNumber);
      scope = {
        user_id: designer?.id ?? null,
        branch_id: connection.branch_id,
        storageScopeId: connection.branch_id,
      };
    }

    if (messageType !== "imageMessage") {
      return new Response(JSON.stringify({ status: "ignored_non_image" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const downloadUrl = messageData.fileMessageData?.downloadUrl;
    if (!downloadUrl) {
      return new Response(JSON.stringify({ status: "no_download_url" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBase64 = await downloadGreenApiMedia(downloadUrl);
    if (!imageBase64) {
      return new Response(JSON.stringify({ status: "download_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storageUrl = await uploadToStorage(supabase, imageBase64, scope.storageScopeId);
    const hash = await sha256Hex(imageBase64);

    // ── 90-second grouping logic ──
    // If an active 'collecting' group exists for the same instance + sender
    // and hasn't expired, append this image to it. Otherwise start a new one.
    const nowIso = new Date().toISOString();
    const { data: activeGroup } = await supabase
      .from("whatsapp_pending_groups")
      .select("*")
      .eq("instance_id", instanceId.toString())
      .eq("from_number", fromNumber)
      .eq("status", "collecting")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newExpiry = new Date(Date.now() + GROUP_WINDOW_MS).toISOString();

    if (activeGroup) {
      const newDataUrls = [...(activeGroup.image_data_urls || []), imageBase64];
      const newStorageUrls = [...(activeGroup.image_storage_urls || []), storageUrl].filter(Boolean);
      const newHashes = [...(activeGroup.image_hashes || []), hash].filter(Boolean);

      await supabase
        .from("whatsapp_pending_groups")
        .update({
          image_data_urls: newDataUrls,
          image_storage_urls: newStorageUrls,
          image_hashes: newHashes,
          pages_count: newDataUrls.length,
          expires_at: newExpiry, // sliding window: each new image extends 90s
        })
        .eq("id", activeGroup.id);

      console.log(`[group] appended page ${newDataUrls.length} to group ${activeGroup.id} from ${fromNumber}`);
    } else {
      const { data: created, error: gErr } = await supabase
        .from("whatsapp_pending_groups")
        .insert({
          instance_id: instanceId.toString(),
          from_number: fromNumber,
          chat_id: chatId,
          user_id: scope.user_id,
          branch_id: scope.branch_id,
          sender_name: senderName,
          image_data_urls: [imageBase64],
          image_storage_urls: storageUrl ? [storageUrl] : [],
          image_hashes: hash ? [hash] : [],
          pages_count: 1,
          expires_at: newExpiry,
          status: "collecting",
        })
        .select("id")
        .single();
      if (gErr) console.error("[group] insert error:", gErr);
      else console.log(`[group] created new group ${created?.id} for ${fromNumber}`);
    }

    // Update last_sync_at on the originating connection.
    if (designerLink) {
      await supabase
        .from("designer_whatsapp_links")
        .update({ last_sync_at: nowIso })
        .eq("id", designerLink.id);
    }

    return new Response(JSON.stringify({ status: "queued_in_group" }), {
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
