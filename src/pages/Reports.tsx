import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Printer,
  Receipt,
  Banknote,
  Ruler,
  Wallet,
  Inbox,
} from "lucide-react";
import { useReceipts } from "@/hooks/useReceipts";

type Period = "today" | "week" | "month" | "all";

const periodLabel: Record<Period, string> = {
  today: "اليوم",
  week: "آخر 7 أيام",
  month: "هذا الشهر",
  all: "كل الفترات",
};

function startOf(period: Period): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>("month");
  const { data: receipts = [], isLoading } = useReceipts(true);

  const filtered = useMemo(() => {
    const from = startOf(period);
    return receipts.filter((r) => {
      if (!from) return true;
      const d = new Date(r.receipt_date || r.created_at);
      return d >= from;
    });
  }, [receipts, period]);

  const stats = useMemo(() => {
    let meters = 0;
    let total = 0;
    let commission = 0;
    for (const r of filtered) {
      meters += Number(r.total_meters) || 0;
      total += Number(r.total_amount) || 0;
      commission += Number(r.commission_amount) || 0;
    }
    return {
      count: filtered.length,
      meters,
      total,
      commission,
    };
  }, [filtered]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 no-print">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">التقارير</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تقرير إيصالاتك وعمولتك حسب الفترة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40 h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">آخر 7 أيام</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="all">كل الفترات</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl mb-4">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-80">تقرير</div>
                  <div className="text-lg font-bold">{periodLabel[period]}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-xs opacity-80 mb-1">إجمالي المبلغ</div>
                  <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                  <div className="text-[10px] opacity-75">ج.س</div>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-xs opacity-80 mb-1">عمولتك</div>
                  <div className="text-2xl font-bold">{stats.commission.toLocaleString()}</div>
                  <div className="text-[10px] opacity-75">ج.س</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Receipt className="w-3.5 h-3.5" />
              عدد الإيصالات
            </div>
            <div className="text-2xl font-bold">{stats.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Ruler className="w-3.5 h-3.5" />
              إجمالي الأمتار
            </div>
            <div className="text-2xl font-bold">{stats.meters.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="font-bold">تفاصيل الإيصالات</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} إيصال — {periodLabel[period]}</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Inbox className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="font-medium mb-1">لا توجد بيانات بعد</div>
              <p className="text-xs text-muted-foreground">أضف إيصالاً جديداً ليظهر تقريرك هنا</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.customer_name || "بدون اسم"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.receipt_date} · {Number(r.total_meters).toLocaleString()} م × {Number(r.price_per_meter).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                      <Wallet className="w-3.5 h-3.5" />
                      {Number(r.commission_amount).toLocaleString()} <span className="text-[10px] font-normal">ج.س</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">من {Number(r.total_amount).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
