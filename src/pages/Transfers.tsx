import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Image,
  Eye,
  Check,
  X,
  Calendar,
  Loader2,
  AlertCircle,
  Upload,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useTransfers, 
  useConfirmTransfer, 
  useRejectTransfer, 
  useExtractTransferAmount,
  useCreateTransfer,
  Transfer,
  ExtractedTransferData,
} from "@/hooks/useTransfers";
import { useBranches } from "@/hooks/useBranches";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const statusConfig = {
  confirmed: {
    icon: CheckCircle,
    label: "مؤكد",
    className: "text-success bg-success/10",
  },
  pending: {
    icon: Clock,
    label: "قيد المراجعة",
    className: "text-warning bg-warning/10",
  },
};

export default function Transfers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [transferToReject, setTransferToReject] = useState<Transfer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedTransferData | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualSenderName, setManualSenderName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: transfers = [], isLoading, error } = useTransfers();
  const { branches } = useBranches();
  const confirmMutation = useConfirmTransfer();
  const rejectMutation = useRejectTransfer();
  const extractMutation = useExtractTransferAmount();
  const createMutation = useCreateTransfer();

  const filteredTransfers = transfers.filter((transfer) => {
    const branchName = transfer.branches?.name || "";
    const matchesSearch =
      branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const transferStatus = transfer.is_confirmed ? "confirmed" : "pending";
    const matchesStatus = statusFilter === "all" || transferStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: transfers.length,
    pending: transfers.filter((t) => !t.is_confirmed).length,
    confirmed: transfers.filter((t) => t.is_confirmed).length,
  };

  const handleConfirm = (transfer: Transfer) => {
    confirmMutation.mutate(transfer.id);
  };

  const handleReject = () => {
    if (transferToReject) {
      rejectMutation.mutate(transferToReject.id);
      setTransferToReject(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      
      // Auto-extract using AI
      try {
        const data = await extractMutation.mutateAsync({ imageBase64: base64 });
        setExtractedData(data);
        
        // Auto-fill form with extracted data
        if (data.amount) setManualAmount(data.amount.toString());
        if (data.date) setManualDate(data.date);
        if (data.sender_name) setManualSenderName(data.sender_name);
        
        toast.success(`تم استخراج البيانات بنسبة ثقة ${data.confidence}%`);
      } catch (error) {
        // Error already shown by mutation
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTransfer = async () => {
    if (!selectedBranch || !manualAmount) {
      toast.error("يرجى اختيار الفرع وإدخال المبلغ");
      return;
    }

    try {
      await createMutation.mutateAsync({
        branch_id: selectedBranch,
        amount: parseFloat(manualAmount),
        transfer_date: manualDate,
        sender_name: manualSenderName || undefined,
        image_url: uploadedImage || undefined,
      });
      
      // Reset form
      setIsAddDialogOpen(false);
      setUploadedImage(null);
      setExtractedData(null);
      setSelectedBranch("");
      setManualAmount("");
      setManualDate(new Date().toISOString().split('T')[0]);
      setManualSenderName("");
    } catch (error) {
      // Error already shown by mutation
    }
  };

  const resetAddDialog = () => {
    setUploadedImage(null);
    setExtractedData(null);
    setSelectedBranch("");
    setManualAmount("");
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualSenderName("");
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">حدث خطأ في تحميل التحويلات</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التحويلات</h1>
          <p className="text-muted-foreground mt-1">
            مراجعة وإدارة جميع التحويلات الواردة من واتساب
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة تحويل
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "الإجمالي", value: stats.total, color: "bg-muted", filter: "all" },
          { label: "قيد المراجعة", value: stats.pending, color: "bg-warning/10 text-warning", filter: "pending" },
          { label: "مؤكد", value: stats.confirmed, color: "bg-success/10 text-success", filter: "confirmed" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(stat.filter)}
            className={cn(
              "p-4 rounded-xl border border-border/50 transition-all hover:shadow-md",
              stat.color,
              statusFilter === stat.filter && "ring-2 ring-primary"
            )}
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm opacity-80">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالفرع أو اسم المرسل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted/50 border-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              اليوم
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              فلترة
            </Button>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Image className="w-12 h-12 mb-4 opacity-50" />
            <p>لا توجد تحويلات</p>
            <p className="text-sm">ستظهر التحويلات هنا عند استلامها من واتساب</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    التاريخ
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    الفرع
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    المبلغ
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    المرسل
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    الحالة
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransfers.map((transfer, index) => {
                  const transferStatus = transfer.is_confirmed ? "confirmed" : "pending";
                  const status = statusConfig[transferStatus];
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr
                      key={transfer.id}
                      className="hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              transfer.image_url ? "bg-primary/10" : "bg-muted"
                            )}
                          >
                            <Image
                              className={cn(
                                "w-4 h-4",
                                transfer.image_url
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {format(new Date(transfer.transfer_date), "dd MMM yyyy", { locale: ar })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transfer.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-foreground">{transfer.branches?.name || "غير محدد"}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-foreground">
                          {transfer.amount.toLocaleString()} ج.س
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-foreground">
                            {transfer.sender_name || "غير معروف"}
                          </p>
                          <p className="text-muted-foreground">
                            {transfer.sender_phone || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                            status.className
                          )}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="عرض"
                            onClick={() => setSelectedTransfer(transfer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!transfer.is_confirmed && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success hover:text-success hover:bg-success/10"
                                title="تأكيد"
                                onClick={() => handleConfirm(transfer)}
                                disabled={confirmMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="حذف"
                                onClick={() => setTransferToReject(transfer)}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Transfer Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل التحويل</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              {selectedTransfer.image_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img 
                    src={selectedTransfer.image_url} 
                    alt="صورة التحويل" 
                    className="w-full h-auto"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">المبلغ</p>
                  <p className="font-bold text-lg">{selectedTransfer.amount.toLocaleString()} ج.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التاريخ</p>
                  <p className="font-medium">
                    {format(new Date(selectedTransfer.transfer_date), "dd MMM yyyy", { locale: ar })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">اسم المرسل</p>
                  <p className="font-medium">{selectedTransfer.sender_name || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{selectedTransfer.sender_phone || "-"}</p>
                </div>
              </div>
              {selectedTransfer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">ملاحظات</p>
                  <p className="font-medium">{selectedTransfer.notes}</p>
                </div>
              )}
              {!selectedTransfer.is_confirmed && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleConfirm(selectedTransfer);
                      setSelectedTransfer(null);
                    }}
                  >
                    <Check className="w-4 h-4" />
                    تأكيد التحويل
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setTransferToReject(selectedTransfer);
                      setSelectedTransfer(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                    حذف
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!transferToReject} onOpenChange={() => setTransferToReject(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Transfer Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          if (!open) resetAddDialog();
          setIsAddDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              إضافة تحويل جديد
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                "hover:border-primary hover:bg-primary/5",
                uploadedImage ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              {uploadedImage ? (
                <div className="space-y-3">
                  <img 
                    src={uploadedImage} 
                    alt="صورة التحويل" 
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  {extractMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري استخراج البيانات...</span>
                    </div>
                  )}
                  {extractedData && (
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span>تم استخراج البيانات بنسبة ثقة {extractedData.confidence}%</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    اضغط لتغيير الصورة
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-foreground font-medium">اضغط لرفع صورة إشعار التحويل</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم استخراج البيانات تلقائياً باستخدام الذكاء الاصطناعي
                  </p>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الفرع *</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ (ج.س) *</Label>
                  <Input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اسم المرسل</Label>
                <Input
                  value={manualSenderName}
                  onChange={(e) => setManualSenderName(e.target.value)}
                  placeholder="اختياري"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 gap-2"
                onClick={handleCreateTransfer}
                disabled={createMutation.isPending || !selectedBranch || !manualAmount}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                إضافة التحويل
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
