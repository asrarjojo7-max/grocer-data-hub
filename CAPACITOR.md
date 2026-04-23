# تشغيل التطبيق كتطبيق Android بواسطة Capacitor

هذا المشروع جاهز للتحويل إلى تطبيق Android باستخدام **Capacitor** و **Android Studio**.

## المتطلبات

- Node.js 20+
- Android Studio (أحدث إصدار)
- Java JDK 17

## الخطوات (أول مرة)

```bash
# 1. حمّل الكود من GitHub (Lovable → Export to GitHub)
git clone <your-repo-url>
cd <project-folder>

# 2. ثبّت الحزم
npm install

# 3. أضف منصة Android (مرة واحدة فقط)
npx cap add android

# 4. ابنِ الويب وزامن مع android بأمر واحد
npm run build:mobile

# 5. افتح Android Studio
npx cap open android
```

داخل Android Studio:
- اضغط **Run ▶** لتشغيل التطبيق على هاتف/محاكي.
- لإنشاء APK للنشر: **Build → Generate Signed Bundle / APK**.

## بعد كل تعديل في الكود

```bash
npm run build:mobile
```

هذا الأمر يبني الويب (`vite build`) ثم يزامن الملفات مع مشروع Android تلقائياً.

## الوضع المباشر (Live Reload أثناء التطوير)

ملف `capacitor.config.ts` يحتوي على قسم `server` معلّق. لتفعيله:

1. افتح `capacitor.config.ts` وأزل التعليق عن قسم `server`:
   ```ts
   server: {
     url: "https://id-preview--73b09833-bb90-4c31-815b-aa57457e1c13.lovable.app",
     cleartext: true,
   },
   ```
2. شغّل: `npx cap sync android`
3. الآن التطبيق سيحدّث نفسه فور أي تعديل تعمله في Lovable دون الحاجة لإعادة بناء.

**قبل النشر النهائي**، رجّع التعليق على هذا القسم وشغّل `npm run build:mobile` حتى يستخدم التطبيق الملفات المحلية ويعمل offline.

## الصلاحيات المطلوبة في Android

أضف هذه السطور في `android/app/src/main/AndroidManifest.xml` بعد توليد المشروع:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
  android:maxSdkVersion="32" />
```

## ملاحظات تقنية مهمة

- **التطبيق يعمل client-side بالكامل**: يتصل بـ Supabase مباشرة من WebView، لذا لا يحتاج لأي سيرفر Node.js محلي على الهاتف.
- **Edge Functions** (مثل `extract-print-receipt`) تعمل على Supabase Cloud وتُستدعى عبر HTTPS — تعمل تلقائياً داخل APK.
- **حجم APK المتوقع**: ~8-12 MB.
- **الحد الأدنى لإصدار Android**: Android 5.1 (API 22) أو أحدث.

## التحديث لحزم Capacitor

```bash
npx cap update android
```

---
تطوير: مجاهد آدم — suda-technologies.com
