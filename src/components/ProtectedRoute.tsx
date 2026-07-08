import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "doctor" | "patient")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(loading);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      console.log('⏳ ProtectedRoute loading started');
      timeout = setTimeout(() => {
        console.warn('⚠️ ProtectedRoute loading timeout (10s), forcing forward');
        setShowLoading(false);
      }, 10000);
    } else {
      setShowLoading(false);
      console.log('✅ ProtectedRoute loading complete');
    }
    return () => timeout && clearTimeout(timeout);
  }, [loading]);

  if (showLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Loading your dashboard...</p>
        <p className="text-sm text-muted-foreground">Please wait while we verify your session</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles?.length) {
    const redirectMap = { doctor: "/doctor", patient: "/patient", admin: "/admin" } as const;
    const effectiveRole = role ?? "patient";
    if (!allowedRoles.includes(effectiveRole)) {
      return <Navigate to={redirectMap[effectiveRole]} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
