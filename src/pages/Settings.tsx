import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Store, Users as UsersIcon, Lock, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useBranches";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { branches, isLoading: branchesLoading } = useBranches();
  const [branchPrices, setBranchPrices] = useState<Record<string, number>>({});
  const [savingBranchId, setSavingBranchId] = useState<string | null>(null);

  // Personal password change
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    const initial: Record<string, number> = {};
    branches.forEach((b: any) => {
      initial[b.id] = Number(b.default_price_per_meter ?? 300);
    });
    setBranchPrices(initial);
  }, [branches]);

  // Designers (admins see all profiles)
  const { data: designers = [], isLoading: designersLoading } = useQuery({
    queryKey: ["all-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, phone, commission_per_meter")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        full_name: string | null;
        phone: string | null;
        commission_per_meter: number;
      }>;
    },
  });

  const [commissions, setCommissions] = useState<Record<string, number>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    designers.forEach((d: any) => (initial[d.id] = Number(d.commission_per_meter ?? 10)));
    setCommissions(initial);
  }, [designers]);

  const saveBranchPrice = async (branchId: string) => {
    setSavingBranchId(branchId);
    const { error } = await supabase
      .from("branches")
      .update({ default_price_per_meter: branchPrices[branchId] } as any)
      .eq("id", branchId);
    setSavingBranchId(null);
    if (error) return toast.error("فشل التحديث: " + error.message);
    toast.success("تم تحديث السعر");
    qc.invalidateQueries({ queryKey: ["branches"] });
  };

  const saveCommission = async (userId: string) => {
    setSavingUserId(userId);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ commission_per_meter: commissions[userId] })
      .eq("id", userId);
    setSavingUserId(null);
    if (error) return toast.error("فشل التحديث: " + error.message);
    toast.success("تم تحديث سعر النسبة لكل متر");
    qc.invalidateQueries({ queryKey: ["all-profiles"] });
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("كلمة المرور قصيرة (٦ أحرف على الأقل)");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    toast.success("تم تغيير كلمة المرور");
    setNewPassword("");
  };

  // Reset: deletes ALL print receipts (and therefore all meters/commissions
  // history). Branches, users, profiles, and WhatsApp connections are kept.
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const handleReset = async () => {
    setResetting(true);
    try {
      // Count first so we can report exactly how many were removed.
      const { count: beforeCount } = await (supabase as any)
        .from("print_receipts")
        .select("id", { count: "exact", head: true });

      // Delete all receipts. RLS allows admins to delete any row via has_role.
      const { error, count } = await (supabase as any)
        .from("print_receipts")
        .delete({ count: "exact" })
        .not("id", "is", null);
      if (error) throw error;

      // Verify deletion actually happened (RLS may silently filter rows).
      const { count: afterCount } = await (supabase as any)
        .from("print_receipts")
        .select("id", { count: "exact", head: true });

      if ((afterCount ?? 0) > 0) {
        throw new Error(
          `تبقى ${afterCount} إيصال لم يُحذف — تأكد أن حسابك يملك صلاحية المدير`
        );
      }

      const removed = count ?? beforeCount ?? 0;
      console.log(`[reset] removed ${removed} receipts`);

      // Try to clear stored receipt images too (best-effort, non-blocking).
      try {
        const { data: files } = await supabase.storage.from("receipts").list("", {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });
        if (files && files.length) {
          // Recursively list user folders
          const allPaths: string[] = [];
          for (const f of files) {
            if (f.id === null) {
              const { data: sub } = await supabase.storage.from("receipts").list(f.name, { limit: 1000 });
              sub?.forEach((s) => allPaths.push(`${f.name}/${s.name}`));
            } else {
              allPaths.push(f.name);
            }
          }
          if (allPaths.length) await supabase.storage.from("receipts").remove(allPaths);
        }
      } catch (e) {
        console.warn("storage cleanup skipped:", e);
      }

      toast.success("تم إعادة التعيين — حُذفت كل الإيصالات");
      qc.invalidateQueries({ queryKey: ["print_receipts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats-v2"] });
      qc.invalidateQueries({ queryKey: ["top-designers"] });
      qc.invalidateQueries({ queryKey: ["recent-receipts"] });
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["my-receipts"] });
      setConfirmText("");
      qc.invalidateQueries({ queryKey: ["top-designers"] });
      qc.invalidateQueries({ queryKey: ["recent-receipts"] });
      setConfirmText("");
    } catch (e: any) {
      toast.error("فشل إعادة التعيين: " + (e?.message ?? "خطأ غير معروف"));
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "تحكم بأسعار الفروع وسعر النسبة لكل متر للمصممين" : "إدارة حسابك الشخصي"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isAdmin && (
          <>
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>سعر المتر الافتراضي لكل فرع</CardTitle>
                  <p className="text-sm text-muted-foreground">يُستخدم تلقائياً عند رفع إيصال جديد</p>
                </div>
              </CardHeader>
              <CardContent>
                {branchesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : branches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">لا توجد فروع</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفرع</TableHead>
                        <TableHead>سعر المتر (ج.س)</TableHead>
                        <TableHead className="w-32"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((b: any) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={branchPrices[b.id] ?? ""}
                              onChange={(e) =>
                                setBranchPrices({ ...branchPrices, [b.id]: Number(e.target.value) })
                              }
                              className="max-w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => saveBranchPrice(b.id)}
                              disabled={savingBranchId === b.id}
                              className="gap-2"
                            >
                              {savingBranchId === b.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              حفظ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>سعر النسبة لكل متر للمصمم</CardTitle>
                  <p className="text-sm text-muted-foreground">المبلغ الذي يحصل عليه المصمم عن كل متر مطبوع (ج.س)</p>
                </div>
              </CardHeader>
              <CardContent>
                {designersLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : designers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">لا يوجد مصممون</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>سعر النسبة لكل متر (ج.س)</TableHead>
                        <TableHead className="w-32"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {designers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.full_name || "—"}</TableCell>
                          <TableCell dir="ltr">{d.phone || "—"}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={commissions[d.id] ?? ""}
                              onChange={(e) =>
                                setCommissions({ ...commissions, [d.id]: Number(e.target.value) })
                              }
                              className="max-w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => saveCommission(d.id)}
                              disabled={savingUserId === d.id}
                              className="gap-2"
                            >
                              {savingUserId === d.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              حفظ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {isAdmin && (
          <Card className="shadow-soft border-destructive/40">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">إعادة تعيين البيانات</CardTitle>
                <p className="text-sm text-muted-foreground">
                  حذف كل الإيصالات والأمتار والنسب نهائياً. لن يتم حذف الفروع أو المستخدمين أو اتصالات الواتساب.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <AlertDialog onOpenChange={(o) => !o && setConfirmText("")}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    إعادة تعيين كل شيء
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف <strong>كل الإيصالات</strong> وكل الأمتار والنسب المسجّلة بشكل نهائي ولا يمكن التراجع.
                      <br />
                      للتأكيد اكتب: <strong>تأكيد</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="اكتب: تأكيد"
                    autoFocus
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={confirmText.trim() !== "تأكيد" || resetting}
                      onClick={(e) => {
                        e.preventDefault();
                        handleReset();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                    >
                      {resetting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      نعم، احذف كل شيء
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="٦ أحرف على الأقل"
              />
            </div>
            <Button onClick={changePassword} disabled={savingPwd} className="gap-2">
              {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
