import React, { useState, useEffect } from 'react';
import { CommunityReportSummary, ProjectReport } from '../../../types/project';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAuth } from '../../../lib/auth/AuthContext';
import { SubmitReportModal } from './SubmitReportModal';
import {
  MessageSquareWarning,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Clock,
  MapPin,
  Check,
  X,
  UserCheck,
} from 'lucide-react';

interface CommunityReportsSummaryProps {
  projectId: string;
  projectTitle: string;
  onNavigate: (path: string) => void;
}

export const CommunityReportsSummary: React.FC<CommunityReportsSummaryProps> = ({
  projectId,
  projectTitle,
  onNavigate,
}) => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<CommunityReportSummary | null>(null);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Resolution state for officers
  const [selectedReportForResolve, setSelectedReportForResolve] = useState<ProjectReport | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'UNDER_REVIEW' | 'REJECTED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const isOfficer =
    user && ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'].includes(user.role);

  const fetchSummaryAndReports = () => {
    setLoading(true);

    // Fetch summary
    fetch(`/api/projects/${projectId}/reports-summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data);
        }
      })
      .catch(() => {});

    // Fetch authorized reports list if logged in
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/projects/${projectId}/reports`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummaryAndReports();
  }, [projectId, token]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForResolve) return;
    if (resolutionNotes.trim().length < 5) {
      setResolveError('Resolution notes must be at least 5 characters long.');
      return;
    }

    setResolving(true);
    setResolveError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/reports/${selectedReportForResolve.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: resolutionStatus,
          resolution_notes: resolutionNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Resolution failed');
      }

      setSelectedReportForResolve(null);
      setResolutionNotes('');
      fetchSummaryAndReports();
    } catch (err: any) {
      setResolveError(err.message || 'Failed to update report status');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px]">RESOLVED</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">UNDER REVIEW</Badge>;
      case 'REJECTED':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px]">DISMISSED</Badge>;
      default:
        return <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-[10px]">OPEN</Badge>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">MEDIUM</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-500 text-white">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-amber-600" />
            Citizen Oversight & Community Observations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated reports submitted by residents, local motorists, and civil society monitors.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => setIsSubmitModalOpen(true)}
          className="text-xs font-bold gap-1.5 text-slate-950 shrink-0"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-900" />
          Report an Issue on Site
        </Button>
      </div>

      {loading ? (
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      ) : !summary || summary.total_reports === 0 ? (
        <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-start gap-4">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-950">No Community Issues Reported</h3>
            <p className="text-xs text-emerald-900 leading-relaxed">
              There are currently no active public alerts, safety hazards, or quality grievances
              registered for this project.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
                className="text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50"
              >
                Submit Citizen Observation &rarr;
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Citizen Observations
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {summary.total_reports}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Audited community tickets</div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Resolved by Authority
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {summary.resolved_reports}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Site remediation verified by MMDA/RCC
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Active / Under Investigation
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {summary.open_reports}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Assigned to field inspector</div>
            </div>
          </div>

          {/* Breakdown by issue category */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Issue Classification Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.entries(summary.by_type).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[11px] font-medium truncate">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports List for Authenticated Users / Officers */}
      {reports.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {isOfficer ? 'Authorized Municipal Incident Reports' : 'My Filed Community Reports'}
            </h3>
            <span className="text-xs text-slate-400">{reports.length} report(s)</span>
          </div>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {report.id}
                      </span>
                      {getStatusBadge(report.status)}
                      {getSeverityBadge(report.severity)}
                      <span className="text-xs font-bold text-slate-800">
                        {report.report_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {report.description}
                    </p>

                    {report.location_notes && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{report.location_notes}</span>
                      </div>
                    )}

                    {report.resolution_notes && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 mt-2 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Official MMDA Resolution Note
                        </div>
                        <p className="text-xs">{report.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Officer Action */}
                  {isOfficer && (
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReportForResolve(report)}
                        className="text-xs font-bold gap-1 text-slate-700 border-slate-300"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                        Manage Ticket
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Submission Modal */}
      <SubmitReportModal
        projectId={projectId}
        projectTitle={projectTitle}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onReportCreated={fetchSummaryAndReports}
      />

      {/* Officer Resolution Modal */}
      {selectedReportForResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Resolve Citizen Ticket</h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedReportForResolve.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedReportForResolve(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Updated Report Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="RESOLVED">RESOLVED (Remediation Completed)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Field Team Dispatched)</option>
                  <option value="REJECTED">REJECTED (Invalid or Duplicate)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official MMDA Resolution Note *
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail actions taken by the Municipal Assembly (e.g. contractor instructed to fix drainage culvert within 48 hours)..."
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {resolveError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {resolveError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReportForResolve(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resolving || resolutionNotes.trim().length < 5}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {resolving ? 'Submitting...' : 'Save Resolution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
