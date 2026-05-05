import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) =>{
 const { user, isLoading } = useAuth();
 if (isLoading) return<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
 if (!user) return<Navigate to="/auth" replace />;
 return<>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) =>{
 const { user, isLoading, isAdmin } = useAuth();
 if (isLoading) return<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
 if (!user) return<Navigate to="/auth" replace />;
 if (!isAdmin) return<Navigate to="/dashboard" replace />;
 return<>{children}</>;
};
