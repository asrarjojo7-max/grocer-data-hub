import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

export default DashboardLayout;
