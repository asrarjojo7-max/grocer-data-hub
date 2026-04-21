import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  Store,
  Receipt,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  MessageCircle,
  User,
} from "lucide-react";

const allMenuItems = [
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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = allMenuItems.filter((i) => !i.admin || isAdmin);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
        "bg-card border-l border-border shadow-soft",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="نسبتي" className="w-10 h-10 rounded-xl shadow-soft" />
            <div>
              <h1 className="font-extrabold text-foreground">نسبتي</h1>
              <p className="text-xs text-muted-foreground">حساب العمولات</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-muted transition-colors press">
          <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-muted group press",
                isActive && "gradient-primary text-primary-foreground shadow-md"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <span className={cn("font-medium", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-2">
        <button
          onClick={handleLogout}
          className={cn("flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors press")}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">تسجيل الخروج</span>}
        </button>
        {!collapsed && (
          <div className="text-center text-[10px] text-muted-foreground/70 leading-tight pt-1">
            <p>تطوير <span className="text-primary font-semibold">مجاهد آدم</span></p>
            <p>suda-technologeis.com · © 2026</p>
          </div>
        )}
      </div>
    </aside>
  );
}
