import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: "imageBase64 مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت مساعد محاسب خبير في تحليل إيصالات الطباعة اليدوية باللغة العربية.

مهمتك: استخراج البيانات من صورة الإيصال مع احترام ما كتبه المحاسب يدوياً.

قواعد مهمة جداً:
1. احترم المحاسب - إذا وجدت رقماً إجمالياً مكتوباً بخط اليد ("الإجمالي" أو "إجمالي الأمتار" أو "Total")، استخدمه كما هو بدون إعادة حساب.
2. إذا لم يكتب إجمالي لكن كتب أمتاراً بجانب كل بند، اجمعها.
3. إذا كتب فقط المقاسات (مثل 250×100)، احسب: (العرض × الطول × الكمية) / 10000 لكل بند واجمع.
4. في ai_notes اشرح بالضبط من أين أخذت رقم الأمتار حتى يراجعك المحاسب.
5. لا تخترع أرقاماً - إذا لم تجد، ضع null.

أرجع JSON فقط بهذا الشكل بالضبط (لا markdown، لا شرح خارجي):
{
  "customer_name": "اسم العميل أو null",
  "receipt_date": "YYYY-MM-DD أو null",
  "total_meters": رقم أو null,
  "meters_source": "manual_total" | "line_items" | "calculated_from_dimensions" | "unknown",
  "ai_confidence": 0-100,
  "ai_notes": "شرح قصير بالعربية من أين أخذت الأمتار"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "حلل هذا الإيصال واستخرج البيانات." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "الرصيد غير كافٍ، يرجى إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("JSON parse failed:", content);
      throw new Error("فشل تحليل رد الذكاء الاصطناعي");
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-print-receipt error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
