import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Receipt,
  FileText,
  Users,
  Settings,
  LogOut,
  MessageCircle,
  Printer,
  User,
} from "lucide-react";

const all = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", admin: false },
  { icon: User, label: "إيصالاتي", path: "/my-receipts", admin: false },
  { icon: MessageCircle, label: "ربط الواتساب", path: "/my-whatsapp", admin: false },
  { icon: Receipt, label: "كل الإيصالات", path: "/receipts", admin: true },
  { icon: Store, label: "الفروع", path: "/branches", admin: true },
  { icon: FileText, label: "التقارير", path: "/reports", admin: false },
  { icon: Users, label: "المستخدمين", path: "/users", admin: true },
  { icon: MessageCircle, label: "إعدادات واتساب", path: "/whatsapp", admin: true },
  { icon: Settings, label: "الإعدادات", path: "/settings", admin: false },
];

export function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = all.filter((i) => !i.admin || isAdmin);

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] sm:w-80 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle asChild>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Printer className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-right">
                <h1 className="font-bold text-foreground">إيصالات الطباعة</h1>
                <p className="text-xs text-muted-foreground font-normal">نظام المحاسبين</p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]",
                  active ? "gradient-primary text-primary-foreground shadow-md" : "hover:bg-muted"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className={cn("font-medium", active ? "text-primary-foreground" : "text-foreground")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
