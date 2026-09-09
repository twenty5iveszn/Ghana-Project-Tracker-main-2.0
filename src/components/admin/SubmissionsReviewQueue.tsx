import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Project, VerificationStatus } from '../../types/project';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { VerificationBadge } from '../ui/verification-badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { ProjectVerificationModal } from './ProjectVerificationModal';
import {
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  DollarSign,
  Building2,
  ArrowUpDown,
  ShieldCheck,
} from 'lucide-react';
import { formatGHS, formatDate } from '../../lib/utils';

export const SubmissionsReviewQueue: React.FC = () => {
  const { profile, token, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('NEEDS_REVIEW');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQueue = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (activeTab === 'NEEDS_REVIEW') {
        // Fetch pending or under review
        // In backend listProjects, we can query specifically or filter client-side
      } else if (activeTab !== 'ALL') {
        params.append('verification_status', activeTab);
      }

      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (data.success) {
        let list: Project[] = data.data || [];
        if (activeTab === 'NEEDS_REVIEW') {
          list = list.filter(
            (p) =>
              p.verification_status === 'PENDING' ||
              p.verification_status === 'UNDER_REVIEW' ||
              p.verification_status === 'REQUEST_CHANGES'
          );
        }
        setProjects(list);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || list.length);
      }
    } catch (err) {
      console.error('Failed to fetch submissions queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, page, role, profile?.region_id, profile?.district_id]);

  const handleOpenReview = (proj: Project) => {
    setSelectedProject(proj);
    setIsModalOpen(true);
  };

  const handleVerificationComplete = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    fetchQueue();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Project Verification & Review Queue
            </h1>
            <Badge className="bg-emerald-800 text-white font-mono text-xs">
              {totalCount} DOSSIERS
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Authoritative municipal & regional docket for statutory project verification decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'NEEDS_REVIEW', label: 'Action Required', icon: Clock },
            { id: 'ALL', label: 'All Submissions', icon: FileCheck2 },
            { id: 'PENDING', label: 'Pending Review', icon: Clock },
            { id: 'UNDER_REVIEW', label: 'Under Review', icon: AlertTriangle },
            { id: 'REQUEST_CHANGES', label: 'Changes Requested', icon: AlertTriangle },
            { id: 'VERIFIED', label: 'Verified Official', icon: CheckCircle2 },
            { id: 'REJECTED', label: 'Rejected', icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQueue()}
              placeholder="Search by project title, code (e.g. PRJ-GAR), category, or contractor..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>
          <Button size="sm" onClick={fetchQueue} className="bg-slate-900 hover:bg-slate-800 text-xs">
            Filter
          </Button>
        </div>
      </div>

      {/* Queue Table Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading verification queue...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No project dossiers in this filter</div>
              <p className="text-xs text-slate-500">
                All submissions in your jurisdiction matching this query have been processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Project & Code</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">Budget & Progress</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Authoritative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1 text-sm">
                          {proj.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                          <span>{proj.project_code || proj.id}</span>
                          <span>•</span>
                          <span>{proj.category_name || proj.category_id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{proj.district_name || proj.district_id}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {proj.region_name || proj.region_id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatGHS(proj.budget_allocated)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-700 h-full rounded-full"
                              style={{ width: `${Math.min(100, proj.progress_percentage || 0)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {proj.progress_percentage || 0}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <VerificationBadge status={proj.verification_status} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{formatDate(proj.created_at)}</div>
                        <div className="text-[11px] text-slate-400">
                          by {proj.created_by ? 'Municipal Officer' : 'System'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(proj)}
                          className="text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Review Dossier & Verify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <ProjectVerificationModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
};
