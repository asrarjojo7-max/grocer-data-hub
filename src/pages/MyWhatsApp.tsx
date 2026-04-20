import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  Phone,
  Key,
  Users,
  ExternalLink,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  useMyWhatsAppLink,
  useTestGreenApi,
  useGreenApiChats,
  useSetupGreenApiWebhook,
  useSaveWhatsAppLink,
  useDeleteWhatsAppLink,
  useDiagnoseGreenApi,
} from "@/hooks/useDesignerWhatsApp";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function MyWhatsApp() {
  const { data: link, isLoading } = useMyWhatsAppLink();
  const test = useTestGreenApi();
  const chats = useGreenApiChats();
  const setupWebhook = useSetupGreenApiWebhook();
  const save = useSaveWhatsAppLink();
  const remove = useDeleteWhatsAppLink();
  const diagnose = useDiagnoseGreenApi();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [reconfigure, setReconfigure] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ===== CONNECTED STATE =====
  if (link && !reconfigure) {
    return (
      <DashboardLayout>
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold">ربط الواتساب</h1>
          <p className="text-sm text-muted-foreground mt-1">حسابك متصل ويراقب المجموعة المختارة</p>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl mb-4">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xs opacity-80">الحالة</div>
                    <div className="text-xl font-bold">متصل ويعمل</div>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 opacity-90">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{link.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-90">
                    <Users className="w-4 h-4" />
                    <span className="truncate">{link.monitored_chat_name || "أي محادثة واردة"}</span>
                  </div>
                  {link.last_sync_at && (
                    <div className="flex items-center gap-2 opacity-75 text-xs">
                      <RefreshCw className="w-3 h-3" />
                      <span>آخر مزامنة {formatDistanceToNow(new Date(link.last_sync_at), { addSuffix: true, locale: ar })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-4 bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            أرسل صور إيصالاتك في المجموعة <strong>{link.monitored_chat_name}</strong> وستظهر تلقائياً في حسابك مع حساب نسبتك.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-xl gap-2"
            onClick={() => {
              setReconfigure(true);
              setPhone(link.phone_number);
              setInstanceId(link.green_api_instance_id);
              setToken(link.green_api_token);
              setStep(1);
            }}
          >
            تعديل الإعدادات
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (confirm("هل تريد فصل الحساب؟")) remove.mutate(link.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
            فصل
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ===== SETUP WIZARD =====
  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-bold">ربط الواتساب</h1>
        <p className="text-sm text-muted-foreground mt-1">اربط حسابك ليستلم النظام إيصالاتك من واتساب</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= n
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </div>
            {n < 3 && (
              <div
                className={`w-8 h-0.5 transition-all ${
                  step > n ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: Phone */}
      {step === 1 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold">رقم واتساب</div>
                <div className="text-xs text-muted-foreground">الرقم المرتبط بحسابك في Green API</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف (مع رمز الدولة)</Label>
              <Input
                type="tel"
                placeholder="+249911234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 text-base"
                dir="ltr"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-12 rounded-xl gap-2"
              disabled={!phone.trim()}
              onClick={() => setStep(2)}
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Green API credentials */}
      {step === 2 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold">بيانات Green API</div>
                <div className="text-xs text-muted-foreground">من لوحة تحكم green-api.com</div>
              </div>
            </div>

            <Alert className="bg-muted/50 border-0">
              <AlertDescription className="text-xs space-y-2">
                <div className="font-medium text-foreground">خطوات سريعة:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                  <li>سجل في <a href="https://green-api.com" target="_blank" rel="noopener" className="text-primary underline inline-flex items-center gap-0.5">green-api.com <ExternalLink className="w-3 h-3" /></a></li>
                  <li>أنشئ Instance جديد وامسح QR Code بهاتفك</li>
                  <li>انسخ Instance ID و API Token</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Instance ID</Label>
              <Input
                placeholder="1101234567"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                className="h-12 text-base"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                placeholder="abc123..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 text-base"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={() => setStep(1)}>
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-xl gap-2"
                disabled={!instanceId.trim() || !token.trim() || test.isPending || chats.isPending || setupWebhook.isPending}
                onClick={async () => {
                  const id = instanceId.trim();
                  const tk = token.trim();
                  try {
                    await test.mutateAsync({ instanceId: id, apiToken: tk });
                  } catch {
                    return;
                  }
                  // Setup webhook (continue even if it fails — user can retry)
                  try {
                    await setupWebhook.mutateAsync({ instanceId: id, apiToken: tk });
                  } catch { /* toast shown */ }
                  try {
                    const list = await chats.mutateAsync({ instanceId: id, apiToken: tk });
                    setGroups(list);
                  } catch {
                    setGroups([]);
                  }
                  setStep(3);
                }}
              >
                {test.isPending || chats.isPending || setupWebhook.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    اختبار وتالي
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Pick group */}
      {step === 3 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold">اختر المجموعة</div>
                <div className="text-xs text-muted-foreground">سيراقب النظام هذه المجموعة فقط</div>
              </div>
            </div>

            {groups.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  لا توجد مجموعات. أنشئ مجموعة واتساب وأضف رقمك إليها ثم اضغط تحديث.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
                {groups.map((g) => {
                  const active = selectedChat?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedChat(g)}
                      className={`w-full text-right p-3.5 rounded-xl border-2 transition-all active:scale-[0.99] ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            active ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{g.name}</div>
                          <div className="text-xs text-muted-foreground">مجموعة واتساب</div>
                        </div>
                        {active && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              disabled={chats.isPending}
              onClick={async () => {
                const list = await chats.mutateAsync({ instanceId, apiToken: token });
                setGroups(list);
              }}
            >
              {chats.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              تحديث القائمة
            </Button>

            <div className="pt-2">
              <Badge variant="outline" className="mb-3">
                <Sparkles className="w-3 h-3 ml-1" />
                نصيحة: اختر مجموعة مخصصة لإيصالاتك فقط
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={() => setStep(2)}>
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-xl gap-2"
                disabled={save.isPending}
                onClick={async () => {
                  try {
                    await save.mutateAsync({
                      phone_number: phone.trim(),
                      green_api_instance_id: instanceId.trim(),
                      green_api_token: token.trim(),
                      monitored_chat_id: selectedChat?.id || null,
                      monitored_chat_name: selectedChat?.name || null,
                    });
                    setReconfigure(false);
                  } catch { /* toast shown */ }
                }}
              >
                {save.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {selectedChat ? "حفظ وتفعيل" : "حفظ بدون تخصيص مجموعة"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
