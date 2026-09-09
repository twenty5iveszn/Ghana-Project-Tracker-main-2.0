import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Alert } from '../ui/alert';
import {
  FolderKanban,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  AlertOctagon,
  Image as ImageIcon,
  MessageSquare,
  ScrollText,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  MapPin,
  Building2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AdminMetricsData } from '../../types/project';
import { formatDate } from '../../lib/utils';

interface AdminDashboardOverviewProps {
  onNavigateSection: (section: string) => void;
  onOpenPhase7Tests: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigateSection,
  onOpenPhase7Tests,
}) => {
  const { profile, role, token } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [role, profile?.region_id, profile?.district_id]);

  const jurisdictionLabel =
    metrics?.jurisdiction_scope.label ||
    (role === 'MMDCE_OFFICER'
      ? `District Authority: ${profile?.district_id || 'Assigned MMDCE'}`
      : role === 'REGIONAL_OFFICER'
      ? `Regional Authority: ${profile?.region_id || 'Assigned RCC'}`
      : 'National Monitoring Authority (All 16 Regions)');

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header Authority Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Oversight & Verification Dashboard
            </h1>
            <Badge className="bg-emerald-800 text-white font-mono text-xs px-2.5 py-0.5">
              PHASE 7 ACTIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>
              Operating Jurisdiction:{' '}
              <strong className="text-slate-900 font-semibold">{jurisdictionLabel}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onOpenPhase7Tests}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 font-semibold"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Run Phase 7 Security Audit
          </Button>
        </div>
      </div>

      {/* Main Metric Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Projects */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Submissions Awaiting Review
              </CardDescription>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 mt-1">
              {loading ? (
                '...'
              ) : (
                (metrics?.projects.pending || 0) + (metrics?.projects.under_review || 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>{metrics?.projects.pending || 0} Pending</span>
              <span>•</span>
              <span>{metrics?.projects.under_review || 0} Under Review</span>
              <span>•</span>
              <span>{metrics?.projects.request_changes || 0} Need Changes</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('submissions')}
              className="w-full text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 justify-between h-8"
            >
              Open Verification Queue
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Metric 2: Open Citizen Issue Reports */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Community Issue Reports
              </CardDescription>
              <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                <AlertOctagon className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : (metrics?.reports.open || 0) + (metrics?.reports.under_review || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span className="text-rose-600 font-semibold">
                {metrics?.reports.critical_or_high || 0} High/Critical
              </span>
              <span>•</span>
              <span>{metrics?.reports.resolved || 0} Resolved</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('reports')}
              className="w-full text-xs font-semibold text-slate-800 hover:bg-slate-50 justify-between h-8"
            >
              Investigate Reports
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Metric 3: Site Evidence Queue */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Site Evidence Submissions
              </CardDescription>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : metrics?.evidence.pending || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span className="text-emerald-700 font-semibold">
                {metrics?.evidence.verified || 0} Verified
              </span>
              <span>•</span>
              <span>{metrics?.evidence.total || 0} Total Assets</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('evidence')}
              className="w-full text-xs font-semibold text-slate-800 hover:bg-slate-50 justify-between h-8"
            >
              Moderate Photos/Videos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Metric 4: Moderated Comments & Civic Engagement */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Flagged Comments
              </CardDescription>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : metrics?.comments.flagged || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>{metrics?.comments.published || 0} Published</span>
              <span>•</span>
              <span>{metrics?.civic_votes_total || 0} Votes Cast</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('comments')}
              className="w-full text-xs font-semibold text-slate-800 hover:bg-slate-50 justify-between h-8"
            >
              Moderate Comments
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Immutable Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Action Hub */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-800" />
                Administrative Command
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authorized actions under {role || 'OFFICER'} credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <button
                onClick={() => onNavigateSection('submissions')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-emerald-100 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Project Verification Queue</div>
                    <div className="text-[11px] text-slate-500">Review & approve project dossiers</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {(metrics?.projects.pending || 0) + (metrics?.projects.under_review || 0)}
                </Badge>
              </button>

              <button
                onClick={() => onNavigateSection('projects')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 text-slate-800 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Projects Registry</div>
                    <div className="text-[11px] text-slate-500">View and edit all projects</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {metrics?.projects.total || 0}
                </Badge>
              </button>

              <button
                onClick={() => onNavigateSection('reports')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-rose-100 text-rose-800 group-hover:bg-rose-800 group-hover:text-white transition-colors">
                    <AlertOctagon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Citizen Reports Queue</div>
                    <div className="text-[11px] text-slate-500">Resolve community complaints</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-rose-700">
                  {metrics?.reports.open || 0} open
                </Badge>
              </button>

              <button
                onClick={() => onNavigateSection('audit-logs')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Immutable Audit Trail</div>
                    <div className="text-[11px] text-slate-500">Inspect historical changes</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          {/* Verification Protocol Notice */}
          <Alert variant="info" title="Verification Standard & Trust Matrix">
            Decisions recorded on this portal are published directly to the public registry. All status updates require statutory justification and are permanently archived to the immutable audit log.
          </Alert>
        </div>

        {/* Right Column: Recent Audited Action Stream */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-amber-700" />
                  Recent Verification & Oversight Activity
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Live feed of immutable administrative decisions
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection('audit-logs')}
                className="text-xs gap-1"
              >
                View Full Log
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading verification activity...
                </div>
              ) : !metrics?.recent_audits || metrics.recent_audits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No recent verification activity recorded in this jurisdiction.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                  {metrics.recent_audits.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-slate-800">
                              {item.action}
                            </span>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {item.entity_type}
                            </Badge>
                          </div>
                          {item.reason && (
                            <p className="text-xs text-slate-600 line-clamp-1 italic">
                              "{item.reason}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Actor: {item.user_email || 'System Officer'}</span>
                            <span>•</span>
                            <span>Target: {item.entity_id}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
