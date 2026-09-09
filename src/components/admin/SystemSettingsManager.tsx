import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  History,
  FileCheck,
  Server,
  Bell,
  Eye,
} from 'lucide-react';
import { SystemSettings } from '../../types/project';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function SystemSettingsManager() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [justificationReason, setJustificationReason] = useState<string>('');

  const { profile, token: authToken } = useAuth();
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to load system settings');
      }
      setSettings(json.data);
      setFormData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [authToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setError('SUPER_ADMIN_REQUIRED: Only Super Administrators can alter core system parameters.');
      return;
    }

    if (justificationReason.trim().length < 5) {
      setError('MANDATORY_JUSTIFICATION_REQUIRED: A formal reason of at least 5 characters is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          reason: justificationReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update system settings');
      }

      setSettings(json.data);
      setFormData(json.data);
      setJustificationReason('');
      setSuccess('System parameters successfully updated and recorded in immutable audit log.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving system parameters');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading System Governance Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Phase 8 • System Configuration & Operational Parameters
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Governance & Operational Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure system-wide operational boundaries, civic submission switches, and security parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {settings && (
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-500 font-mono">Config Version {settings.version}</div>
              <div className="text-[11px] text-slate-400">
                Updated {new Date(settings.updated_at).toLocaleDateString()} by {settings.updated_by}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="h-9 px-3 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Platform Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Platform Identity & Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Platform Name
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={formData.platform_name || ''}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registry Page Size (Items per query)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                disabled={!isSuperAdmin}
                value={formData.default_page_size || 20}
                onChange={(e) => setFormData({ ...formData, default_page_size: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Evidence Max File Upload Size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                disabled={!isSuperAdmin}
                value={formData.evidence_max_file_size_mb || 25}
                onChange={(e) =>
                  setFormData({ ...formData, evidence_max_file_size_mb: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statutory Audit Trail Retention (Years)
              </label>
              <input
                type="number"
                min={1}
                max={25}
                disabled={!isSuperAdmin}
                value={formData.audit_log_retention_years || 7}
                onChange={(e) =>
                  setFormData({ ...formData, audit_log_retention_years: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Civic Engagement Switches */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Citizen Participation & Reporting Switches
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Public Submissions */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Public Submissions Enabled</div>
                <div className="text-[11px] text-slate-500">Allows citizens to nominate unlisted projects</div>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.public_submissions_enabled ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, public_submissions_enabled: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Community Reporting */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Community Reporting Enabled</div>
                <div className="text-[11px] text-slate-500">Permits citizens to flag defects and halts</div>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.community_reporting_enabled ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, community_reporting_enabled: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Civic Comments */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Civic Discussions & Comments</div>
                <div className="text-[11px] text-slate-500">Public comment board under project dossiers</div>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.civic_comments_enabled ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, civic_comments_enabled: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Require Phone */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <div>
                <div className="text-xs font-bold text-slate-800">Require Phone for Problem Reports</div>
                <div className="text-[11px] text-slate-500">Anti-spam measure requiring Ghanaian phone</div>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.require_phone_for_problem_reports ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, require_phone_for_problem_reports: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Operational Security & Maintenance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Platform Maintenance & Critical Overrides
          </h2>

          <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50/50">
            <div>
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Maintenance Mode (Restricted Access)
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Puts the public portal into read-only mode during emergency updates or national audits
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={formData.maintenance_mode ?? false}
              onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
              className="h-4 w-4 text-amber-600 rounded-sm border-amber-300 focus:ring-amber-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Mandatory Justification Box (Enforced for all setting saves) */}
        {isSuperAdmin && (
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mandatory Audit Justification (Immutable Log Requirement)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Any change to system governance settings is permanently appended to the tamper-evident audit trail with your digital signature.
            </p>

            <textarea
              rows={2}
              required
              placeholder="State the statutory reason, executive directive, or security necessity for this configuration modification (minimum 5 characters)..."
              value={justificationReason}
              onChange={(e) => setJustificationReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="default"
                disabled={saving || justificationReason.trim().length < 5}
                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Applying & Recording Audit...' : 'Save & Record Configuration'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
