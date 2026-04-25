import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  User,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const items = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "/" },
  { icon: User, label: "إيصالاتي", path: "/my-receipts" },
  { icon: FileText, label: "التقارير", path: "/reports" },
  { icon: Receipt, label: "الإيصالات", path: "/receipts", admin: true },
];

export function MobileNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = items.filter((i) => !i.admin || isAdmin);
  // Cap visible items so the bar never feels crowded.
  // When everything fits (≤3 items), hide the "More" button entirely.
  // When it doesn't (4 items for admin), drop the last nav item and surface "More" instead.
  const MAX_INLINE = 3;
  const showMore = visible.length > MAX_INLINE;
  const inline = showMore ? visible.slice(0, MAX_INLINE) : visible;
  // RTL: first half renders on the right (start), rest on the left (end)
  const splitAt = Math.ceil(inline.length / 2);
  const rightItems = inline.slice(0, splitAt);
  const leftItems = inline.slice(splitAt);
  const isNewActive = location.pathname === "/receipts/new";

  const NavItem = ({ item }: { item: (typeof items)[number] }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className="flex flex-col items-center justify-center gap-1 flex-1 h-full press tap relative group"
      >
        <div
          className={cn(
            "flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-300",
            active && "bg-primary/10"
          )}
        >
          <item.icon
            className={cn(
              "w-[22px] h-[22px] transition-all duration-300",
              active
                ? "text-primary scale-110"
                : "text-muted-foreground group-hover:text-foreground"
            )}
            strokeWidth={active ? 2.4 : 2}
          />
        </div>
        <span
          className={cn(
            "text-[10px] font-bold transition-colors duration-300 leading-none",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Spacer to prevent content overlap */}
      <div className="lg:hidden h-[88px]" aria-hidden />

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        {/* Floating container with blur */}
        <div className="relative mx-auto">
          {/* Background with blur and gradient border */}
          <div className="absolute inset-0 bg-card/85 backdrop-blur-2xl border-t border-border/60 shadow-[0_-8px_32px_-8px_hsl(var(--foreground)/0.12)]" />

          <div className="relative flex items-center h-[68px] px-2">
            {/* Right side items (RTL: appears on right - start) */}
            <div className="flex flex-1 items-center">
              {rightItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>

            {/* Center floating action button */}
            <div className="flex-shrink-0 px-2">
              <Link
                to="/receipts/new"
                aria-label="إيصال جديد"
                className={cn(
                  "relative -mt-7 flex items-center justify-center w-14 h-14 rounded-full press tap transition-all duration-300",
                  "gradient-primary shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.5)]",
                  "ring-4 ring-background",
                  isNewActive && "scale-110"
                )}
              >
                {/* Glow halo */}
                <span className="absolute inset-0 rounded-full gradient-primary blur-xl opacity-40 -z-10" />
                <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.8} />
              </Link>
            </div>

            {/* Left side items (RTL: appears on left - end) */}
            <div className="flex flex-1 items-center">
              {leftItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="المزيد"
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full press tap group"
              >
                <div className="flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-300">
                  <MoreHorizontal
                    className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors"
                    strokeWidth={2}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground leading-none">
                  المزيد
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
