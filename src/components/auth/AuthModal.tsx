import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { UserRole } from '../../types/user';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Shield,
  User,
  Lock,
  Mail,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
  LogOut,
  UserCheck,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'register' | 'profile' | 'roles';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
}) => {
  const {
    user,
    profile,
    role,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    simulateRole,
    resetSimulatedRole,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(
    isAuthenticated ? 'profile' : defaultTab
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CITIZEN');
  const [regOrg, setRegOrg] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Profile update state
  const [editFullName, setEditFullName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editOrg, setEditOrg] = useState(profile?.organization || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const result = await login({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (!result.success) {
      setLoginError(result.error || 'Failed to authenticate');
    } else {
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    const result = await register({
      full_name: regFullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      confirm_password: regConfirmPassword,
      requested_role: regRole,
      organization: regOrg,
    });
    setRegLoading(false);

    if (!result.success) {
      setRegError(result.error || 'Registration failed');
    } else {
      setRegSuccess(result.message || 'Registration successful! Please check your email.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);
    if (!result.success) {
      setResetError(result.error || 'Failed to request reset');
    } else {
      setResetMessage(result.message || 'Reset instructions sent to your email.');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    const result = await updateProfile({
      full_name: editFullName,
      phone: editPhone,
      organization: editOrg,
    });
    setProfileLoading(false);
    if (result.success) {
      setProfileMsg('Profile updated successfully.');
    } else {
      setProfileMsg(`Error: ${result.error || 'Failed to update'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with Ghana Flag Colors */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-800" />

        <div className="p-6">
          <DialogHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-800 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                GhanaBuild Security & Identity Portal
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              National Infrastructure Monitoring & Role-Based Access Control (RBAC)
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4 text-xs">
              {isAuthenticated ? (
                <>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="roles">Switch Role</TabsTrigger>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                  <TabsTrigger value="roles">Test Roles</TabsTrigger>
                  <TabsTrigger value="reset">Reset</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* TAB 1: SIGN IN */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3.5">
                {loginError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="officer@ghanabuild.gov.gh"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Password</Label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reset')}
                      className="text-[11px] text-emerald-800 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold h-9"
                >
                  {loginLoading ? 'Authenticating with Supabase...' : 'Sign In'}
                </Button>
              </form>

              {/* Fast Test Login Hints */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Instant Test Personas (Click to switch instantly in preview):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => {
                      simulateRole('CITIZEN');
                      onClose();
                    }}
                  >
                    Citizen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => {
                      simulateRole('MMDCE_OFFICER', { districtId: 'DIST-ACCRA-METRO' });
                      onClose();
                    }}
                  >
                    MMDCE Officer (Accra)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => {
                      simulateRole('REGIONAL_OFFICER', { regionId: 'REG-ASHANTI-01' });
                      onClose();
                    }}
                  >
                    Regional Officer (Ashanti)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => {
                      simulateRole('SUPER_ADMIN');
                      onClose();
                    }}
                  >
                    Super Admin
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: REGISTER */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-3">
                {regError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                    <Input
                      required
                      placeholder="e.g. Kwame Mensah"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      required
                      placeholder="name@organization.gov.gh"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Phone (Optional)</Label>
                    <Input
                      placeholder="+233 24 123 4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Requested Role</Label>
                    <select
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                    >
                      <option value="CITIZEN">CITIZEN (General Public)</option>
                      <option value="COMMUNITY_OBSERVER">COMMUNITY_OBSERVER (Civil Society)</option>
                      <option value="MMDCE_OFFICER">MMDCE_OFFICER (District Assembly)</option>
                      <option value="REGIONAL_OFFICER">REGIONAL_OFFICER (Regional Coordinating Council)</option>
                      <option value="NATIONAL_MONITOR">NATIONAL_MONITOR (NDPC / Presidency)</option>
                      <option value="MODERATOR">MODERATOR (Civic Compliance)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Organization / Agency</Label>
                  <Input
                    placeholder="e.g. Accra Metropolitan Assembly, NDPC, or Self"
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Government officer roles undergo verification against civil service credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Password</Label>
                    <Input
                      type="password"
                      required
                      placeholder="Min. 8 characters with uppercase & number"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
                    <Input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold h-9 mt-2"
                >
                  {regLoading ? 'Creating User Profile...' : 'Complete Registration'}
                </Button>
              </form>
            </TabsContent>

            {/* TAB 3: TEST ROLES & JURISDICTION SWITCHER */}
            <TabsContent value="roles" className="space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 block">
                  Interactive Security & RBAC Inspector
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Select any of the 7 supported national roles to test how permissions, geographical
                  jurisdiction checks, and UI boundaries respond across the system.
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    role: 'CITIZEN' as UserRole,
                    title: 'Citizen',
                    desc: 'Public view of verified projects, submitting community reports, voting & commenting.',
                    jurisdiction: 'National Read / Local Report',
                  },
                  {
                    role: 'COMMUNITY_OBSERVER' as UserRole,
                    title: 'Community Observer',
                    desc: 'Civil society field verifier with GPS-tagged evidence uploading privileges.',
                    jurisdiction: 'District / Field Level',
                  },
                  {
                    role: 'MMDCE_OFFICER' as UserRole,
                    title: 'MMDCE Officer',
                    desc: 'District assembly planner. Can ONLY edit & verify projects in Accra Metropolitan Assembly.',
                    jurisdiction: 'Accra Metro Assembly (GAR)',
                    params: { districtId: 'DIST-ACCRA-METRO', regionId: 'REG-GAR-01' },
                  },
                  {
                    role: 'REGIONAL_OFFICER' as UserRole,
                    title: 'Regional Officer',
                    desc: 'Regional Coordinating Council officer. Restricted strictly to Ashanti Region projects.',
                    jurisdiction: 'Ashanti Region (RCC)',
                    params: { regionId: 'REG-ASHANTI-01' },
                  },
                  {
                    role: 'NATIONAL_MONITOR' as UserRole,
                    title: 'National Monitor',
                    desc: 'Presidency / NDPC officer. Comprehensive national analytics and status audits.',
                    jurisdiction: 'Nationwide (All 16 Regions)',
                  },
                  {
                    role: 'MODERATOR' as UserRole,
                    title: 'Moderator',
                    desc: 'Civic discourse supervisor. Moderates community comments, flags abusive content.',
                    jurisdiction: 'Civic Content Layer',
                  },
                  {
                    role: 'SUPER_ADMIN' as UserRole,
                    title: 'Super Administrator',
                    desc: 'Ministry of Local Government. Full system configuration, role assignments, audit logs.',
                    jurisdiction: 'Universal System Authority',
                  },
                ].map((item) => (
                  <div
                    key={item.role}
                    className={`p-3 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                      role === item.role
                        ? 'border-emerald-700 bg-emerald-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-white text-slate-700 border-slate-200"
                        >
                          {item.role}
                        </Badge>
                        {role === item.role && (
                          <Badge className="bg-emerald-800 text-white text-[10px]">Active</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>Jurisdiction: {item.jurisdiction}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={role === item.role ? 'primary' : 'outline'}
                      className={`text-xs shrink-0 ${
                        role === item.role
                          ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          : 'text-slate-700'
                      }`}
                      onClick={() => {
                        simulateRole(item.role, item.params);
                        onClose();
                      }}
                    >
                      {role === item.role ? 'Active' : 'Switch'}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 4: PROFILE & ACTIVE SESSION */}
            <TabsContent value="profile" className="space-y-4">
              {profile ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-800" />
                        <span className="text-xs font-bold text-slate-900">{profile.full_name}</span>
                      </div>
                      <Badge className="bg-emerald-800 text-white font-mono text-[10px]">
                        {profile.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Email:</span>
                        <span className="font-mono text-slate-800">{profile.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Status:</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified Active
                        </span>
                      </div>
                      {profile.organization && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">
                            Organization:
                          </span>
                          <span className="text-slate-800">{profile.organization}</span>
                        </div>
                      )}
                      {(profile.region_id || profile.district_id) && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">
                            Assigned Jurisdiction:
                          </span>
                          <span className="text-slate-800 font-mono">
                            {profile.district_id || 'All Districts'} (Region: {profile.region_id || 'All'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Edit Personal Info</span>
                    {profileMsg && (
                      <div className="p-2.5 rounded bg-slate-100 text-slate-700 text-xs">{profileMsg}</div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                      <Input
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Phone</Label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Organization</Label>
                      <Input
                        value={editOrg}
                        onChange={(e) => setEditOrg(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={profileLoading}
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-black text-white text-xs"
                    >
                      {profileLoading ? 'Saving...' : 'Update Details'}
                    </Button>
                  </form>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-200 hover:bg-red-50 text-xs gap-1.5"
                      onClick={async () => {
                        await logout();
                        onClose();
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No active session found. Please sign in or choose a test role.
                </div>
              )}
            </TabsContent>

            {/* TAB 5: RESET PASSWORD */}
            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered GhanaBuild email to receive an official password reset link.
                </p>
                {resetError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                    {resetError}
                  </div>
                )}
                {resetMessage && (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    {resetMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Registered Email</Label>
                  <Input
                    type="email"
                    required
                    placeholder="officer@ghanabuild.gov.gh"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold h-9"
                >
                  {resetLoading ? 'Sending Instructions...' : 'Send Password Reset Link'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
