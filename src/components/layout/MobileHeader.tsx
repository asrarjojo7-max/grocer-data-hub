import { useState } from "react";
import { Bell, Menu, Printer } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Printer className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">إيصالات الطباعة</span>
          </div>

          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted active:scale-95 transition-all relative"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>
      <MobileMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
