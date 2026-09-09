import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  FolderKanban,
  AlertOctagon,
  Image as ImageIcon,
  ScrollText,
  Users,
  CheckCircle2,
  Lock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function DataExportCenter() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const { role, profile, token: authToken } = useAuth();
  const isPrivileged = role === 'SUPER_ADMIN' || role === 'NATIONAL_MONITOR';

  const datasets = [
    {
      id: 'projects',
      title: 'Infrastructure Projects Master Registry',
      description: 'Comprehensive dataset containing all project milestones, allocated budgets, verified progress percentages, contractors, and geographic coordinates.',
      icon: FolderKanban,
      format: 'CSV (.csv)',
      frequency: 'Real-time',
      roleRequirement: 'MMDCE Officers, Regional Officers, National Monitors, Super Admins',
      accessible: true,
    },
    {
      id: 'reports',
      title: 'Citizen Problem & Defect Reports',
      description: 'Public alerts, stalled work reports, quality concerns, and safety inquiries filed by citizens with severity classifications and review statuses.',
      icon: AlertOctagon,
      format: 'CSV (.csv)',
      frequency: 'Real-time',
      roleRequirement: 'MMDCE Officers, Regional Officers, National Monitors, Super Admins',
      accessible: true,
    },
    {
      id: 'evidence',
      title: 'Field Photographic Evidence Ledger',
      description: 'Metadata records of all geotagged site photographs, inspection documents, verification stamps, and reviewing officer notes.',
      icon: ImageIcon,
      format: 'CSV (.csv)',
      frequency: 'Real-time',
      roleRequirement: 'MMDCE Officers, Regional Officers, National Monitors, Super Admins',
      accessible: true,
    },
    {
      id: 'audit_logs',
      title: 'Immutable Platform Audit Trail',
      description: 'Cryptographically ordered log of every verification decision, status transition, role elevation, and administrative action.',
      icon: ScrollText,
      format: 'CSV (.csv)',
      frequency: 'Immutable Append-Only',
      roleRequirement: 'Super Administrators & National Monitors Only',
      accessible: isPrivileged,
    },
    {
      id: 'users',
      title: 'Authorized Personnel & Jurisdictions Directory',
      description: 'Export of verified MMDCE officers, regional monitors, and civic moderators with assigned MMDA jurisdictions (sensitive credentials excluded).',
      icon: Users,
      format: 'CSV (.csv)',
      frequency: 'Live Registry',
      roleRequirement: 'Super Administrators & National Monitors Only',
      accessible: isPrivileged,
    },
  ];

  const handleDownload = async (resourceId: string, title: string) => {
    setDownloading(resourceId);
    setExportError(null);
    setExportSuccess(null);

    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch(`/api/admin/export?resource=${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to export ${title}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `ghanabuild_${resourceId}_export.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(`Successfully downloaded ${title} (${filename})`);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Error generating export file');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Phase 8 • Open Data & Parliamentary Accountability
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Official Data Export Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Download verified datasets for parliamentary oversight, academic research, and public accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
          <div>
            <div className="font-bold text-slate-800">Automatic Jurisdiction Scoping</div>
            <div className="text-[11px] text-slate-500">
              {role === 'MMDCE_OFFICER'
                ? 'Exports restricted to assigned MMDA District'
                : role === 'REGIONAL_OFFICER'
                ? 'Exports restricted to assigned Region'
                : 'Nationwide oversight export enabled'}
            </div>
          </div>
        </div>
      </div>

      {exportError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {exportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {datasets.map((item) => {
          const Icon = item.icon;
          const isCurrentLoading = downloading === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                item.accessible
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200/60 bg-slate-50/40 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {item.format}
                    </Badge>
                    {!item.accessible && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        Restricted
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Access: </span>
                  {item.roleRequirement}
                </div>

                <Button
                  variant={item.accessible ? 'default' : 'outline'}
                  size="sm"
                  disabled={!item.accessible || isCurrentLoading}
                  onClick={() => handleDownload(item.id, item.title)}
                  className={`text-xs gap-1.5 font-semibold h-8 shrink-0 ${
                    item.accessible
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isCurrentLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Generating CSV...
                    </>
                  ) : item.accessible ? (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Download CSV
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Super Admin Only
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
