import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import logo from "@/assets/logo.png";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 h-16 bg-card/95 backdrop-blur-xl border-b border-border shadow-soft">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setOpen(true)}
            className="tap rounded-xl flex items-center justify-center hover:bg-muted press"
            aria-label="القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <img src={logo} alt="نسبتي" className="w-9 h-9 rounded-xl shadow-soft" />
            <span className="font-extrabold text-base">نسبتي</span>
          </div>

          <button
            className="tap rounded-xl flex items-center justify-center hover:bg-muted press relative"
            aria-label="الإشعارات"
          >
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </header>
      <MobileMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
