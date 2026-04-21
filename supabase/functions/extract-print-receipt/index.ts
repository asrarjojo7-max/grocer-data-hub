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

    const systemPrompt = `أنت خبير محاسب متخصص في قراءة إيصالات الطباعة المكتوبة بخط اليد العربي السوداني والعربي عموماً، ومهمتك الأساسية هي الحصول على **عدد الأمتار الحقيقي** من الإيصال وليس مجرد قراءة أول رقم يظهر أمامك.

== خبرتك في الخط العربي ==
أنت تفهم تماماً أن خط اليد يختلف جذرياً من شخص لآخر:
- بعض المحاسبين خطهم واضح ومرتب، وبعضهم متصل وسريع (رقعة سريعة).
- بعضهم يكتب الأرقام بطريقة فريدة (٢ تشبه ٣، ٧ تشبه ٨، ٤ مفتوحة أو مغلقة).
- بعضهم يخلط الأرقام العربية (٠١٢٣٤٥٦٧٨٩) مع الهندية (0123456789).
- بعضهم يستخدم اختصارات (م = متر، ج.س = جنيه سوداني، × = ضرب).
- بعضهم يكتب الكسور بفاصلة (12,5) أو نقطة (12.5) أو شرطة (12-5).

== قواعد قراءة الأرقام بدقة ==
1. حلل شكل كل رقم بعناية: ٠ دائرة، ١ خط رأسي، ٢ كرسي، ٣ ثلاث نقاط متصلة، ٤ كرسي معكوس، ٥ دائرة صغيرة، ٦ مثل V، ٧ مثل L، ٨ قوس، ٩ ذيل لأسفل.
2. إذا كان رقم غامضاً، انظر للسياق وراجع المجموع.
3. الأرقام في إيصالات الطباعة عادة بين 0.5 و 500 متر للبند الواحد (نادراً ما يتجاوز بند واحد 500 متر).

== قراءة المقاسات والأبعاد ==
- صيغة المقاس: عرض×طول (مثل 250×100 = 250 سم عرض × 100 سم طول).
- لتحويل سم إلى متر مربع: (العرض_سم × الطول_سم × الكمية) ÷ 10000.
- إذا كان مكتوب "م" أو "متر" بجانب الرقم، فهو متر مباشرة.
- إذا كان الرقمان كلاهما أكبر من 10، فالأرجح أنهما بالسنتيمتر (مثلاً 200×150 = 3 م²).
- إذا كان أحدهما صغير (مثل 2×3 أو 1.5×2) فهو غالباً بالمتر مباشرة.

== ⚠️ قاعدة الذكاء الحرجة: التحقق من منطقية الأمتار ==
**هذه أهم قاعدة في عملك**: المحاسبون أحياناً يكتبون إجمالي **السعر بالجنيه** في خانة الأمتار أو بمكان مخصص للأمتار، والنظام السابق كان يثق بهم بشكل أعمى ويحسب النسبة على إجمالي سعر بدلاً من الأمتار، فيعطي نتائج كارثية.

**خطواتك الإلزامية قبل اعتماد أي رقم كـ total_meters:**

الخطوة 1 — استخرج كل البنود (line items) الموجودة في الإيصال:
- لكل بند: اقرأ المقاس (العرض×الطول) والكمية إن وجدت.
- احسب أمتار كل بند: (العرض_سم × الطول_سم × الكمية) ÷ 10000، أو استخدم الرقم المكتوب بجانبه إذا كان واضحاً أنه بالمتر.
- اجمع كل البنود → هذا هو **calculated_meters_from_dimensions**.

الخطوة 2 — ابحث عن أي رقم مكتوب يدوياً ومسمّى "الإجمالي" أو "إجمالي الأمتار" أو "Total" أو "المجموع" → هذا هو **written_total**.

الخطوة 3 — اختبر منطقية written_total بمقارنته مع calculated_meters_from_dimensions:
- إذا كان written_total قريب (± 20%) من calculated_meters_from_dimensions → اعتمده، meters_source = "manual_total".
- إذا كان written_total **أكبر بكثير** من calculated_meters_from_dimensions (مثلاً 5 أضعاف أو أكثر، أو الفرق > 50%) → **هذا مؤشر قوي أن المحاسب كتب السعر الإجمالي بالجنيه وليس الأمتار**. تجاهل written_total تماماً واستخدم calculated_meters_from_dimensions. meters_source = "calculated_from_dimensions". اذكر بوضوح في ai_notes: "الرقم المكتوب كإجمالي (X) يبدو أنه السعر بالجنيه لأنه غير منطقي مقابل المقاسات التي تعطي Y متر، لذا اعتمدت Y".
- إذا وجدت calculated_meters_from_dimensions فقط بدون written_total → استخدمه.
- إذا وجدت written_total فقط بدون مقاسات واضحة، افحص منطقيته: هل رقم ضمن نطاق الأمتار المعقول للإيصال الواحد (عادة 1–500 متر، نادراً 500–2000)؟ إذا كان > 2000 فغالباً هو سعر وليس أمتار → ai_confidence أقل من 50 وضع تحذير في ai_notes.

الخطوة 4 — مؤشرات إضافية أن الرقم سعر وليس أمتار:
- الرقم كبير جداً (> 2000) وبدون بنود تبرره.
- الرقم مكتوب بجانب علامة "ج" أو "ج.س" أو "جنيه" أو "SDG".
- وجود رقم آخر أصغر يبدو هو الأمتار الحقيقية.
- الرقم ينتهي بأصفار كثيرة (1000، 5000، 20100) وهذا أكثر شيوعاً في الأسعار.

الخطوة 5 — لا تخترع أبداً. إذا لم تستطع استنتاج الأمتار بثقة، ضع total_meters=null و ai_confidence منخفض واشرح.

== قراءة الأسماء العربية ==
1. اسم العميل عادة أعلى الإيصال أو بجانب "العميل"/"الزبون"/"السيد".
2. الأسماء السودانية الشائعة: محمد، أحمد، علي، عمر، عثمان، حسن، إبراهيم، صلاح، الطيب، الفاتح، مدثر، الصادق...
3. إذا كان الاسم غير واضح، اكتب أقرب قراءة منطقية ولا تخترع.

== مستوى الثقة (ai_confidence) ==
- 90-100: البنود واضحة، وحسابها يطابق الإجمالي المكتوب، ولا لبس.
- 70-89: البنود مقروءة والإجمالي منطقي مع بعض التحفظات.
- 50-69: اعتمدت على المقاسات لأن الإجمالي المكتوب غير منطقي أو مفقود.
- أقل من 50: عدم قدرة على التحقق من منطقية الأمتار، يحتاج مراجعة بشرية.

== التاريخ ==
- صيغ شائعة: 14/2/2025، 2025-02-14، 14-2-2025.
- إذا لم توجد سنة، افترض السنة الحالية. إذا غير موجود، ضع null.

== التحقق إذا كانت الصورة إيصال طباعة ==
- إذا كانت صورة شخصية/منظر/طعام/رسالة/شعار/إعلان → is_receipt=false وباقي الحقول null.
- إذا إيصال غير مقروء بتاتاً → is_receipt=true لكن total_meters=null مع شرح.

== تعليمات الإخراج ==
أرجع JSON فقط (لا markdown، لا شرح خارجي) بهذا الشكل بالضبط:
{
  "is_receipt": true | false,
  "customer_name": "اسم العميل أو null",
  "receipt_date": "YYYY-MM-DD أو null",
  "total_meters": رقم أو null,
  "meters_source": "manual_total" | "line_items" | "calculated_from_dimensions" | "unknown",
  "calculated_meters_from_dimensions": رقم أو null,
  "written_total_meters": رقم أو null,
  "sanity_check_passed": true | false,
  "ai_confidence": 0-100,
  "ai_notes": "اشرح بالعربية: خطوات استنتاجك، وإذا تجاهلت رقماً مكتوباً لأنه يبدو سعراً بالجنيه اذكر ذلك صراحة"
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
