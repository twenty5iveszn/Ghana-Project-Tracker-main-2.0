import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { UserRole, Profile, Jurisdiction } from '../../types/user';
import { LoginInput, RegisterInput, UpdateProfileInput } from '../validation/auth';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  jurisdiction: Jurisdiction | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOfficer: boolean;
  isRegionalOfficer: boolean;
  isMmdceOfficer: boolean;
  isNationalMonitor: boolean;
  isModerator: boolean;
  isCitizen: boolean;
  login: (credentials: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateProfile: (data: UpdateProfileInput) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  canAccessProject: (projectRegionId?: string | null, projectDistrictId?: string | null) => boolean;
  // Test role switcher for verification simulations
  simulateRole: (role: UserRole, options?: { regionId?: string; districtId?: string }) => void;
  resetSimulatedRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reference test personas for development & security demonstration
const TEST_PERSONAS: Record<UserRole, Profile> = {
  CITIZEN: {
    id: 'usr-cit-001',
    auth_user_id: 'auth-cit-001',
    full_name: 'Kwame Mensah',
    email: 'kwame.citizen@ghanabuild.gov.gh',
    phone: '+233 24 123 4567',
    role: 'CITIZEN',
    region_id: 'REG-GAR-01',
    district_id: 'DIST-ACCRA-METRO',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  COMMUNITY_OBSERVER: {
    id: 'usr-obs-001',
    auth_user_id: 'auth-obs-001',
    full_name: 'Ama Serwaa',
    email: 'ama.observer@ghanabuild.gov.gh',
    phone: '+233 20 987 6543',
    role: 'COMMUNITY_OBSERVER',
    region_id: 'REG-ASHANTI-01',
    district_id: 'DIST-KUMASI-METRO',
    organization: 'Ghana Integrity Initiative / Civil Society',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  MMDCE_OFFICER: {
    id: 'usr-mmdce-001',
    auth_user_id: 'auth-mmdce-001',
    full_name: 'Hon. Kofi Adjei',
    email: 'kofi.adjei@accrametro.gov.gh',
    phone: '+233 24 555 1212',
    role: 'MMDCE_OFFICER',
    region_id: 'REG-GAR-01',
    district_id: 'DIST-ACCRA-METRO',
    organization: 'Accra Metropolitan Assembly',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  REGIONAL_OFFICER: {
    id: 'usr-reg-001',
    auth_user_id: 'auth-reg-001',
    full_name: 'Ing. Yaw Boateng',
    email: 'yaw.boateng@ashanti-rcc.gov.gh',
    phone: '+233 27 777 8899',
    role: 'REGIONAL_OFFICER',
    region_id: 'REG-ASHANTI-01',
    district_id: null,
    organization: 'Ashanti Regional Coordinating Council',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  NATIONAL_MONITOR: {
    id: 'usr-nat-001',
    auth_user_id: 'auth-nat-001',
    full_name: 'Dr. Afia Osei',
    email: 'afia.osei@presidency.gov.gh',
    phone: '+233 24 999 0000',
    role: 'NATIONAL_MONITOR',
    region_id: null,
    district_id: null,
    organization: 'Office of the President / NDPC Monitoring Unit',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  MODERATOR: {
    id: 'usr-mod-001',
    auth_user_id: 'auth-mod-001',
    full_name: 'Ebenezer Darko',
    email: 'moderation@ghanabuild.gov.gh',
    phone: '+233 50 333 4444',
    role: 'MODERATOR',
    region_id: null,
    district_id: null,
    organization: 'GhanaBuild Civic Standards Commission',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  SUPER_ADMIN: {
    id: 'usr-adm-001',
    auth_user_id: 'auth-adm-001',
    full_name: 'Chief Systems Administrator',
    email: 'admin@ghanabuild.gov.gh',
    phone: '+233 24 000 0001',
    role: 'SUPER_ADMIN',
    region_id: null,
    district_id: null,
    organization: 'Ministry of Local Government & Digital Systems',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simulatedProfile, setSimulatedProfile] = useState<Profile | null>(null);

  const activeProfile = simulatedProfile || profile;
  const currentRole = activeProfile?.role || null;

  // Fetch user profile from Supabase Database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (!isSupabaseConfigured) {
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  // Initialize and listen to Supabase Auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            if (initialSession?.user) {
              await fetchProfile(initialSession.user.id);
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (!isMounted) return;
              setSession(newSession);
              setUser(newSession?.user ?? null);
              if (newSession?.user) {
                await fetchProfile(newSession.user.id);
              } else {
                setProfile(null);
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  // Login handler
  const login = async (credentials: LoginInput) => {
    try {
      if (!isSupabaseConfigured) {
        // Fallback for simulation when Supabase keys not set in dev
        const matchingRole = Object.values(TEST_PERSONAS).find((p) => p.email === credentials.email);
        if (matchingRole) {
          setSimulatedProfile(matchingRole);
          return { success: true };
        }
        return {
          success: false,
          error: 'Supabase credentials not configured. Use the Role Switcher below to test role access.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
      }

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Login failed',
      };
    }
  };

  // Registration handler
  const register = async (data: RegisterInput) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error?.message || 'Registration failed',
        };
      }

      return {
        success: true,
        message: result.data?.message || 'Account registered successfully. Please verify your email.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Registration request failed',
      };
    }
  };

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setSimulatedProfile(null);
  };

  // Password reset request
  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, error: result.error?.message || 'Password reset request failed' };
      }
      return { success: true, message: result.data?.message };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send reset email' };
    }
  };

  // Profile update handler
  const updateProfile = async (data: UpdateProfileInput) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, error: result.error?.message || 'Failed to update profile' };
      }

      if (result.data?.profile) {
        setProfile(result.data.profile);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Permission checker
  const checkPermission = (permission: string): boolean => {
    if (!currentRole) return false;
    if (currentRole === 'SUPER_ADMIN') return true;

    // Based on Section 6 role matrix
    switch (currentRole) {
      case 'CITIZEN':
        return ['projects:read_verified', 'projects:submit', 'comments:create', 'votes:cast', 'reports:submit'].includes(permission);
      case 'COMMUNITY_OBSERVER':
        return ['projects:read_verified', 'projects:submit', 'comments:create', 'votes:cast', 'reports:submit', 'evidence:upload_field'].includes(permission);
      case 'MMDCE_OFFICER':
        return ['projects:read_jurisdiction', 'projects:create_district', 'projects:update_district', 'updates:post_district', 'evidence:verify_district', 'reports:resolve_district'].includes(permission);
      case 'REGIONAL_OFFICER':
        return ['projects:read_jurisdiction', 'projects:update_region', 'updates:post_region', 'evidence:verify_region', 'reports:resolve_region', 'analytics:regional'].includes(permission);
      case 'NATIONAL_MONITOR':
        return ['projects:read_all', 'projects:verify_national', 'analytics:national', 'audit_logs:read', 'reports:read_all'].includes(permission);
      case 'MODERATOR':
        return ['projects:read_all', 'comments:moderate', 'evidence:moderate', 'reports:moderate'].includes(permission);
      default:
        return false;
    }
  };

  // Jurisdiction project access validator
  const canAccessProject = (projectRegionId?: string | null, projectDistrictId?: string | null): boolean => {
    if (!currentRole || !activeProfile) return false;
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'NATIONAL_MONITOR') return true;

    if (currentRole === 'REGIONAL_OFFICER') {
      return Boolean(activeProfile.region_id && activeProfile.region_id === projectRegionId);
    }

    if (currentRole === 'MMDCE_OFFICER') {
      return Boolean(activeProfile.district_id && activeProfile.district_id === projectDistrictId);
    }

    return false;
  };

  // Test simulation helpers
  const simulateRole = (role: UserRole, options?: { regionId?: string; districtId?: string }) => {
    const basePersona = { ...TEST_PERSONAS[role] };
    if (options?.regionId) basePersona.region_id = options.regionId;
    if (options?.districtId) basePersona.district_id = options.districtId;
    setSimulatedProfile(basePersona);
  };

  const resetSimulatedRole = () => {
    setSimulatedProfile(null);
  };

  const jurisdiction: Jurisdiction | null = activeProfile
    ? {
        region_id: activeProfile.region_id,
        district_id: activeProfile.district_id,
      }
    : null;

  const value: AuthContextType = {
    user,
    profile: activeProfile,
    role: currentRole,
    jurisdiction,
    session,
    token: session?.access_token || (activeProfile ? `simulated-${activeProfile.role.toLowerCase()}-token` : null),
    isAuthenticated: Boolean(user || activeProfile),
    isLoading,
    isSuperAdmin: currentRole === 'SUPER_ADMIN',
    isOfficer: currentRole === 'MMDCE_OFFICER' || currentRole === 'REGIONAL_OFFICER',
    isRegionalOfficer: currentRole === 'REGIONAL_OFFICER',
    isMmdceOfficer: currentRole === 'MMDCE_OFFICER',
    isNationalMonitor: currentRole === 'NATIONAL_MONITOR',
    isModerator: currentRole === 'MODERATOR',
    isCitizen: currentRole === 'CITIZEN' || currentRole === 'COMMUNITY_OBSERVER',
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshProfile,
    checkPermission,
    canAccessProject,
    simulateRole,
    resetSimulatedRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
