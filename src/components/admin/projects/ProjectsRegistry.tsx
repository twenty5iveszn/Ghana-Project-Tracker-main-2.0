import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { StatusBadge } from '../../ui/status-badge';
import { VerificationBadge } from '../../ui/verification-badge';
import { Alert } from '../../ui/alert';
import { Card, CardContent } from '../../ui/card';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Building2,
  MapPin,
  Coins,
  Calendar,
  Clock,
  Archive,
  Eye,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Project, ProjectStatus, VerificationStatus } from '../../../types/project';
import { RegionData, DistrictData } from '../../../types/geography';
import { formatGHS, formatDate } from '../../../lib/utils';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';
import { ContractorManagementModal } from './ContractorManagementModal';
import { ProjectSecurityTestModal } from './ProjectSecurityTestModal';

export const ProjectsRegistry: React.FC = () => {
  const { profile, role, canAccessProject } = useAuth();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedVerification, setSelectedVerification] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'budget' | 'progress_percentage' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Metadata dropdowns
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [contractorModalOpen, setContractorModalOpen] = useState(false);
  const [securityTestModalOpen, setSecurityTestModalOpen] = useState(false);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);
  const [archiveReason, setArchiveReason] = useState('Completed administrative review');
  const [archiving, setArchiving] = useState(false);

  // Notification message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load regions & categories
  useEffect(() => {
    fetch('/api/geography/regions')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegions(d.data);
      });

    fetch('/api/geography/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });
  }, []);

  // Cascading districts when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    fetch(`/api/geography/districts?region_id=${selectedRegion}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDistricts(d.data);
          setSelectedDistrict('');
        }
      });
  }, [selectedRegion]);

  // Fetch Projects List
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedVerification) params.append('verification_status', selectedVerification);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      params.append('sort', sortBy);
      params.append('order', sortOrder);
      params.append('include_all', 'true'); // Admin portal queries all verification statuses

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProjects(data.data);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedRegion,
    selectedDistrict,
    selectedCategory,
    selectedStatus,
    selectedVerification,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const canCreate = role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER' || role === 'MMDCE_OFFICER';

  // Handle Archive Confirmation
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/projects/${archiveTarget.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to archive project');
      }

      setNotification({
        type: 'success',
        message: `Project ${archiveTarget.title} was archived successfully.`,
      });
      setArchiveTarget(null);
      fetchProjects();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to archive project',
      });
    } finally {
      setArchiving(false);
    }
  };

  // Metrics summary
  const ongoingCount = projects.filter((p) => p.project_status === 'ONGOING').length;
  const completedCount = projects.filter((p) => p.project_status === 'COMPLETED').length;
  const totalBudgetGHS = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const pendingCount = projects.filter((p) => p.verification_status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Notifications */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'error'}
          title={notification.type === 'success' ? 'Action Completed' : 'Operation Failed'}
        >
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Public Infrastructure Projects Registry
            </h1>
            <Badge className="bg-emerald-800 text-white text-xs font-mono">PHASE 3</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete administrative tracking, lifecycle states, contractor assignments, and milestone auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSecurityTestModalOpen(true)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs gap-1.5 font-bold"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Phase 3 Security Suite (17 Tests)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setContractorModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Building2 className="h-4 w-4" />
            Contractors Registry
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Register Project
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Projects
          </div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">{pendingCount} pending verification</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Ongoing Sites
          </div>
          <div className="text-2xl font-black text-amber-700 mt-0.5">{ongoingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active civil execution</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Completed Works
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-0.5">{completedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Handed over to public</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Visible Budget Allocation
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5 font-mono truncate">
            {formatGHS(totalBudgetGHS)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In Ghanaian Cedis (GHS)</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, contractor, site..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PLANNED">PLANNED</option>
              <option value="ONGOING">ONGOING</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ABANDONED">ABANDONED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {/* Verification Status Filter */}
            <select
              value={selectedVerification}
              onChange={(e) => {
                setSelectedVerification(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Verification</option>
              <option value="PENDING">PENDING</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="created_at">Sort: Created Date</option>
              <option value="budget">Sort: Budget</option>
              <option value="progress_percentage">Sort: Progress %</option>
              <option value="title">Sort: Project Title</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedRegion('');
                setSelectedDistrict('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedVerification('');
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Region & District Cascading Filters */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Geographic Filter:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
          >
            <option value="">All 16 Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {selectedRegion && (
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
            >
              <option value="">All District Assemblies in Region</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto text-slate-400 text-[11px]">
            Showing {projects.length} of {totalCount} records
          </div>
        </div>
      </div>

      {/* Projects Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-700" />
            <span>Loading verified infrastructure database...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No projects matched your criteria. Try adjusting your search query or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Project & Category</th>
                  <th className="p-4">Location & Assembly</th>
                  <th className="p-4">Contractor</th>
                  <th className="p-4">Approved Budget</th>
                  <th className="p-4">Physical Progress</th>
                  <th className="p-4">Status & Review</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const hasJurisdiction = canAccessProject(p.region_id, p.district_id);
                  const isArchived = p.verification_status === 'ARCHIVED';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isArchived ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Title & Category */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {p.id}
                          </span>
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {p.category?.name || p.category_id}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{p.location_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            {p.district?.name || p.district_id}, {p.region?.name || p.region_id}
                          </span>
                        </div>
                      </td>

                      {/* Contractor */}
                      <td className="p-4">
                        <div className="font-medium text-slate-900">
                          {p.contractor?.name || (
                            <span className="text-slate-400 italic">Unassigned / Tender</span>
                          )}
                        </div>
                        {p.contractor?.registration_number && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {p.contractor.registration_number}
                          </div>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {formatGHS(p.budget)}
                      </td>

                      {/* Progress */}
                      <td className="p-4">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono font-bold">
                          <span>{p.progress_percentage}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.progress_percentage >= 100
                                ? 'bg-emerald-600'
                                : p.progress_percentage > 50
                                ? 'bg-emerald-700'
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${p.progress_percentage}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 space-y-1">
                        <div>
                          <StatusBadge status={p.project_status} />
                        </div>
                        <div>
                          <VerificationBadge status={p.verification_status} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Drawer */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveProject(p);
                              setDetailsDrawerOpen(true);
                            }}
                            className="h-8 px-2 text-xs gap-1"
                            title="View full project details and historical timeline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>

                          {/* Edit Project (Jurisdiction-Guarded) */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasJurisdiction || isArchived}
                            onClick={() => {
                              setActiveProject(p);
                              setEditModalOpen(true);
                            }}
                            className="h-8 px-2 text-xs gap-1 border-slate-300"
                            title={
                              hasJurisdiction
                                ? 'Edit project parameters'
                                : 'Editing restricted to authorized jurisdiction officers'
                            }
                          >
                            {hasJurisdiction ? (
                              <FileEdit className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Lock className="h-3 w-3 text-slate-400" />
                            )}
                            Edit
                          </Button>

                          {/* Archive Soft-Delete */}
                          {!isArchived && hasJurisdiction && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchiveTarget(p)}
                              className="h-8 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Soft delete / Archive project"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 bg-white"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 font-mono font-bold text-slate-700 bg-slate-100 rounded">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {createModalOpen && (
        <CreateProjectModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            fetchProjects();
            setNotification({
              type: 'success',
              message: 'Public infrastructure project created and audited successfully.',
            });
          }}
          onOpenContractorModal={() => setContractorModalOpen(true)}
        />
      )}

      {editModalOpen && activeProject && (
        <EditProjectModal
          isOpen={editModalOpen}
          project={activeProject}
          onClose={() => {
            setEditModalOpen(false);
            setActiveProject(null);
          }}
          onSuccess={() => {
            fetchProjects();
            setNotification({
              type: 'success',
              message: 'Project record updated and audited.',
            });
          }}
        />
      )}

      {detailsDrawerOpen && activeProject && (
        <ProjectDetailsDrawer
          isOpen={detailsDrawerOpen}
          project={activeProject}
          onClose={() => {
            setDetailsDrawerOpen(false);
            setActiveProject(null);
          }}
          onEdit={() => {
            setDetailsDrawerOpen(false);
            setEditModalOpen(true);
          }}
          onRefreshProject={() => {
            fetchProjects();
          }}
        />
      )}

      {contractorModalOpen && (
        <ContractorManagementModal
          isOpen={contractorModalOpen}
          onClose={() => setContractorModalOpen(false)}
        />
      )}

      {securityTestModalOpen && (
        <ProjectSecurityTestModal
          isOpen={securityTestModalOpen}
          onClose={() => setSecurityTestModalOpen(false)}
        />
      )}

      {/* Archive Confirmation Dialog */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <Archive className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Archive Project (Soft Delete)</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to archive <strong>{archiveTarget.title}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              The project status will become <strong>ARCHIVED</strong> and will be hidden from default
              public listings. The record and its complete audit history are preserved.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Archiving
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                placeholder="e.g. Contract terminated / superseded by project PRJ-009"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmArchive}
                disabled={archiving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {archiving ? 'Archiving...' : 'Confirm Archiving'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
