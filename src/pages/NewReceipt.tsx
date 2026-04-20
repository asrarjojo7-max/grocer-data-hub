import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBranches } from "@/hooks/useBranches";
import { useExtractReceipt, useCreateReceipt } from "@/hooks/useReceipts";
import { Upload, Loader2, Sparkles, Info, X, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function NewReceipt() {
  const navigate = useNavigate();
  const { branches = [] } = useBranches();
  const extract = useExtractReceipt();
  const create = useCreateReceipt();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState<string>("");
  const [totalMeters, setTotalMeters] = useState<number>(0);
  const [pricePerMeter, setPricePerMeter] = useState<number>(300);
  const [notes, setNotes] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const totals = useMemo(() => {
    const meters = Number(totalMeters) || 0;
    const rate = Number(pricePerMeter) || 0;
    const total = meters * rate;
    const commission = meters * rate;
    return { total, commission, net: total - commission, rate };
  }, [totalMeters, pricePerMeter]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("الرجاء اختيار صورة");
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return toast.error("ارفع صورة أولاً");
    const result = await extract.mutateAsync(imagePreview);
    if (result.customer_name) setCustomerName(result.customer_name);
    if (result.receipt_date) setReceiptDate(result.receipt_date);
    if (result.total_meters != null) setTotalMeters(Number(result.total_meters));
    setAiNotes(result.ai_notes || "");
    setAiConfidence(result.ai_confidence ?? null);
    toast.success("تم التحليل، راجع البيانات قبل الحفظ");
  };

  const handleSave = async (confirm = false) => {
    if (!totalMeters || totalMeters <= 0) return toast.error("أدخل عدد الأمتار");
    await create.mutateAsync({
      branch_id: branchId || null,
      customer_name: customerName || null,
      receipt_date: receiptDate,
      total_meters: Number(totalMeters),
      price_per_meter: Number(pricePerMeter),
      total_amount: totals.total,
      commission_percentage: totals.rate,
      commission_amount: totals.commission,
      net_amount: totals.net,
      ai_notes: aiNotes || null,
      ai_confidence: aiConfidence,
      notes: notes || null,
      is_confirmed: confirm,
      confirmed_at: confirm ? new Date().toISOString() : null,
      image_file: imageFile,
    } as any);
    navigate("/my-receipts");
  };

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-bold">إيصال جديد</h1>
        <p className="text-sm text-muted-foreground mt-1">ارفع صورة الإيصال وسيستخرج الذكاء الاصطناعي البيانات</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader><CardTitle>صورة الإيصال</CardTitle></CardHeader>
          <CardContent>
            {!imagePreview ? (
              <label className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:bg-muted transition-colors block">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">اضغط لرفع صورة الإيصال</p>
                <p className="text-sm text-muted-foreground mt-1">أو التقط صورة بالكاميرا</p>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="receipt" className="w-full rounded-lg border" />
                <Button size="icon" variant="destructive" className="absolute top-2 left-2" onClick={() => { setImagePreview(""); setImageFile(null); }}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="lg" className="w-full mt-3 gap-2 h-12 rounded-xl" onClick={handleAnalyze} disabled={extract.isPending}>
                  {extract.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  تحليل بالذكاء الاصطناعي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>بيانات الإيصال</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {aiNotes && (
              <Alert className="bg-warning/10 border-warning">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>ملاحظة الذكاء الاصطناعي {aiConfidence != null && `(${aiConfidence}%)`}:</strong> {aiNotes}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم العميل</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الفرع</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>عدد الأمتار</Label>
                <Input type="number" step="0.01" value={totalMeters} onChange={(e) => setTotalMeters(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>سعر المتر</Label>
                <Input type="number" value={pricePerMeter} onChange={(e) => setPricePerMeter(Number(e.target.value))} />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium opacity-90">ناتج الحساب لهذا الإيصال</div>
                    <div className="text-xs opacity-75">{Number(totalMeters).toLocaleString()} م × {Number(pricePerMeter).toLocaleString()} ج.س/م</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold tracking-tight">{totals.commission.toLocaleString()}</div>
                  <div className="text-sm font-semibold opacity-90">ج.س</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="lg" className="flex-1 h-12 rounded-xl" onClick={() => handleSave(false)} disabled={create.isPending}>حفظ كمسودة</Button>
              <Button size="lg" className="flex-1 h-12 rounded-xl shadow-md" onClick={() => handleSave(true)} disabled={create.isPending}>
                {create.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ وتأكيد"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
