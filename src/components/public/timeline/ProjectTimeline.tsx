import React, { useState, useEffect } from 'react';
import { ProjectStatus, ProjectTimelineUpdate } from '../../../types/project';
import { StatusBadge } from '../../ui/status-badge';
import { Button } from '../../ui/button';
import { AddTimelineUpdateModal } from './AddTimelineUpdateModal';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface ProjectTimelineProps {
  projectId: string;
  projectTitle: string;
  currentProgress: number;
  currentStatus: ProjectStatus;
  projectRegionId?: string;
  projectDistrictId?: string;
  onProjectUpdated?: () => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  projectId,
  projectTitle,
  currentProgress,
  currentStatus,
  projectRegionId,
  projectDistrictId,
  onProjectUpdated,
}) => {
  const { role, profile } = useAuth();
  const [updates, setUpdates] = useState<ProjectTimelineUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isPrivilegedOfficer =
    Boolean(profile) &&
    (['SUPER_ADMIN', 'NATIONAL_MONITOR'].includes(role) ||
      (role === 'REGIONAL_OFFICER' && profile?.region_id === projectRegionId) ||
      (role === 'MMDCE_OFFICER' && profile?.district_id === projectDistrictId));

  const fetchUpdates = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/updates?page=${pageNum}&limit=5`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch timeline updates');
      }

      setUpdates(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
        setPage(data.pagination.page || 1);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading timeline updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates(page);
  }, [projectId, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-700" />
            Milestone Progress & Execution Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gazetted physical execution milestones and engineering stage sign-offs.
          </p>
        </div>

        {isPrivilegedOfficer && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold text-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Milestone Update
          </Button>
        )}
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No timeline updates recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Official milestone updates will be published as physical excavation, foundation, or
            superstructure work progresses on site.
          </p>
          {isPrivilegedOfficer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Post Initial Milestone
            </Button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/40 space-y-6 my-4">
          {updates.map((item, idx) => (
            <div key={item.id} className="relative group">
              {/* Timeline Pin */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-6 w-6 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-600" />
              </div>

              {/* Update Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 font-mono">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item.progress_percentage}% Executed</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(item.created_at)}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.created_by_name || 'Designated MMDA Engineer'}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({totalCount} total milestone records)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AddTimelineUpdateModal
        isOpen={isAddModalOpen}
        projectId={projectId}
        projectTitle={projectTitle}
        currentProgress={currentProgress}
        currentStatus={currentStatus}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchUpdates(1);
          if (onProjectUpdated) onProjectUpdated();
        }}
      />
    </div>
  );
};
