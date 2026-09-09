import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserCheck,
  UserX,
  MapPin,
  Building,
  RefreshCw,
  AlertTriangle,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Profile, UserRole, AccountStatus } from '../../types/user';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function UserManagementDirectory() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string; region_id: string }[]>([]);

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<Profile | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<Profile | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for Role Assignment
  const [selectedRole, setSelectedRole] = useState<UserRole>('CITIZEN');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [organizationInput, setOrganizationInput] = useState<string>('');
  const [roleReason, setRoleReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for Status Update
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');

  // Form states for Create User
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('REGIONAL_OFFICER');
  const [newRegionId, setNewRegionId] = useState('');
  const [newDistrictId, setNewDistrictId] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newReason, setNewReason] = useState('');

  const { profile: currentProfile, token: authToken } = useAuth();
  const isSuperAdmin = currentProfile?.role === 'SUPER_ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authToken || 'simulated-super_admin-token';
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to fetch user directory');
      }
      setUsers(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving users');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeography = async () => {
    try {
      const [resReg, resDist] = await Promise.all([
        fetch('/api/geography/regions'),
        fetch('/api/geography/districts'),
      ]);
      const jsonReg = await resReg.json();
      const jsonDist = await resDist.json();
      if (jsonReg.success) setRegions(jsonReg.data);
      if (jsonDist.success) setDistricts(jsonDist.data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGeography();
  }, [search, roleFilter, statusFilter, authToken]);

  const openRoleModal = (user: Profile) => {
    setRoleModalUser(user);
    setSelectedRole(user.role);
    setSelectedRegionId(user.region_id || '');
    setSelectedDistrictId(user.district_id || '');
    setOrganizationInput(user.organization || '');
    setRoleReason('');
    setActionError(null);
    setActionSuccess(null);
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch(`/api/admin/users/${roleModalUser.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          region_id: selectedRegionId || null,
          district_id: selectedDistrictId || null,
          organization: organizationInput || null,
          reason: roleReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to assign role');
      }

      setActionSuccess(`Successfully assigned ${selectedRole} to ${roleModalUser.full_name}`);
      setTimeout(() => {
        setRoleModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error assigning role');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (user: Profile) => {
    setStatusModalUser(user);
    setTargetStatus(user.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    setStatusReason('');
    setActionError(null);
    setActionSuccess(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch(`/api/admin/users/${statusModalUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update user status');
      }

      setActionSuccess(`Account status updated to ${targetStatus}`);
      setTimeout(() => {
        setStatusModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error updating account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: newFullName,
          email: newEmail,
          phone: newPhone || undefined,
          role: newRole,
          region_id: newRegionId || null,
          district_id: newDistrictId || null,
          organization: newOrg || null,
          reason: newReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to provision user');
      }

      setActionSuccess('Official user account provisioned successfully');
      setTimeout(() => {
        setCreateModalOpen(false);
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        setNewReason('');
        fetchUsers();
      }, 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error provisioning user');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-purple-900 text-purple-200 border border-purple-700">Super Admin</Badge>;
      case 'NATIONAL_MONITOR':
        return <Badge className="bg-blue-900 text-blue-200 border border-blue-700">National Monitor</Badge>;
      case 'REGIONAL_OFFICER':
        return <Badge className="bg-emerald-900 text-emerald-200 border border-emerald-700">Regional Officer</Badge>;
      case 'MMDCE_OFFICER':
        return <Badge className="bg-cyan-900 text-cyan-200 border border-cyan-700">MMDCE Officer</Badge>;
      case 'MODERATOR':
        return <Badge className="bg-amber-900 text-amber-200 border border-amber-700">Moderator</Badge>;
      case 'COMMUNITY_OBSERVER':
        return <Badge className="bg-teal-900 text-teal-200 border border-teal-700">Observer</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600">Citizen</Badge>;
    }
  };

  const filteredDistricts = selectedRegionId
    ? districts.filter((d) => d.region_id === selectedRegionId)
    : districts;

  const newFilteredDistricts = newRegionId
    ? districts.filter((d) => d.region_id === newRegionId)
    : districts;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Phase 8 • RBAC & User Administration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Official User Directory & Jurisdictions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage government officers, monitors, and community oversight permissions with immutable audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 px-3 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isSuperAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setCreateModalOpen(true);
                setActionError(null);
                setActionSuccess(null);
              }}
              className="h-9 px-3 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Provision Officer
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="NATIONAL_MONITOR">National Monitors</option>
            <option value="REGIONAL_OFFICER">Regional Officers</option>
            <option value="MMDCE_OFFICER">MMDCE Officers</option>
            <option value="MODERATOR">Moderators</option>
            <option value="COMMUNITY_OBSERVER">Observers</option>
            <option value="CITIZEN">Citizens</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading user directory...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No users found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role & Authority</th>
                  <th className="py-3 px-4">Assigned Jurisdiction</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentProfile?.id === u.id || currentProfile?.email === u.email;
                  const isSuspended = u.account_status === 'SUSPENDED';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {u.full_name}
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-sm border border-amber-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">{u.email}</div>
                        {u.phone && <div className="text-slate-400 text-[11px]">{u.phone}</div>}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-3.5 px-4">
                        {u.district_name ? (
                          <div>
                            <span className="font-semibold text-slate-800">{u.district_name}</span>
                            <div className="text-slate-500 text-[11px]">{u.region_name}</div>
                          </div>
                        ) : u.region_name ? (
                          <span className="font-semibold text-emerald-800">{u.region_name} Region</span>
                        ) : (
                          <span className="text-slate-500 italic">National Oversight</span>
                        )}
                      </td>

                      {/* Organization */}
                      <td className="py-3.5 px-4 text-slate-700 max-w-[200px] truncate">
                        {u.organization || <span className="text-slate-400 italic">Civilian / Unattached</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <Badge variant="destructive" className="text-[10px]">
                            SUSPENDED
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            ACTIVE
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(u)}
                            disabled={!isSuperAdmin || isCurrent}
                            title={
                              isCurrent
                                ? 'Self-role escalation is blocked for security'
                                : !isSuperAdmin
                                ? 'Super Administrator privileges required'
                                : 'Assign role & jurisdiction'
                            }
                            className={`h-7 px-2.5 text-[11px] font-semibold ${
                              isCurrent ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Assign Role
                          </Button>

                          <Button
                            variant={isSuspended ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => openStatusModal(u)}
                            disabled={!isSuperAdmin || isCurrent}
                            title={
                              isCurrent
                                ? 'Super Administrators cannot suspend themselves'
                                : !isSuperAdmin
                                ? 'Super Administrator privileges required'
                                : isSuspended
                                ? 'Activate Account'
                                : 'Suspend Account'
                            }
                            className={`h-7 px-2.5 text-[11px] font-semibold ${
                              isSuspended
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'text-rose-700 border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Assign Authority & Jurisdiction</h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Target User:</div>
                <div className="font-bold text-slate-900 text-sm">{roleModalUser.full_name}</div>
                <div className="font-mono text-slate-600">{roleModalUser.email}</div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Administrative Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="CITIZEN">CITIZEN (Public Reviewer)</option>
                  <option value="COMMUNITY_OBSERVER">COMMUNITY_OBSERVER (Civil Society Monitor)</option>
                  <option value="MODERATOR">MODERATOR (Civic Standards Commission)</option>
                  <option value="MMDCE_OFFICER">MMDCE_OFFICER (District Executive / MMDA)</option>
                  <option value="REGIONAL_OFFICER">REGIONAL_OFFICER (Regional Coordinating Council)</option>
                  <option value="NATIONAL_MONITOR">NATIONAL_MONITOR (Presidency / NDPC Oversight)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              {/* Region Jurisdiction (for REGIONAL_OFFICER and MMDCE_OFFICER) */}
              {(selectedRole === 'REGIONAL_OFFICER' || selectedRole === 'MMDCE_OFFICER') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRegionId}
                    onChange={(e) => {
                      setSelectedRegionId(e.target.value);
                      setSelectedDistrictId('');
                    }}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select Region...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} Region
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Jurisdiction (for MMDCE_OFFICER) */}
              {selectedRole === 'MMDCE_OFFICER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District Assembly (MMDA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select District Assembly...</option>
                    {filteredDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Organization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Organization / Directorate
                </label>
                <input
                  type="text"
                  placeholder="e.g. Accra Metropolitan Assembly"
                  value={organizationInput}
                  onChange={(e) => setOrganizationInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Audit Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Official reason for role assignment (recorded in permanent audit log)..."
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  {actionSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleModalUser(null)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={actionLoading || roleReason.trim().length < 5}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Status Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">Update User Account Status</h3>
              </div>
              <button
                onClick={() => setStatusModalUser(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Target User:</div>
                <div className="font-bold text-slate-900 text-sm">{statusModalUser.full_name}</div>
                <div className="font-mono text-slate-600">{statusModalUser.email}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ACTIVE">ACTIVE (Authorized platform access)</option>
                  <option value="SUSPENDED">SUSPENDED (Access blocked immediately)</option>
                  <option value="DISABLED">DISABLED (Archived account)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Audit Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Official justification for suspension or activation (recorded in permanent audit log)..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  {actionSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalUser(null)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={actionLoading || statusReason.trim().length < 5}
                  className={`text-xs font-semibold ${
                    targetStatus === 'SUSPENDED'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {actionLoading ? 'Updating...' : `Set Status to ${targetStatus}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Provision Official User Account</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ing. Kwame Acheampong"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kwame.acheampong@ashanti-rcc.gov.gh"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+233 24 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Administrative Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="REGIONAL_OFFICER">REGIONAL_OFFICER (Regional Coordinating Council)</option>
                  <option value="MMDCE_OFFICER">MMDCE_OFFICER (District Executive / MMDA)</option>
                  <option value="NATIONAL_MONITOR">NATIONAL_MONITOR (Presidency / NDPC Oversight)</option>
                  <option value="MODERATOR">MODERATOR (Civic Standards Commission)</option>
                  <option value="COMMUNITY_OBSERVER">COMMUNITY_OBSERVER (Civil Society Monitor)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              {(newRole === 'REGIONAL_OFFICER' || newRole === 'MMDCE_OFFICER') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRegionId}
                    onChange={(e) => {
                      setNewRegionId(e.target.value);
                      setNewDistrictId('');
                    }}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select Region...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} Region
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newRole === 'MMDCE_OFFICER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District Assembly (MMDA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newDistrictId}
                    onChange={(e) => setNewDistrictId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select District Assembly...</option>
                    {newFilteredDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Ashanti Regional Coordinating Council"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Justification Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Official authorization rationale for provisioning this account..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  {actionSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={actionLoading || newReason.trim().length < 5}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {actionLoading ? 'Creating...' : 'Provision Officer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
