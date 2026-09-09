import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { StatusBadge } from '../../ui/status-badge';
import { VerificationBadge } from '../../ui/verification-badge';
import { Alert } from '../../ui/alert';
import {
  X,
  MapPin,
  Building2,
  Calendar,
  Coins,
  Clock,
  Send,
  PlusCircle,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Project, ProjectStatus } from '../../../types/project';
import { formatGHS, formatDate } from '../../../lib/utils';
import { createProjectUpdateSchema } from '../../../lib/validation/project';

interface ProjectUpdateRecord {
  id: string;
  project_id: string;
  title: string;
  description: string;
  progress_percentage: number;
  status: ProjectStatus;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

interface AuditLogRecord {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

interface ProjectDetailsDrawerProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit?: () => void;
  onRefreshProject?: () => void;
}

export const ProjectDetailsDrawer: React.FC<ProjectDetailsDrawerProps> = ({
  isOpen,
  project,
  onClose,
  onEdit,
  onRefreshProject,
}) => {
  const { profile, role, canAccessProject } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'audit'>('timeline');
  const [updates, setUpdates] = useState<ProjectUpdateRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // New update form state
  const [showAddUpdateForm, setShowAddUpdateForm] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [updateProgress, setUpdateProgress] = useState(project?.progress_percentage.toString() || '0');
  const [updateStatus, setUpdateStatus] = useState<ProjectStatus>(project?.project_status || 'ONGOING');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    if (!project) return;
    setLoadingUpdates(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/updates`);
      const data = await res.json();
      if (data.success) {
        setUpdates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const fetchAudit = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/geography/audit-logs?entity_id=${project.id}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit:', err);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchUpdates();
      fetchAudit();
      setUpdateProgress(project.progress_percentage.toString());
      setUpdateStatus(project.project_status);
      setShowAddUpdateForm(false);
      setUpdateError(null);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const hasJurisdiction = canAccessProject(project.region_id, project.district_id);
  const canPostUpdate =
    (role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER' || role === 'MMDCE_OFFICER') &&
    hasJurisdiction;

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);

    const payload = {
      title: updateTitle,
      description: updateDesc,
      progress_percentage: Number(updateProgress),
      status: updateStatus,
    };

    const val = createProjectUpdateSchema.safeParse(payload);
    if (!val.success) {
      setUpdateError('Please check update title, description, and progress values.');
      return;
    }

    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to post update');
      }

      setUpdateTitle('');
      setUpdateDesc('');
      setShowAddUpdateForm(false);
      fetchUpdates();
      fetchAudit();
      if (onRefreshProject) onRefreshProject();
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Error posting update');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded">
                {project.id}
              </span>
              <StatusBadge status={project.project_status} />
              <VerificationBadge status={project.verification_status} />
            </div>
            <h2 className="text-lg font-bold leading-snug">{project.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                {project.location_name} • {project.district?.name || project.district_id},{' '}
                {project.region?.name || project.region_id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'timeline'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            Milestone Timeline ({updates.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'details'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Project Details & Specifications
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* TAB 1: TIMELINE & UPDATES */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">Verified Physical Progress</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {project.progress_percentage}% Complete
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Action Bar for Adding Updates */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Historical Chronological Milestones
                </h3>
                {canPostUpdate ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddUpdateForm(!showAddUpdateForm)}
                    className="text-xs gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {showAddUpdateForm ? 'Cancel Form' : 'Post Milestone Update'}
                  </Button>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Official updates restricted to assigned officers
                  </span>
                )}
              </div>

              {/* Add Update Form (Expanded) */}
              {showAddUpdateForm && (
                <form
                  onSubmit={handlePostUpdate}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 animate-in fade-in duration-150"
                >
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4 text-emerald-700" />
                    Post Official Progress Milestone
                  </div>

                  {updateError && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                      {updateError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Update Title / Milestone
                    </label>
                    <input
                      type="text"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="e.g. Sub-base compaction and culvert casting"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Site Observations & Detailed Description
                    </label>
                    <textarea
                      rows={2}
                      value={updateDesc}
                      onChange={(e) => setUpdateDesc(e.target.value)}
                      placeholder="Summary of engineering progress, equipment on site, materials delivered..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Progress (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={updateProgress}
                        onChange={(e) => setUpdateProgress(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Project Status
                      </label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value as ProjectStatus)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="PLANNED">PLANNED</option>
                        <option value="ONGOING">ONGOING</option>
                        <option value="ON_HOLD">ON_HOLD</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="ABANDONED">ABANDONED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddUpdateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingUpdate}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                    >
                      {submittingUpdate ? 'Submitting...' : 'Publish Update'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Updates Timeline List */}
              {loadingUpdates ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading timeline...</div>
              ) : updates.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No milestone updates recorded yet for this project.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
                  {updates.map((u, idx) => (
                    <div key={u.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-emerald-700 border-2 border-white shadow-xs" />

                      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{u.title}</h4>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {u.progress_percentage}%
                            </Badge>
                            <StatusBadge status={u.status} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{u.description}</p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {u.created_by_name || u.created_by}
                          </span>
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-xs">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Project Overview & Scope
                </h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Category</span>
                  <span className="font-bold text-slate-900">
                    {project.category?.name || project.category_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Approved Budget</span>
                  <span className="font-bold text-emerald-800 text-sm font-mono">
                    {formatGHS(project.budget)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Assigned Contractor</span>
                  <span className="font-bold text-slate-900">
                    {project.contractor?.name || 'Unassigned / Open Tender'}
                  </span>
                  {project.contractor?.registration_number && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Reg: {project.contractor.registration_number}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">SEO Slug</span>
                  <span className="font-mono text-[11px] text-slate-600 break-all">
                    {project.slug}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Commencement</span>
                  <span className="font-medium text-slate-800">{formatDate(project.start_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Expected Delivery</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(project.expected_completion_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Actual Commissioned</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(project.actual_completion_date)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">GPS Coordinates</span>
                  <span className="font-mono text-slate-800">
                    {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registered By</span>
                  <span className="font-mono text-slate-800">{project.created_by}</span>
                </div>
              </div>

              {onEdit && (
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button size="sm" onClick={onEdit} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Edit Project Record
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Immutable Audit Log: </strong> Every status change, progress increment,
                  and field revision is cryptographically anchored and audited.
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No audit logs recorded for this entity.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{log.action}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(log.created_at)}</span>
                    </div>
                    {log.reason && <p className="text-slate-600">{log.reason}</p>}
                    <div className="text-[11px] font-mono text-slate-500">
                      Actor: {log.user_email || log.user_id || 'System'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">ID: {project.id}</div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </div>
    </div>
  );
};
