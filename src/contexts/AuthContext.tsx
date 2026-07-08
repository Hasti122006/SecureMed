import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "doctor" | "patient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: { full_name: string } | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

const fetchUserData = async (userId: string) => {
    console.log(`🔍 fetchUserData for userId: ${userId}`);
    try {
      const timeoutPromise = (promise: Promise<any>, ms: number) => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
          )
        ]);

      const [rolesPromise, profPromise] = await Promise.all([
        timeoutPromise(supabase.from("user_roles").select("role").eq("user_id", userId).single(), 5000),
        timeoutPromise(supabase.from("profiles").select("full_name").eq("user_id", userId).single(), 5000)
      ]);

      const [{ data: roles, error: roleError }] = [rolesPromise];
      const [{ data: prof, error: profError }] = [profPromise];
      
      console.log('Role query:', { roles, roleError });
      console.log('Profile query:', { prof, profError });

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      } else if (roles) {
        setRole(roles.role);
        console.log(`✅ Set role: ${roles.role}`);
      } else {
        console.log('⚠️ No role found for user');
      }
      
      if (profError) {
        console.error("Error fetching user profile:", profError);
      } else if (prof) {
        setProfile(prof);
        console.log(`✅ Set profile: ${prof.full_name}`);
      } else {
        console.log('⚠️ No profile found for user');
      }
    } catch (err: any) {
      console.error("❌ Error/timeout in fetchUserData:", err.message);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    
    // Create profile and role in database
    if (data.user) {
      const userId = data.user.id;
      
      // Create profile
      await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
      });
      
      // Create user role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signout produced an error, proceeding with local signout:", e);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
