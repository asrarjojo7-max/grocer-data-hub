import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Footer } from "@/components/layout/Footer";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الدخول");
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحساب");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-elegant border-border/60">
        <CardHeader className="text-center pb-4">
          <img
            src={logo}
            alt="نسبتي"
            className="w-20 h-20 mx-auto rounded-2xl shadow-elegant mb-3"
          />
          <CardTitle className="text-2xl font-extrabold">نسبتي</CardTitle>
          <CardDescription>حساب عمولات المصممين — سجّل دخولك للبدء</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
              <TabsTrigger value="signin" className="text-base">دخول</TabsTrigger>
              <TabsTrigger value="signup" className="text-base">تسجيل جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input type="password" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold press" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input className="h-12 text-base" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input type="password" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold press" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إنشاء حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
}
