# روابط عميقة (Deep Links) لتطبيق Android

تم إعداد التطبيق ليقبل نوعين من الروابط:

| النوع | مثال | السلوك |
|------|------|--------|
| Custom scheme | `nesbaty://receipts/123` | يفتح التطبيق مباشرة دائماً |
| App Link (HTTPS) | `https://nesbaty.lovable.app/receipts/123` | يفتح التطبيق بعد التحقق من `assetlinks.json` |

كلاهما يمر عبر جسر `src/lib/deepLinks.ts` فيتحوّل المسار إلى مسار `HashRouter` ويُوجَّه المستخدم للصفحة الصحيحة.

## الخطوات بعد `npx cap add android`

### 1) أضف intent filters
افتح:
```
android/app/src/main/AndroidManifest.xml
```
وألصق الـ `<intent-filter>`s الموجودة في `android-deep-links.template.xml` داخل بلوك `<activity android:name=".MainActivity" ...>` الموجود مسبقاً.

### 2) أضف الصلاحيات (إن لم تكن موجودة)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

### 3) فعّل App Links المتحققة (اختياري لكن مُستحسن)
حتى يفتح الرابط `https://nesbaty.lovable.app/...` التطبيقَ مباشرة دون شاشة "افتح باستخدام":

1. احصل على SHA-256 لمفتاح توقيع التطبيق:
   ```bash
   # للنسخة التي تطلقها على Play (Play App Signing):
   # من Play Console → Setup → App integrity → App signing key certificate

   # أو للنسخة المحلية / debug:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey \
     -storepass android -keypass android
   ```
2. ضع البصمة في `public/.well-known/assetlinks.json` (يستبدل `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`).
3. تأكد أن الملف يُقدَّم على:
   ```
   https://nesbaty.lovable.app/.well-known/assetlinks.json
   ```
   بنوع MIME = `application/json` ودون أي إعادة توجيه.
4. تحقق:
   ```bash
   adb shell pm verify-app-links --re-verify com.sudatech.nesbaty
   adb shell pm get-app-links com.sudatech.nesbaty
   ```

### 4) زامن وافتح Android Studio
```bash
npm run build:mobile
npx cap open android
```

## اختبار سريع

```bash
# Custom scheme
adb shell am start -W -a android.intent.action.VIEW \
  -d "nesbaty://receipts/123" com.sudatech.nesbaty

# App Link
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://nesbaty.lovable.app/receipts/123"
```

ينبغي أن يفتح التطبيق وينتقل مباشرة إلى صفحة الإيصال المطلوب.
