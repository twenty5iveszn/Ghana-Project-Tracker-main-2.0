import React, { useState, useEffect } from 'react';
import { Project } from '../../types/project';
import { DistrictData, RegionData, CommunityData } from '../../types/geography';
import { ProjectCard } from './ProjectCard';
import { GhanaProjectMap } from './GhanaProjectMap';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatGHS } from '../../lib/utils';
import {
  ArrowLeft,
  MapPin,
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';

interface DistrictDetailProps {
  slugOrId: string;
  onNavigate: (path: string) => void;
}

interface DistrictDetailData {
  district: DistrictData & { slug: string };
  region: RegionData & { slug: string };
  communities: CommunityData[];
  statistics: {
    total_projects: number;
    ongoing_projects: number;
    completed_projects: number;
    planned_projects: number;
    total_budget_ghs: number;
    average_progress: number;
  };
  community_project_counts: Record<string, number>;
  projects: Project[];
}

export const DistrictDetail: React.FC<DistrictDetailProps> = ({ slugOrId, onNavigate }) => {
  const [data, setData] = useState<DistrictDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/geography/districts/${slugOrId}`)
      .then((res) => {
        if (!res.ok) throw new Error('District not found');
        return res.json();
      })
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        } else {
          throw new Error(resData.error?.message || 'Failed to load district');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">District Assembly Not Found</h2>
        <p className="text-xs text-slate-500">{error || `No district data for "${slugOrId}"`}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onNavigate('/regions')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Regions Directory
          </Button>
          <Button size="sm" onClick={() => onNavigate('/projects')}>
            Explore Projects
          </Button>
        </div>
      </div>
    );
  }

  const { district, region, communities, statistics, community_project_counts, projects } = data;

  // Filter projects by status and search query
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.project_status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location_name && p.location_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button
          onClick={() => onNavigate('/regions')}
          className="hover:text-emerald-800 transition-colors cursor-pointer"
        >
          Regions
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate(`/regions/${region.slug || region.id}`)}
          className="hover:text-emerald-800 transition-colors cursor-pointer text-slate-700"
        >
          {region.name}
        </button>
        <span>/</span>
        <span className="text-slate-900 font-bold">{district.name}</span>
      </div>

      {/* District Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial from-emerald-500 to-transparent pointer-events-none" />
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MMDA Jurisdictional Directory
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Region: {region.name}
            </span>
            {district.capital && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Capital: {district.capital}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {district.name}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Official infrastructure investment registry for {district.name}. Citizens, assembly members, and observers can monitor ongoing civil works, contractors, and public expenditure.
          </p>
        </div>
      </div>

      {/* District Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Verified Projects
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {statistics.total_projects}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Full state verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Works
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {statistics.ongoing_projects}
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-0.5">Currently on-site</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Completed Works
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {statistics.completed_projects}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">100% finished</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Capital
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatGHS(statistics.total_budget_ghs)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">District allocation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Avg. Delivery
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {statistics.average_progress}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Weighted progress</div>
        </div>
      </div>

      {/* Communities Directory in District */}
      {communities && communities.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Communities & Electoral Wards ({communities.length})
              </h3>
              <p className="text-xs text-slate-500">
                Local settlements and towns within {district.name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {communities.map((comm) => {
              const count = community_project_counts[comm.id] || 0;
              return (
                <button
                  key={comm.id}
                  onClick={() => setSearchQuery(comm.name)}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{comm.name}</span>
                  {count > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Map Filtered to District */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Geospatial Sites in {district.name}
            </h3>
            <p className="text-xs text-slate-500">
              Interactive map markers for verified infrastructure projects in this district
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(`/projects?district=${district.id}&view=map`)}
            className="text-xs font-semibold self-start sm:self-auto"
          >
            Open in Fullscreen Map
          </Button>
        </div>
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <GhanaProjectMap
            height="380px"
            selectedRegion={region.id}
            onProjectClick={(slug) => onNavigate(`/projects/${slug}`)}
            interactiveFilters={false}
          />
        </div>
      </div>

      {/* Projects Directory in District */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Projects in {district.name} ({filteredProjects.length})
            </h3>
            <p className="text-xs text-slate-500">
              All gazetted and verified public infrastructure undertakings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status pills */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              {(['ALL', 'ONGOING', 'COMPLETED', 'PLANNED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district works..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <Building2 className="h-8 w-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No projects matching criteria</h4>
            <p className="text-xs text-slate-500">
              {statusFilter !== 'ALL' || searchQuery
                ? 'Try resetting the search query or status filter.'
                : 'No projects registered yet in this district.'}
            </p>
            {(statusFilter !== 'ALL' || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs mt-2"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="grid"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
