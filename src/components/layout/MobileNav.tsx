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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {visible.slice(0, 4).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
              >
                {active && (
                  <span className="absolute top-0 h-1 w-10 rounded-b-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
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
            className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">المزيد</span>
          </button>
        </div>
      </nav>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
