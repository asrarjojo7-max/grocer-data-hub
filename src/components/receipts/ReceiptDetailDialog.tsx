import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUpdateReceipt, type PrintReceipt } from "@/hooks/useReceipts";
import { Loader2, ImageOff, ExternalLink, Save } from "lucide-react";

interface Props {
  receipt: PrintReceipt | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: Props) {
  const update = useUpdateReceipt();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (receipt) {
      setName(receipt.customer_name || "");
      setDate(receipt.receipt_date?.slice(0, 10) || "");
      setImgError(false);
    }
  }, [receipt]);

  if (!receipt) return null;

  const dirty = name !== (receipt.customer_name || "") || date !== receipt.receipt_date?.slice(0, 10);

  const save = async () => {
    await update.mutateAsync({
      id: receipt.id,
      data: { customer_name: name.trim() || null, receipt_date: date },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل الإيصال</DialogTitle>
        </DialogHeader>

        {/* Original receipt image */}
        <div className="rounded-xl overflow-hidden bg-muted relative">
          {receipt.image_url && !imgError ? (
            <>
              <img
                src={receipt.image_url}
                alt="الإيصال الأصلي"
                className="w-full h-auto max-h-[50vh] object-contain bg-background"
                onError={() => setImgError(true)}
              />
              <a
                href={receipt.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 left-2 bg-background/90 backdrop-blur rounded-lg px-2 py-1 text-xs flex items-center gap-1 shadow-sm hover:bg-background"
              >
                <ExternalLink className="w-3 h-3" /> فتح كاملاً
              </a>
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
              <ImageOff className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">لا توجد صورة للإيصال</p>
            </div>
          )}
        </div>

        {/* Editable fields */}
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="cust" className="text-right block mb-1.5">اسم العميل</Label>
            <Input
              id="cust"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم العميل"
              className="text-right"
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="dt" className="text-right block mb-1.5">تاريخ الإيصال</Label>
            <Input
              id="dt"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Read-only summary */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Stat label="الأمتار" value={`${Number(receipt.total_meters)} م`} />
            <Stat label="سعر المتر" value={`${Number(receipt.price_per_meter).toLocaleString()} ج.س`} />
            <Stat label="إجمالي الفاتورة" value={`${Number(receipt.total_amount).toLocaleString()} ج.س`} />
            <Stat label="عمولتي" value={`${Number(receipt.commission_amount).toLocaleString()} ج.س`} highlight />
          </div>

          {receipt.ai_notes && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">
                  ثقة AI: {receipt.ai_confidence ?? "-"}%
                </Badge>
              </div>
              {receipt.ai_notes}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button onClick={save} disabled={!dirty || update.isPending} className="gap-2">
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? "bg-primary/10" : "bg-muted/30"}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
