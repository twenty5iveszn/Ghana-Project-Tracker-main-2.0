import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { ProjectReport } from '../../types/project';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Alert } from '../ui/alert';
import {
  AlertOctagon,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ReportsModerationQueue: React.FC = () => {
  const { profile, token } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Resolution Action Modal State
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED' | 'REJECTED' | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);

      const res = await fetch(`/api/reports?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, severityFilter, profile?.region_id, profile?.district_id]);

  const handleQuickStatusChange = async (reportId: string, newStatus: string, notes?: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...data.data } : r)));
      }
    } catch (err) {
      console.error('Failed to update report status:', err);
    }
  };

  const handleConfirmResolution = async () => {
    if (!activeReport || !resolutionAction) return;
    try {
      setSubmittingAction(true);
      await handleQuickStatusChange(activeReport.id, resolutionAction, resolutionNotes);
      setActiveReport(null);
      setResolutionAction(null);
      setResolutionNotes('');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.project_title && r.project_title.toLowerCase().includes(q)) ||
      (r.report_type && r.report_type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Citizen Issue Reports & Moderation
            </h1>
            <Badge className="bg-rose-700 text-white font-mono text-xs">
              {filteredReports.length} REPORTS
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Community feedback, non-delivery reports, safety hazards, and corruption alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Reports' },
            { id: 'OPEN', label: 'Open' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: 'REJECTED', label: 'Dismissed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by project, keyword, description..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
            Loading community reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-700 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No matching reports found</div>
            <p className="text-xs text-slate-500">No community complaints match your filter criteria.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          report.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : report.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {report.severity}
                      </Badge>

                      <Badge variant="secondary" className="text-[11px] font-bold">
                        {report.report_type.replace(/_/g, ' ')}
                      </Badge>

                      <span className="text-xs font-bold text-slate-900">
                        {report.project_title || 'Project Report'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                      {report.description}
                    </p>

                    {report.resolution_notes && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Official Resolution:</strong> {report.resolution_notes}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>Submitted: {formatDate(report.created_at)}</span>
                      <span>•</span>
                      <span>By: {report.is_anonymous ? 'Anonymous Citizen' : report.submitter_name || 'Citizen'}</span>
                      {report.location_description && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {report.location_description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2.5 py-1 ${
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : report.status === 'UNDER_REVIEW'
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                          : report.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : report.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {report.status}
                    </Badge>

                    {report.status !== 'RESOLVED' && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {report.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickStatusChange(report.id, 'ACKNOWLEDGED')}
                            className="text-[11px] h-7 px-2.5 text-amber-800 hover:bg-amber-50"
                          >
                            Acknowledge
                          </Button>
                        )}

                        {report.status !== 'UNDER_REVIEW' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickStatusChange(report.id, 'UNDER_REVIEW')}
                            className="text-[11px] h-7 px-2.5 text-indigo-800 hover:bg-indigo-50"
                          >
                            Investigate
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveReport(report);
                            setResolutionAction('RESOLVED');
                          }}
                          className="text-[11px] h-7 px-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                        >
                          Resolve
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveReport(report);
                            setResolutionAction('REJECTED');
                          }}
                          className="text-[11px] h-7 px-2 text-rose-700 hover:bg-rose-50"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resolution Notes Modal */}
      {activeReport && resolutionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-800" />
              {resolutionAction === 'RESOLVED' ? 'Confirm Resolution' : 'Dismiss Citizen Report'}
            </h3>
            <p className="text-xs text-slate-500">
              Provide an official statutory justification notes explaining the outcome of this citizen complaint.
            </p>

            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g., Municipal engineers visited the site on 12/03. Contractor replaced the defective culvert with certified pre-cast concrete units..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveReport(null);
                  setResolutionAction(null);
                }}
                disabled={submittingAction}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleConfirmResolution}
                disabled={submittingAction}
                className={
                  resolutionAction === 'RESOLVED'
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }
              >
                {submittingAction ? 'Recording...' : `Confirm ${resolutionAction}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
