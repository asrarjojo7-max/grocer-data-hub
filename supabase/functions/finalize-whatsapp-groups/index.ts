// Periodic sweep: forces finalization of any whatsapp_pending_groups whose
// 90-second window has expired. Called by pg_cron every minute so receipts
// are guaranteed to materialize even when no new image arrives after the
// window closes. Safe to call manually too.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function extractPrintReceipt(images: string[]): Promise<any | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/extract-print-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ imagesBase64: images }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function matchDesignerByPhone(supabase: any, fromNumber: string) {
  const digits = (fromNumber || "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  const suffix = digits.slice(-9);
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, commission_per_meter")
    .not("phone", "is", null);
  if (!data) return null;
  const m = data.find((p: any) => {
    const pd = (p.phone || "").replace(/\D/g, "");
    return pd.length >= 9 && pd.slice(-9) === suffix;
  });
  return m ? { id: m.id, commission_per_meter: Number(m.commission_per_meter ?? 10) } : null;
}

async function finalize(supabase: any, g: any) {
  const images: string[] = g.image_data_urls || [];
  if (!images.length) return;

  const extracted = await extractPrintReceipt(images);
  if (extracted && extracted.is_receipt === false) return;

  let commissionPerMeter = 0;
  let userId = g.user_id;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles").select("commission_per_meter").eq("id", userId).maybeSingle();
    commissionPerMeter = Number(profile?.commission_per_meter ?? 0);
  } else {
    const designer = await matchDesignerByPhone(supabase, g.from_number);
    if (designer) { userId = designer.id; commissionPerMeter = designer.commission_per_meter; }
  }

  let pricePerMeter = 300;
  if (g.branch_id) {
    const { data: br } = await supabase
      .from("branches").select("default_price_per_meter").eq("id", g.branch_id).maybeSingle();
    pricePerMeter = Number(br?.default_price_per_meter ?? 300);
  }

  const meters = Number(extracted?.total_meters ?? 0);
  const totalAmount = meters * pricePerMeter;
  const commissionAmount = meters * commissionPerMeter;

  await supabase.from("print_receipts").insert({
    user_id: userId,
    branch_id: g.branch_id,
    customer_name: extracted?.customer_name ?? null,
    receipt_date: extracted?.receipt_date ?? new Date().toISOString().split("T")[0],
    total_meters: meters,
    price_per_meter: pricePerMeter,
    total_amount: totalAmount,
    commission_per_meter: commissionPerMeter,
    commission_amount: commissionAmount,
    net_amount: totalAmount - commissionAmount,
    image_url: (g.image_storage_urls || [])[0] ?? null,
    image_urls: (g.image_storage_urls || []).length ? g.image_storage_urls : null,
    image_hash: (g.image_hashes || [])[0] ?? null,
    image_hashes: (g.image_hashes || []).length ? g.image_hashes : null,
    pages_count: Math.max(1, images.length),
    extracted_data: extracted,
    ai_confidence: extracted?.ai_confidence ?? null,
    ai_notes: extracted?.ai_notes ?? null,
    is_confirmed: false,
    source: "whatsapp",
    whatsapp_from_number: g.from_number,
    notes: `وارد من واتساب (${g.sender_name || "غير معروف"}) — ${images.length} صفحة`,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const nowIso = new Date().toISOString();

    const { data: expired } = await supabase
      .from("whatsapp_pending_groups")
      .select("*")
      .eq("status", "collecting")
      .lt("expires_at", nowIso)
      .limit(50);

    let processed = 0;
    for (const g of expired || []) {
      const { error: lockErr } = await supabase
        .from("whatsapp_pending_groups")
        .update({ status: "processing" })
        .eq("id", g.id)
        .eq("status", "collecting");
      if (lockErr) continue;
      try {
        await finalize(supabase, g);
        await supabase.from("whatsapp_pending_groups").update({ status: "done" }).eq("id", g.id);
        processed++;
      } catch (e) {
        console.error("finalize error:", e);
        await supabase.from("whatsapp_pending_groups").update({ status: "error" }).eq("id", g.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
