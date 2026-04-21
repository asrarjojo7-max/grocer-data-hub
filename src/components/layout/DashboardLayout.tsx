import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { Footer } from "./Footer";
import { useReceiptRealtimeToast } from "@/hooks/useReceiptRealtimeToast";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useReceiptRealtimeToast();
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <MobileHeader />

      <div className="lg:mr-64 transition-all duration-300">
        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        <main className="p-4 lg:p-6 pb-28 lg:pb-6">{children}</main>
        {/* Footer credits — desktop. On mobile, credits live in the side menu. */}
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

export default DashboardLayout;
