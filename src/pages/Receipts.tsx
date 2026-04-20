import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReceipts } from "@/hooks/useReceipts";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function Receipts() {
  const { isAdmin } = useAuth();
  const { data: receipts = [], isLoading } = useReceipts(!isAdmin);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">الإيصالات</h1>
          <p className="text-muted-foreground mt-1">{isAdmin ? "جميع إيصالات المحاسبين" : "إيصالاتك"}</p>
        </div>
        <Button asChild><Link to="/receipts/new" className="gap-2"><Plus className="w-4 h-4" />إيصال جديد</Link></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : receipts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد إيصالات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الأمتار</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>العمولة</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.receipt_date), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{r.customer_name || "-"}</TableCell>
                    <TableCell>{Number(r.total_meters).toLocaleString()} م</TableCell>
                    <TableCell>{Number(r.total_amount).toLocaleString()} ج.س</TableCell>
                    <TableCell className="text-primary">{Number(r.commission_amount).toLocaleString()}</TableCell>
                    <TableCell>{Number(r.net_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_confirmed ? "default" : "secondary"}>
                        {r.is_confirmed ? "مؤكد" : "مسودة"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
