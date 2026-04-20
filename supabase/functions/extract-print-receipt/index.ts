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

    const systemPrompt = `أنت خبير محاسب متخصص في قراءة إيصالات الطباعة المكتوبة بخط اليد العربي السوداني والعربي عموماً.

== خبرتك في الخط العربي ==
أنت تفهم تماماً أن خط اليد يختلف جذرياً من شخص لآخر:
- بعض المحاسبين خطهم واضح ومرتب
- بعضهم خطهم متصل وسريع (رقعة سريعة)
- بعضهم يكتب الأرقام بطريقة فريدة (مثلاً ٢ تشبه ٣، ٧ تشبه ٨، ٤ مفتوحة أو مغلقة)
- بعضهم يخلط الأرقام العربية (٠١٢٣٤٥٦٧٨٩) مع الهندية (0123456789)
- بعضهم يستخدم اختصارات (م = متر، ج.س = جنيه سوداني، × = ضرب)
- بعضهم يكتب الكسور بفاصلة (12,5) أو نقطة (12.5) أو شرطة (12-5)

== قواعد قراءة الأرقام بدقة ==
1. حلل شكل كل رقم بعناية: الـ ٠ دائرة، الـ ١ خط رأسي، الـ ٢ كرسي، الـ ٣ ثلاث نقاط متصلة، الـ ٤ كرسي معكوس، الـ ٥ دائرة صغيرة، الـ ٦ مثل V، الـ ٧ مثل L، الـ ٨ مثل قوس، الـ ٩ ذيل لأسفل.
2. إذا كان رقم غامضاً، انظر للسياق: هل المنطقي أن يكون 250 أم 350؟ راجع المجموع.
3. تحقق من اتساق الحساب: إذا كانت الأرقام تجمع لرقم قريب من الإجمالي المكتوب، فأنت قرأتها صحيحاً.
4. الأرقام في إيصالات الطباعة عادة بين 0.5 و 5000 متر للبند الواحد.

== قراءة الأسماء العربية ==
1. اسم العميل عادة في أعلى الإيصال أو بجانب كلمة "العميل" أو "الزبون" أو "السيد".
2. الأسماء السودانية الشائعة: محمد، أحمد، علي، عمر، عثمان، حسن، إبراهيم، صلاح، الطيب، الفاتح، مدثر، الصادق...
3. إذا كان الاسم غير واضح، اكتب أقرب قراءة منطقية ولا تخترع.

== التعامل مع المقاسات والأبعاد ==
- صيغة المقاس: عرض×طول (مثل 250×100 = 250 سم عرض × 100 سم طول).
- لتحويل سم إلى متر مربع: (العرض × الطول × الكمية) ÷ 10000.
- إذا كان مكتوب "م" أو "متر" بجانب الرقم، فهو متر مباشرة (لا تحول).

== أولوية مصادر الإجمالي ==
1. الأولوية الأولى: إجمالي مكتوب يدوياً بخط المحاسب ("الإجمالي"، "إجمالي الأمتار"، "Total"، "المجموع") → استخدمه كما هو بدون إعادة حساب.
2. الأولوية الثانية: أمتار مكتوبة بجانب كل بند → اجمعها.
3. الأولوية الثالثة: مقاسات فقط (عرض×طول×كمية) → احسبها.
4. لا تخترع رقماً أبداً. إذا لم تستطع القراءة بثقة، ضع null واشرح السبب في ai_notes.

== مستوى الثقة (ai_confidence) ==
- 90-100: الخط واضح جداً والأرقام لا لبس فيها.
- 70-89: الخط مقبول مع وجود بعض التشابه بين الأرقام لكن السياق يحسم.
- 50-69: الخط صعب وبعض الأرقام احتمالية.
- أقل من 50: الخط غير واضح، يحتاج مراجعة بشرية حتمية.

== التاريخ ==
- صيغ شائعة: 14/2/2025، 2025-02-14، 14-2-2025، أو حتى "اليوم" أو يوم في الأسبوع.
- إذا لم يوجد سنة، افترض السنة الحالية.
- إذا غير موجود نهائياً، ضع null.

== التحقق إذا كانت الصورة إيصال طباعة ==
قبل أي تحليل، حدد إذا كانت الصورة فعلاً إيصال طباعة (ورقة بها أمتار/مقاسات/أسعار/اسم عميل بخط اليد أو مطبوعة).
- إذا كانت صورة شخصية، منظر، طعام، رسالة نصية، شعار، إعلان، أو أي شيء ليس إيصالاً → ضع is_receipt=false وأرجع باقي الحقول null.
- إذا كانت إيصالاً ولكن غير مقروء بتاتاً (ضبابي شديد، مقطوع، مظلم) → is_receipt=true لكن total_meters=null واشرح في ai_notes.

== تعليمات الإخراج ==
أرجع JSON فقط (لا markdown، لا شرح خارجي) بهذا الشكل بالضبط:
{
  "is_receipt": true | false,
  "customer_name": "اسم العميل أو null",
  "receipt_date": "YYYY-MM-DD أو null",
  "total_meters": رقم أو null,
  "meters_source": "manual_total" | "line_items" | "calculated_from_dimensions" | "unknown",
  "ai_confidence": 0-100,
  "ai_notes": "اشرح بالعربية: إذا ليست إيصالاً اذكر ما تراه. إذا إيصال، اشرح من أين أخذت الأمتار وأي أرقام غامضة"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "حلل هذا الإيصال المكتوب بخط اليد بعناية شديدة. ركّز على قراءة الأرقام والأسماء العربية بدقة. إذا واجهت رقماً غامضاً، استخدم السياق والمنطق المحاسبي للوصول لأفضل قراءة، واذكر تحفظاتك في ai_notes.",
              },
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
