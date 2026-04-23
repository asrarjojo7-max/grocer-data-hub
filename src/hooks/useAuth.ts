import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { registerPushNotifications, unregisterPushNotifications } from "@/lib/pushNotifications";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const uid = s.user.id;
        setTimeout(() => {
          supabase.from("user_roles").select("role").eq("user_id", uid).then(({ data }) => {
            setIsAdmin(!!data?.some((r) => r.role === "admin"));
          });
          // Register device for push notifications (no-op on web)
          registerPushNotifications(uid).catch((e) => console.error("[push] register:", e));
        }, 0);
      } else {
        setIsAdmin(false);
        unregisterPushNotifications().catch(() => {});
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const uid = session.user.id;
        supabase.from("user_roles").select("role").eq("user_id", uid).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
        registerPushNotifications(uid).catch((e) => console.error("[push] register:", e));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { session, user, loading, isAdmin, signOut };
}

