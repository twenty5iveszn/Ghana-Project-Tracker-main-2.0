import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../../types/project';
import { RegionData } from '../../types/geography';
import { StatusBadge } from '../ui/status-badge';
import { VerificationBadge } from '../ui/verification-badge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Search,
  MapPin,
  Building2,
  Calendar,
  Coins,
  Clock,
  Eye,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { formatGHS, formatDate } from '../../lib/utils';
import { ProjectDetailsDrawer } from '../admin/projects/ProjectDetailsDrawer';

export const PublicProjectsDirectory: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

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

  const fetchPublicProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      // Public default: only verified projects
      params.append('verification_status', 'VERIFIED');
      params.append('limit', '50');

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Failed to load public projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProjects();
  }, [search, selectedRegion, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono mb-2">
            Ghana National Infrastructure Transparency
          </Badge>
          <h2 className="text-2xl font-black tracking-tight">Verified Public Projects Directory</h2>
          <p className="text-sm text-slate-300 mt-1">
            Search and inspect officially verified capital infrastructure projects across all 16
            regions of Ghana. Track budgets, contractors, and site milestone updates.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, roads, schools..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Sectors</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">PLANNED</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedRegion('');
              setSelectedCategory('');
              setSelectedStatus('');
            }}
            className="text-xs"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-700" />
          <span>Querying verified infrastructure records...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          No verified projects match your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {project.category?.name || project.category_id}
                  </span>
                  <StatusBadge status={project.project_status} />
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">{project.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {project.location_name} • {project.district?.name || project.district_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Budget Allocation:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {formatGHS(project.budget)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Physical Progress:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {project.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-700 h-full rounded-full"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveProject(project)}
                  className="w-full text-xs gap-1.5 mt-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect Project & Milestones
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Drawer */}
      {activeProject && (
        <ProjectDetailsDrawer
          isOpen={Boolean(activeProject)}
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
    </div>
  );
};
