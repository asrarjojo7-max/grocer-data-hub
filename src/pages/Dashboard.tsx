import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TopDesignersChart } from "@/components/dashboard/TopDesignersChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Store,
  Receipt,
  Calendar,
  Loader2,
  Ruler,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { useDashboardStats, useRecentReceipts } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DesignerDashboard } from "./DesignerDashboard";

export default function Dashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: recent = [] } = useRecentReceipts(6);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Designers get their own simplified dashboard
  if (!isAdmin) return <DesignerDashboard />;

  const today = format(new Date(), "EEEE، d MMMM yyyy", { locale: ar });

  return (
    <DashboardLayout>
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">ملخص أداء المطبعة اليوم وهذا الشهر</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="أمتار اليوم"
              value={`${(stats?.totalMetersToday || 0).toLocaleString()} م`}
              change={`${stats?.receiptsToday || 0} إيصال`}
              changeType="positive"
              icon={Ruler}
              iconColor="primary"
            />
            <StatCard
              title="إيرادات اليوم"
              value={`${(stats?.totalAmountToday || 0).toLocaleString()} ج.س`}
              change={`${(stats?.totalNetToday || 0).toLocaleString()} صافي`}
              changeType="positive"
              icon={Banknote}
              iconColor="secondary"
            />
            <StatCard
              title="عمولات اليوم"
              value={`${(stats?.totalCommissionToday || 0).toLocaleString()} ج.س`}
              change="مستحقة للمصممين"
              changeType="neutral"
              icon={Wallet}
              iconColor="accent"
            />
            <StatCard
              title="فروع نشطة"
              value={String(stats?.activeBranches || 0)}
              change={`من أصل ${stats?.totalBranches || 0}`}
              changeType="neutral"
              icon={Store}
              iconColor="warning"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  أمتار الشهر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(stats?.totalMetersMonth || 0).toLocaleString()} م</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الشهر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(stats?.totalAmountMonth || 0).toLocaleString()} ج.س</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> صافي الشهر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  {(stats?.totalNetMonth || 0).toLocaleString()} ج.س
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
            <div className="lg:col-span-2">
              <TopDesignersChart />
            </div>
            <div className="space-y-6">
              <QuickActions />
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="w-4 h-4" /> أحدث الإيصالات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recent.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">لا يوجد بعد</p>
                  )}
                  {recent.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{r.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.meters} م • {r.amount.toLocaleString()} ج.س
                        </p>
                      </div>
                      <Badge variant={r.isConfirmed ? "default" : "secondary"} className="shrink-0">
                        {r.isConfirmed ? "مؤكد" : "معلّق"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
