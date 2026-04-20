import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle,
  Phone,
  Store,
  Trash2,
  Link,
  Unlink,
  Loader2,
  Copy,
  ExternalLink,
  Key,
  Info,
  Zap,
  Upload,
  QrCode,
  Smartphone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useBranches } from "@/hooks/useBranches";
import { useWhatsAppConnections, WhatsAppConnection } from "@/hooks/useWhatsAppConnections";
import { useGreenApiConnection } from "@/hooks/useGreenApiConnection";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { QuickUpload } from "@/components/QuickUpload";

const SUPABASE_PROJECT_ID = "hevnhrsrcszqzoyjkugn";

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<"meta" | "green_api">("green_api");
  
  // Meta API fields
  const [selectedBranch, setSelectedBranch] = useState("");
  const [customBranchName, setCustomBranchName] = useState("");
  const [useCustomBranch, setUseCustomBranch] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  // Green API fields
  const [greenInstanceId, setGreenInstanceId] = useState("");
  const [greenApiToken, setGreenApiToken] = useState("");
  const [greenStep, setGreenStep] = useState<1 | 2 | 3>(1);

  const { branches, isLoading: branchesLoading, addBranch } = useBranches();
  const { 
    connections, 
    isLoading: connectionsLoading,
    addConnection,
    updateConnectionStatus,
    deleteConnection,
    verifyConnection,
    testConnection,
  } = useWhatsAppConnections();

  const {
    addGreenApiConnection,
    testGreenApiConnection,
    setupGreenApiWebhook,
  } = useGreenApiConnection();

  const isLoading = branchesLoading || connectionsLoading;

  const getStatusBadge = (status: WhatsAppConnection["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 ml-1" />
            متصل
          </Badge>
        );
      case "disconnected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 ml-1" />
            غير متصل
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Settings className="w-3 h-3 ml-1 animate-spin" />
            في الانتظار
          </Badge>
        );
    }
  };

  const getConnectionTypeBadge = (type: string) => {
    switch (type) {
      case "green_api":
        return (
          <Badge variant="outline" className="text-xs">
            <QrCode className="w-3 h-3 ml-1" />
            Green API
          </Badge>
        );
      case "meta":
        return (
          <Badge variant="outline" className="text-xs">
            <Smartphone className="w-3 h-3 ml-1" />
            Meta API
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLastSyncText = (lastSyncAt: string | null, status: string) => {
    if (status === 'pending') return "في انتظار الربط";
    if (!lastSyncAt) return "لم تتم المزامنة بعد";
    return formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true, locale: ar });
  };

  const resetForm = () => {
    setSelectedBranch("");
    setCustomBranchName("");
    setUseCustomBranch(false);
    setPhoneNumber("");
    setAccessToken("");
    setPhoneNumberId("");
    setStep(1);
    setGreenInstanceId("");
    setGreenApiToken("");
    setGreenStep(1);
  };

  const handleAddMetaConnection = async () => {
    if (!phoneNumber || !accessToken || !phoneNumberId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    let branchIdToUse = selectedBranch;

    if (useCustomBranch) {
      if (!customBranchName.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم الفرع",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const newBranch = await addBranch.mutateAsync({ name: customBranchName.trim() });
        branchIdToUse = newBranch.id;
      } catch (error) {
        return;
      }
    }

    if (!branchIdToUse) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار فرع أو إدخال اسم فرع جديد",
        variant: "destructive",
      });
      return;
    }

    await addConnection.mutateAsync({ 
      branchId: branchIdToUse, 
      phoneNumber,
      accessToken,
      phoneNumberId,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddGreenApiConnection = async () => {
    if (!phoneNumber || !greenInstanceId || !greenApiToken) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    let branchIdToUse = selectedBranch;

    if (useCustomBranch) {
      if (!customBranchName.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم الفرع",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const newBranch = await addBranch.mutateAsync({ name: customBranchName.trim() });
        branchIdToUse = newBranch.id;
      } catch (error) {
        return;
      }
    }

    if (!branchIdToUse) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار فرع أو إدخال اسم فرع جديد",
        variant: "destructive",
      });
      return;
    }

    // Setup webhook automatically
    const webhookUrl = getGreenApiWebhookUrl();
    try {
      await setupGreenApiWebhook.mutateAsync({
        instanceId: greenInstanceId,
        apiToken: greenApiToken,
        webhookUrl,
      });
    } catch (error) {
      console.error("Failed to setup webhook:", error);
    }

    await addGreenApiConnection.mutateAsync({ 
      branchId: branchIdToUse, 
      phoneNumber,
      instanceId: greenInstanceId,
      apiToken: greenApiToken,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleTestGreenApi = async () => {
    if (!greenInstanceId || !greenApiToken) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال Instance ID و API Token",
        variant: "destructive",
      });
      return;
    }

    await testGreenApiConnection.mutateAsync({
      instanceId: greenInstanceId,
      apiToken: greenApiToken,
    });
  };

  const handleDisconnect = async (id: string) => {
    await updateConnectionStatus.mutateAsync({ id, status: 'disconnected' });
  };

  const handleReconnect = async (id: string) => {
    await updateConnectionStatus.mutateAsync({ id, status: 'pending' });
  };

  const handleDelete = async (id: string) => {
    await deleteConnection.mutateAsync(id);
  };

  const handleTestConnection = async (id: string) => {
    await testConnection.mutateAsync(id);
  };

  const getWebhookUrl = () => {
    return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;
  };

  const getGreenApiWebhookUrl = () => {
    return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/green-api-webhook`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label}`,
    });
  };

  const connectedBranchIds = connections.map((c) => c.branch_id);
  const availableBranches = branches.filter(
    (b) => !connectedBranchIds.includes(b.id)
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ربط WhatsApp Business
            </h1>
            <p className="text-muted-foreground mt-1">
              3 طرق سهلة للربط - اختر ما يناسبك
            </p>
          </div>
          <div className="flex gap-2">
            <QuickUpload 
              trigger={
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  رفع صورة
                </Button>
              }
            />
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  ربط فرع جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-right">
                    ربط WhatsApp Business بفرع
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    اختر طريقة الربط المناسبة لك
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as "meta" | "green_api")} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="green_api" className="gap-2">
                      <QrCode className="w-4 h-4" />
                      Green API (سهل)
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      Meta API
                    </TabsTrigger>
                  </TabsList>

                  {/* Green API Tab */}
                  <TabsContent value="green_api" className="space-y-4 mt-4">
                    <Alert className="bg-emerald-500/10 border-emerald-500/30">
                      <QrCode className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-sm">
                        الأسهل والأسرع! فقط امسح QR Code من{" "}
                        <a 
                          href="https://green-api.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-500 underline"
                        >
                          Green API
                        </a>
                      </AlertDescription>
                    </Alert>

                    {greenStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label>الفرع</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={!useCustomBranch ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setUseCustomBranch(false);
                                setCustomBranchName("");
                              }}
                              className="flex-1"
                            >
                              اختر من الموجود
                            </Button>
                            <Button
                              type="button"
                              variant={useCustomBranch ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setUseCustomBranch(true);
                                setSelectedBranch("");
                              }}
                              className="flex-1"
                            >
                              أدخل اسم جديد
                            </Button>
                          </div>
                          
                          {!useCustomBranch ? (
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الفرع" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableBranches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="أدخل اسم الفرع الجديد"
                              value={customBranchName}
                              onChange={(e) => setCustomBranchName(e.target.value)}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="greenPhone">رقم WhatsApp</Label>
                          <Input
                            id="greenPhone"
                            type="tel"
                            placeholder="+249911234567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="text-left"
                            dir="ltr"
                          />
                        </div>

                        <Button
                          onClick={() => setGreenStep(2)}
                          className="w-full"
                          disabled={
                            (!useCustomBranch && !selectedBranch) || 
                            (useCustomBranch && !customBranchName.trim()) || 
                            !phoneNumber
                          }
                        >
                          التالي
                        </Button>
                      </div>
                    )}

                    {greenStep === 2 && (
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                          <p className="font-medium">خطوات الحصول على البيانات:</p>
                          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                            <li>سجل في <a href="https://green-api.com" target="_blank" className="text-primary underline">green-api.com</a></li>
                            <li>أنشئ Instance جديد</li>
                            <li>امسح QR Code بهاتفك</li>
                            <li>انسخ Instance ID و API Token</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instanceId" className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Instance ID
                          </Label>
                          <Input
                            id="instanceId"
                            placeholder="1234567890"
                            value={greenInstanceId}
                            onChange={(e) => setGreenInstanceId(e.target.value)}
                            className="text-left font-mono"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="apiToken" className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            API Token Instance
                          </Label>
                          <Input
                            id="apiToken"
                            type="password"
                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={greenApiToken}
                            onChange={(e) => setGreenApiToken(e.target.value)}
                            className="text-left font-mono"
                            dir="ltr"
                          />
                        </div>

                        <Button
                          variant="outline"
                          onClick={handleTestGreenApi}
                          className="w-full gap-2"
                          disabled={!greenInstanceId || !greenApiToken || testGreenApiConnection.isPending}
                        >
                          {testGreenApiConnection.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                          اختبار الاتصال
                        </Button>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setGreenStep(1)} className="flex-1">
                            رجوع
                          </Button>
                          <Button
                            onClick={handleAddGreenApiConnection}
                            className="flex-1 gap-2"
                            disabled={!greenInstanceId || !greenApiToken || addGreenApiConnection.isPending}
                          >
                            {addGreenApiConnection.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            تفعيل الربط
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Meta API Tab */}
                  <TabsContent value="meta" className="space-y-4 mt-4">
                    {step === 1 ? (
                      <div className="space-y-4">
                        <Alert className="bg-primary/10 border-primary/30">
                          <Info className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-sm">
                            احصل على هذه البيانات من{" "}
                            <a 
                              href="https://developers.facebook.com/apps" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              Meta Developer Portal
                            </a>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          <Label>الفرع</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={!useCustomBranch ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setUseCustomBranch(false);
                                setCustomBranchName("");
                              }}
                              className="flex-1"
                            >
                              اختر من الموجود
                            </Button>
                            <Button
                              type="button"
                              variant={useCustomBranch ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setUseCustomBranch(true);
                                setSelectedBranch("");
                              }}
                              className="flex-1"
                            >
                              أدخل اسم جديد
                            </Button>
                          </div>
                          
                          {!useCustomBranch ? (
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الفرع" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableBranches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="أدخل اسم الفرع الجديد"
                              value={customBranchName}
                              onChange={(e) => setCustomBranchName(e.target.value)}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">رقم WhatsApp Business</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+249911234567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phoneNumberId" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number ID
                          </Label>
                          <Input
                            id="phoneNumberId"
                            placeholder="123456789012345"
                            value={phoneNumberId}
                            onChange={(e) => setPhoneNumberId(e.target.value)}
                            className="text-left font-mono"
                            dir="ltr"
                          />
                          <p className="text-xs text-muted-foreground">
                            تجده في WhatsApp → API Setup → Phone Number ID
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accessToken" className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Access Token
                          </Label>
                          <Input
                            id="accessToken"
                            type="password"
                            placeholder="EAAxxxxxxx..."
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className="text-left font-mono"
                            dir="ltr"
                          />
                          <p className="text-xs text-muted-foreground">
                            استخدم Permanent Token أو System User Token
                          </p>
                        </div>

                        <Button
                          onClick={() => setStep(2)}
                          className="w-full gap-2"
                          disabled={
                            (!useCustomBranch && !selectedBranch) || 
                            (useCustomBranch && !customBranchName.trim()) || 
                            !phoneNumber || !accessToken || !phoneNumberId
                          }
                        >
                          التالي
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert className="bg-emerald-500/10 border-emerald-500/30">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <AlertDescription className="text-sm">
                            الآن أضف هذه البيانات في Webhook Settings في Meta
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Callback URL</Label>
                            <div className="flex gap-2">
                              <Input
                                value={getWebhookUrl()}
                                readOnly
                                className="text-left font-mono text-xs"
                                dir="ltr"
                              />
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => copyToClipboard(getWebhookUrl(), "Callback URL")}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Verify Token</Label>
                            <div className="flex gap-2">
                              <Input
                                value="lovable_whatsapp_verify"
                                readOnly
                                className="text-left font-mono text-xs"
                                dir="ltr"
                              />
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => copyToClipboard("lovable_whatsapp_verify", "Verify Token")}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <p className="font-medium mb-2">Webhook Fields المطلوبة:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>messages</li>
                          </ul>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                            رجوع
                          </Button>
                          <Button
                            onClick={handleAddMetaConnection}
                            className="flex-1 gap-2"
                            disabled={addConnection.isPending}
                          >
                            {addConnection.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            تفعيل الربط
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* طرق الربط المتاحة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer" onClick={() => { setConnectionMethod("green_api"); setIsDialogOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Green API</h3>
                  <p className="text-xs text-muted-foreground">الأسهل - فقط امسح QR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer" onClick={() => { setConnectionMethod("meta"); setIsDialogOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Meta API</h3>
                  <p className="text-xs text-muted-foreground">الرسمي - يحتاج حساب Developer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <QuickUpload 
            trigger={
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">رفع يدوي</h3>
                      <p className="text-xs text-muted-foreground">ارفع صور التحويلات مباشرة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {connections.filter((c) => c.status === "connected").length}
                </p>
                <p className="text-sm text-muted-foreground">فرع متصل</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Settings className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {connections.filter((c) => c.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {connections.filter((c) => c.status === "disconnected").length}
                </p>
                <p className="text-sm text-muted-foreground">غير متصل</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قائمة الاتصالات */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              الفروع المرتبطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا توجد فروع مرتبطة
                </h3>
                <p className="text-muted-foreground mb-4">
                  اختر طريقة الربط المناسبة لك من الأعلى
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {connection.branches?.name || "فرع غير معروف"}
                          </h4>
                          {getConnectionTypeBadge((connection as any).connection_type || "meta")}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" dir="ltr">
                            {connection.phone_number}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          آخر مزامنة: {getLastSyncText(connection.last_sync_at, connection.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(connection.status)}
                      <div className="flex items-center gap-1">
                        {connection.status === "connected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleTestConnection(connection.id)}
                            disabled={testConnection?.isPending}
                          >
                            {testConnection?.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 ml-1" />
                            )}
                            اختبار
                          </Button>
                        )}
                        {connection.status === "connected" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                            onClick={() => handleDisconnect(connection.id)}
                          >
                            <Unlink className="w-4 h-4" />
                          </Button>
                        )}
                        {connection.status === "disconnected" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => handleReconnect(connection.id)}
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                        )}
                        {connection.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => verifyConnection.mutate(connection.id)}
                            disabled={verifyConnection.isPending}
                          >
                            {verifyConnection.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 ml-1" />
                            )}
                            تفعيل
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(connection.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* تعليمات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 text-emerald-500" />
                طريقة Green API (الأسهل)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center font-medium">1</span>
                  <span>سجل مجاناً في <a href="https://green-api.com" target="_blank" className="text-emerald-500 underline">green-api.com</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center font-medium">2</span>
                  <span>أنشئ Instance وامسح QR بهاتفك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center font-medium">3</span>
                  <span>انسخ Instance ID و API Token هنا</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5 text-blue-500" />
                طريقة Meta API (الرسمية)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center font-medium">1</span>
                  <span>أنشئ تطبيق في <a href="https://developers.facebook.com" target="_blank" className="text-blue-500 underline">Meta Developer</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center font-medium">2</span>
                  <span>أضف WhatsApp Business وانسخ البيانات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center font-medium">3</span>
                  <span>أعد Webhook بالبيانات التي نوفرها</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppSettings;
