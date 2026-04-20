import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReceipts, useUserProfile } from "@/hooks/useReceipts";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  Plus,
  Wallet,
  Ruler,
  Receipt,
  TrendingUp,
  ArrowLeft,
  MessageCircle,
  Upload,
  Sparkles,
} from "lucide-react";

export function DesignerDashboard() {
  const { data: profile } = useUserProfile();
  const { data: receipts = [] } = useReceipts(true);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    // Use created_at so newly added receipts always appear in current month
    // stats even if the receipt_date written on the paper is older.
    const calc = (from: string) =>
      receipts
        .filter((r) => (r.created_at || r.receipt_date).slice(0, 10) >= from)
        .reduce(
          (a, r) => ({
            count: a.count + 1,
            meters: a.meters + Number(r.total_meters),
            commission: a.commission + Number(r.commission_amount),
          }),
          { count: 0, meters: 0, commission: 0 }
        );
    return { today: calc(today), month: calc(monthStart) };
  }, [receipts]);

  const recent = receipts.slice(0, 5);
  const firstName = (profile?.full_name || "").split(" ")[0] || "بك";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 18) return "مساء الخير";
    return "مساء النور";
  })();

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-5 animate-fade-in">
        <p className="text-sm text-muted-foreground">{greeting}،</p>
        <h1 className="text-2xl lg:text-3xl font-bold mt-0.5">{firstName} 👋</h1>
      </div>

      {/* Hero commission card */}
      <Card className="mb-4 overflow-hidden border-0 shadow-xl animate-slide-up">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                <Wallet className="w-4 h-4" />
                <span>إجمالي عمولتي هذا الشهر</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">
                  {stats.month.commission.toLocaleString()}
                </span>
                <span className="text-xl font-semibold opacity-90">ج.س</span>
              </div>
              <div className="flex items-center gap-3 mt-4 text-sm opacity-90">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>{stats.month.count} إيصال</span>
                </div>
                <span className="opacity-50">•</span>
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4" />
                  <span>{stats.month.meters.toLocaleString()} متر</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex items-center justify-between">
                <div className="text-xs opacity-80">سعر النسبة لكل متر</div>
                <div className="text-base font-bold">
                  {profile?.commission_per_meter || 0} ج.س
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-3 text-center">
            <Receipt className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-xl font-bold tabular-nums">{stats.today.count}</div>
            <div className="text-[10px] text-muted-foreground">إيصال اليوم</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-3 text-center">
            <Ruler className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-xl font-bold tabular-nums">{stats.today.meters.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">متر اليوم</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft bg-primary/5">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-xl font-bold tabular-nums text-primary">
              {stats.today.commission.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">ج.س اليوم</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Button
          asChild
          size="lg"
          className="h-14 rounded-2xl shadow-md gap-2 text-base"
        >
          <Link to="/receipts/new">
            <Plus className="w-5 h-5" />
            إيصال جديد
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-14 rounded-2xl gap-2 text-base"
        >
          <Link to="/my-receipts">
            <Receipt className="w-5 h-5" />
            كل إيصالاتي
          </Link>
        </Button>
      </div>

      {/* Recent receipts */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          آخر الإيصالات
        </h2>
        <Link
          to="/my-receipts"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">لا توجد إيصالات بعد</p>
            <Button asChild size="sm">
              <Link to="/receipts/new">ارفع أول إيصال</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((r) => (
            <Card key={r.id} className="border-0 shadow-soft active:scale-[0.99] transition-transform">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {r.source === "whatsapp" ? (
                    <MessageCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <Upload className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {r.customer_name || "بدون اسم"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{Number(r.total_meters)} م</span>
                    <span className="opacity-50">•</span>
                    <span>{format(new Date(r.receipt_date), "d/M")}</span>
                    {!r.is_confirmed && (
                      <>
                        <span className="opacity-50">•</span>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                          مسودة
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-primary text-sm tabular-nums">
                    +{Number(r.commission_amount).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ج.س</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
