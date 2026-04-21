import logo from "@/assets/logo.png";

/**
 * Mobile-app style splash screen shown during initial auth/data load.
 * Features the نسبتي logo with a soft glow + developer credits.
 */
export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background"
      dir="rtl"
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-primary/30 blur-2xl animate-pulse" />
          <img
            src={logo}
            alt="نسبتي"
            className="relative w-32 h-32 rounded-3xl shadow-elegant animate-in zoom-in-50 duration-700"
          />
        </div>
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">نسبتي</h1>
          <p className="mt-1 text-sm text-muted-foreground">حساب عمولات المصممين</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <div className="pb-6 text-center text-[11px] text-muted-foreground/80 px-6">
        <p>
          تطوير{" "}
          <span className="font-semibold text-primary">مجاهد آدم</span> —{" "}
          <span className="font-medium">suda-technologeis.com</span>
        </p>
        <p className="mt-0.5">© 2026 جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
