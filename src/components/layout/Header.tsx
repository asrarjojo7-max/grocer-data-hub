import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            className="pr-10 bg-muted/50 border-0 focus-visible:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User */}
          <div className="flex items-center gap-3 pr-3 border-r border-border">
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">أحمد محمد</p>
              <p className="text-xs text-muted-foreground">مدير النظام</p>
            </div>
            <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-secondary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
