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

# 3. ابنِ نسخة الويب
npm run build

# 4. أضف منصة Android (مرة واحدة فقط)
npx cap add android

# 5. زامن الكود مع المشروع الأصلي للأندرويد
npx cap sync android

# 6. افتح Android Studio
npx cap open android
```

داخل Android Studio:
- اضغط **Run ▶** لتشغيل التطبيق على هاتف/محاكي.
- لإنشاء APK للنشر: **Build → Generate Signed Bundle / APK**.

## بعد كل تعديل في الكود

```bash
npm run build
npx cap sync android
```

## الوضع المباشر (Live Reload أثناء التطوير)

ملف `capacitor.config.ts` يحتوي على `server.url` يشير إلى نسخة Lovable Preview، لذا التطبيق يحدّث نفسه فور أي تعديل تعمله في Lovable دون الحاجة لإعادة بناء كاملة.

**قبل النشر النهائي**، احذف أو علّق على هذا الجزء حتى يستخدم التطبيق الملفات المحلية:

```ts
// server: {
//   url: "...",
//   cleartext: true,
// },
```

## الصلاحيات المطلوبة في Android

أضف هذه السطور في `android/app/src/main/AndroidManifest.xml` بعد توليد المشروع:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
  android:maxSdkVersion="32" />
```

## التحديث للحزم Capacitor

```bash
npx cap update android
```

---
تطوير: مجاهد آدم — suda-technologies.com
