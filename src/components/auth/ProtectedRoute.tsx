import React from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { UserRole } from '../../types/user';
import { ShieldAlert, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  onOpenLogin?: () => void;
  fallbackMessage?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
  onOpenLogin,
  fallbackMessage,
}) => {
  const { isAuthenticated, role, checkPermission, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
        <p className="text-sm text-slate-500 font-medium">Verifying security credentials...</p>
      </div>
    );
  }

  // 1. Not Authenticated
  if (!isAuthenticated || !profile) {
    return (
      <Card className="border-amber-200 bg-amber-50/40 max-w-xl mx-auto my-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">Authentication Required</CardTitle>
              <CardDescription>
                This module requires verified credentials on the GhanaBuild 2.0 platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            {fallbackMessage ||
              'Please sign in with your verified government officer, monitor, or citizen account to access this operational dashboard.'}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={onOpenLogin}
              className="bg-emerald-800 hover:bg-emerald-900 text-white gap-2 text-xs"
            >
              Sign In to GhanaBuild
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Role Check (SUPER_ADMIN has universal override)
  if (role !== 'SUPER_ADMIN' && requiredRoles && requiredRoles.length > 0) {
    if (!role || !requiredRoles.includes(role)) {
      return (
        <Card className="border-red-200 bg-red-50/40 max-w-2xl mx-auto my-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-red-900">403 Forbidden: Privilege Boundary</CardTitle>
                  <Badge variant="destructive" className="text-[10px] uppercase">
                    Access Denied
                  </Badge>
                </div>
                <CardDescription className="text-red-700/80 text-xs">
                  Server-side Role-Based Access Control (RBAC) prevented unauthorized access.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="bg-white/80 p-3.5 rounded-lg border border-red-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Your Current Role:</span>
                <span className="font-mono font-bold text-slate-800">{role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Authorized Roles:</span>
                <span className="font-mono text-emerald-800 font-semibold">
                  {requiredRoles.join(' | ')}
                </span>
              </div>
              {profile.organization && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Organization:</span>
                  <span className="text-slate-700">{profile.organization}</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed">
              In accordance with Ghana Public Financial Management Act (PFMA) Section 24, administrative
              and project management controls are restricted strictly to authorized government officers.
            </p>
          </CardContent>
        </Card>
      );
    }
  }

  // 3. Permission Check
  if (role !== 'SUPER_ADMIN' && requiredPermission) {
    const hasPerm = checkPermission(requiredPermission);
    if (!hasPerm) {
      return (
        <Card className="border-red-200 bg-red-50/40 max-w-xl mx-auto my-8">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-800">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-sm">Missing Required Permission: {requiredPermission}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Your active role <span className="font-mono font-bold">{role}</span> does not possess the
              required authority for this action.
            </p>
          </CardContent>
        </Card>
      );
    }
  }

  // Access Granted
  return <>{children}</>;
};
