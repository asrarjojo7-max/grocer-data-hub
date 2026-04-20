import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Phone,
  Shield,
  ShieldCheck,
  Loader2,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  commission_per_meter: number;
  created_at: string;
};

type Role = "admin" | "accountant";

export default function Users() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles-users"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, phone, commission_per_meter, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as Array<{ user_id: string; role: Role }>;
    },
  });

  const rolesByUser = new Map<string, Role[]>();
  roles.forEach((r) => {
    const arr = rolesByUser.get(r.user_id) || [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const filtered = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone || "").includes(searchQuery)
  );

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) return toast.error("فشل: " + error.message);
      toast.success("تم إزالة صلاحية المدير");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error("فشل: " + error.message);
      toast.success("تم منح صلاحية المدير");
    }
    qc.invalidateQueries({ queryKey: ["all-user-roles"] });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">إدارة المصممين</h1>
        <p className="text-muted-foreground mt-1">عرض وإدارة الحسابات والصلاحيات</p>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted/50 border-0"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا يوجد مستخدمون مسجلون بعد
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((profile, index) => {
            const userRoles = rolesByUser.get(profile.id) || [];
            const isAdmin = userRoles.includes("admin");
            return (
              <Card
                key={profile.id}
                className="shadow-soft hover:shadow-lg transition-all animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isAdmin ? "gradient-primary" : "bg-muted"
                      )}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {profile.full_name || "بدون اسم"}
                      </CardTitle>
                      <Badge variant={isAdmin ? "default" : "secondary"} className="mt-1">
                        {isAdmin ? "مدير" : "مصمم"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{profile.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="w-4 h-4" />
                    <span>سعر النسبة: {profile.commission_per_meter} ج.س / متر</span>
                  </div>
                  <Button
                    variant={isAdmin ? "destructive" : "outline"}
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => toggleAdmin(profile.id, isAdmin)}
                  >
                    <Shield className="w-3 h-3" />
                    {isAdmin ? "إزالة صلاحية المدير" : "منح صلاحية المدير"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
