import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { OperationalAnalyticsData } from '../../types/project';
import { useAuth } from '../../lib/auth/AuthContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Phase9TestModal } from '../public/Phase9TestModal';

export function OperationalAnalyticsDashboard() {
  const [data, setData] = useState<OperationalAnalyticsData | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'year' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhase9Modal, setShowPhase9Modal] = useState(false);
  const { token: authToken } = useAuth();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authToken || 'simulated-super_admin-token';
      const res = await fetch(`/api/admin/analytics?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to fetch operational analytics');
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, authToken]);

  const handleExport = (resource: string) => {
    const token = authToken || 'simulated-super_admin-token';
    window.open(`/api/admin/export?resource=${resource}&token=${token}`, '_blank');
  };

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `GHS ${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `GHS ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `GHS ${(val / 1_000).toFixed(0)}K`;
    return `GHS ${val.toLocaleString()}`;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Compiling Operational Analytics...</p>
        <p className="text-xs text-slate-500 mt-1">Aggregating cross-regional project indicators & verification metrics</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <h3 className="text-base font-bold">Analytics Compilation Error</h3>
        </div>
        <p className="text-sm text-rose-700">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="mt-4 text-xs font-semibold">
          Retry Aggregation
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Controls & Jurisdiction Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Phase 9 • Advanced Spatial Analytics & Quality Assurance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            National Infrastructure Command Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{data.jurisdiction_label}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {(
              [
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: 'Quarter' },
                { id: 'year', label: 'Year' },
                { id: 'all', label: 'All-Time' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  range === opt.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhase9Modal(true)}
            className="h-9 px-3 text-xs gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Run Phase 9 Tests</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="h-9 px-3 text-xs gap-1.5 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleExport('projects')}
            className="h-9 px-3 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Allocated Public Budget</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              GHS
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(data.summary.total_budget)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Across {data.summary.total_projects} projects</span>
            <span className="text-emerald-700 font-semibold">100% gazetted</span>
          </div>
        </div>

        {/* Active & Commissioned */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Execution Velocity</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.summary.ongoing_projects}{' '}
            <span className="text-sm font-semibold text-slate-500">Active</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">
              {data.summary.completed_projects} Completed
            </span>
            <span className="text-amber-700 font-semibold">
              {data.summary.abandoned_or_suspended} Suspended
            </span>
          </div>
        </div>

        {/* Physical Delivery Index */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg. Physical Delivery</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.summary.average_progress}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, data.summary.average_progress)}%` }}
            />
          </div>
        </div>

        {/* Verification & Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Verification Pipeline</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div>
              <div className="text-lg font-bold text-purple-700">
                {data.summary.evidence_verified_rate}%
              </div>
              <div className="text-[11px] text-slate-500">Evidence Verified</div>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-700">
                {data.summary.critical_reports_count}
              </div>
              <div className="text-[11px] text-slate-500">Critical Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* DATA QUALITY & COMPLETENESS AUDIT (Phase 9) */}
      {data.data_quality_metrics && (
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                Data Quality & Metadata Completeness Audit
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Phase 9 Continuous Validation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400">Missing Coordinates</div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {data.data_quality_metrics.missing_coordinates}
              </div>
              <div className="text-[10px] text-slate-400">Awaiting GPS field survey</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400">Unassigned Contractors</div>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {data.data_quality_metrics.missing_contractor}
              </div>
              <div className="text-[10px] text-slate-400">Procurement pending registration</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400">Zero Progress Ongoing</div>
              <div className="text-xl font-bold text-purple-400 mt-1">
                {data.data_quality_metrics.zero_progress_ongoing}
              </div>
              <div className="text-[10px] text-slate-400">Active status with 0% progress</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400">Past Expected Date</div>
              <div className="text-xl font-bold text-rose-400 mt-1">
                {data.data_quality_metrics.past_expected_completion}
              </div>
              <div className="text-[10px] text-slate-400">Overdue milestone delivery</div>
            </div>
          </div>
        </div>
      )}

      {/* Middle Grid: Projects by Region & Sector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Progress & Allocation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Regional Allocation & Delivery</h2>
              <p className="text-xs text-slate-500">Projects, budget, and average completion across regions</p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              {data.projects_by_region.length} Regions Active
            </Badge>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {data.projects_by_region.map((reg) => (
              <div key={reg.region_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-800">{reg.region_name}</span>
                  <span className="text-xs font-mono font-semibold text-emerald-800">
                    {formatCurrency(reg.total_budget)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{reg.count} project{reg.count === 1 ? '' : 's'} registered</span>
                  <span className="font-semibold text-slate-700">{reg.average_progress}% delivered</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, reg.average_progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by Category & Sector */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sectoral Budget Breakdown</h2>
              <p className="text-xs text-slate-500">Capital volume by development classification</p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              {data.projects_by_category.length} Sectors
            </Badge>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {data.projects_by_category.map((cat) => {
              const budgetPercent = data.summary.total_budget > 0
                ? Math.round((cat.total_budget / data.summary.total_budget) * 100)
                : 0;

              return (
                <div key={cat.category_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{cat.category_name}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {formatCurrency(cat.total_budget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>{cat.count} verified undertakings</span>
                    <span>{budgetPercent}% of total</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, budgetPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PROJECTS REQUIRING OPERATIONAL ATTENTION (Phase 9 Diagnostic Engine) */}
      {data.projects_requiring_attention && data.projects_requiring_attention.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Projects Requiring Operational Attention ({data.projects_requiring_attention.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">Continuous risk & delay diagnostics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Region & District</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Diagnostic Flags</th>
                  <th className="py-2.5 px-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.projects_requiring_attention.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block max-w-sm truncate">
                        {proj.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {proj.region_name} • {proj.district_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-slate-700 capitalize">
                        {proj.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {proj.progress}%
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                        {proj.reason}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          proj.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : proj.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {proj.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification & Compliance Status Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verification Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Project Status Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Current phase of monitored undertakings</p>

          <div className="space-y-2.5">
            {data.projects_by_status.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : item.status === 'ONGOING'
                        ? 'bg-blue-500'
                        : item.status === 'PLANNED'
                        ? 'bg-sky-500'
                        : item.status === 'ON_HOLD'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-semibold text-slate-700 capitalize">
                    {item.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Citizen Reports Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Civic Reports by Severity</h2>
          <p className="text-xs text-slate-500 mb-4">Community alert and escalation classifications</p>

          <div className="space-y-2.5">
            {data.reports_by_severity.map((item) => (
              <div key={item.severity} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-600'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-600'
                        : item.severity === 'MEDIUM'
                        ? 'bg-blue-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-semibold text-slate-700">{item.severity}</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{item.count} reported</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photographic Evidence Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Evidence Verification</h2>
          <p className="text-xs text-slate-500 mb-4">Site photo and video review pipeline</p>

          <div className="space-y-2.5">
            {data.evidence_by_status.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.status === 'VERIFIED'
                        ? 'bg-emerald-500'
                        : item.status === 'PENDING'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-semibold text-slate-700 capitalize">
                    {item.status.toLowerCase()}
                  </span>
                </div>
                <span className="font-bold font-mono text-slate-900">{item.count} assets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase 9 Automated Test Suite Modal */}
      <Phase9TestModal
        isOpen={showPhase9Modal}
        onClose={() => setShowPhase9Modal(false)}
      />
    </div>
  );
}
