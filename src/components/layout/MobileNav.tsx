import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  User,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const items = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "/" },
  { icon: User, label: "إيصالاتي", path: "/my-receipts" },
  { icon: Receipt, label: "الإيصالات", path: "/receipts", admin: true },
  { icon: FileText, label: "التقارير", path: "/reports" },
];

export function MobileNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = items.filter((i) => !i.admin || isAdmin);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_-4px_hsl(var(--foreground)/0.1)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-[64px]">
          {visible.slice(0, 4).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 relative press tap"
              >
                {active && (
                  <span className="absolute top-0 h-1 w-12 rounded-b-full gradient-primary" />
                )}
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-all",
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 press tap"
          >
            <Menu className="w-6 h-6 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">المزيد</span>
          </button>
        </div>
      </nav>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
