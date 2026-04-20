import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReceipts, useUserProfile } from "@/hooks/useReceipts";
import { Plus, Loader2, Ruler, Wallet, Receipt, MessageCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MyReceipts() {
  const { data: receipts = [], isLoading } = useReceipts(true);
  const { data: profile } = useUserProfile();
  const qc = useQueryClient();

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;
      channel = supabase
        .channel("my-receipts-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "print_receipts", filter: `user_id=eq.${userId}` },
          (payload) => {
            const r: any = payload.new;
            if (r?.source === "whatsapp") {
              toast.success("📩 وصل إيصال جديد من واتساب", {
                description: `${r.customer_name || "بدون اسم عميل"} — ${Number(r.total_meters).toLocaleString()} م — عمولتك ${Number(r.commission_amount).toLocaleString()} ج.س`,
                duration: 8000,
              });
            } else {
              toast("إيصال جديد أُضيف", { description: r.customer_name || "بدون اسم عميل" });
            }
            qc.invalidateQueries({ queryKey: ["print_receipts"] });
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const calc = (from: string) => receipts.filter((r) => r.receipt_date >= from).reduce((acc, r) => ({
      meters: acc.meters + Number(r.total_meters),
      commission: acc.commission + Number(r.commission_amount),
      count: acc.count + 1,
    }), { meters: 0, commission: 0, count: 0 });
    return { today: calc(today), week: calc(weekAgo), month: calc(monthAgo) };
  }, [receipts]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">إيصالاتي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مرحباً {profile?.full_name || ""} — سعر النسبة: <strong>{profile?.commission_percentage || 0} ج.س / متر</strong>
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto h-12 sm:h-10 rounded-xl shadow-md">
          <Link to="/receipts/new" className="gap-2"><Plus className="w-5 h-5" />إيصال جديد</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        {[
          { label: "اليوم", s: stats.today },
          { label: "7 أيام", s: stats.week },
          { label: "30 يوم", s: stats.month },
        ].map((x) => (
          <Card key={x.label} className="overflow-hidden">
            <CardHeader className="pb-1 p-3 sm:p-4"><CardTitle className="text-xs sm:text-sm text-muted-foreground">{x.label}</CardTitle></CardHeader>
            <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
              <div className="flex items-baseline gap-1"><span className="text-xl sm:text-2xl font-bold">{x.s.count}</span><span className="text-[10px] sm:text-xs text-muted-foreground">إيصال</span></div>
              <div className="flex items-baseline gap-1"><Ruler className="w-3 h-3 text-muted-foreground" /><span className="text-xs sm:text-sm font-semibold">{x.s.meters.toLocaleString()}</span><span className="text-[10px] text-muted-foreground">م</span></div>
              <div className="flex items-baseline gap-1"><Wallet className="w-3 h-3 text-primary" /><span className="text-xs sm:text-sm font-semibold text-primary">{x.s.commission.toLocaleString()}</span><span className="text-[10px] text-muted-foreground">ج.س</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></CardContent></Card>
      ) : receipts.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد إيصالات بعد</p>
          <Button asChild className="mt-4"><Link to="/receipts/new">ارفع أول إيصال</Link></Button>
        </CardContent></Card>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="lg:hidden space-y-2.5">
            {receipts.map((r) => (
              <Card key={r.id} className="overflow-hidden active:scale-[0.99] transition-transform">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.customer_name || "بدون اسم"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(r.receipt_date), "yyyy-MM-dd")}</div>
                    </div>
                    {r.source === "whatsapp" ? (
                      <Badge variant="outline" className="gap-1 border-primary/40 text-primary shrink-0">
                        <MessageCircle className="w-3 h-3" />واتساب
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 shrink-0"><Upload className="w-3 h-3" />يدوي</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Ruler className="w-3.5 h-3.5" /><span>{Number(r.total_meters)} م</span>
                    </div>
                    <div className="text-muted-foreground">×</div>
                    <div className="text-muted-foreground">{Number(r.price_per_meter).toLocaleString()} ج.س/م</div>
                    <div className="text-muted-foreground">=</div>
                    <div className="font-semibold">{Number(r.total_amount).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-primary/10 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">عمولتي</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary leading-tight">{Number(r.commission_amount).toLocaleString()} <span className="text-xs">ج.س</span></div>
                      <div className="text-[10px] text-muted-foreground">{Number(r.commission_percentage)} ج.س × {Number(r.total_meters)} م</div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Badge variant={r.is_confirmed ? "default" : "secondary"} className="text-[10px]">{r.is_confirmed ? "مؤكد" : "مسودة"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>الأمتار</TableHead>
                    <TableHead>سعر المتر</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>سعر النسبة/متر</TableHead>
                    <TableHead>عمولتي</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.receipt_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell>{r.customer_name || "-"}</TableCell>
                      <TableCell>{Number(r.total_meters)} م</TableCell>
                      <TableCell>{Number(r.price_per_meter).toLocaleString()}</TableCell>
                      <TableCell>{Number(r.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{Number(r.commission_percentage).toLocaleString()} ج.س</TableCell>
                      <TableCell className="text-primary font-semibold">{Number(r.commission_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        {r.source === "whatsapp" ? (
                          <Badge variant="outline" className="gap-1 border-primary/40 text-primary"><MessageCircle className="w-3 h-3" />واتساب</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1"><Upload className="w-3 h-3" />يدوي</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={r.is_confirmed ? "default" : "secondary"}>{r.is_confirmed ? "مؤكد" : "مسودة"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
