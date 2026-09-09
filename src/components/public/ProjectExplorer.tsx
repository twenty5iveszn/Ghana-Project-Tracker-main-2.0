import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus } from '../../types/project';
import { RegionData, DistrictData } from '../../types/geography';
import { ProjectCard } from './ProjectCard';
import { GhanaProjectMap } from './GhanaProjectMap';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Search,
  Filter,
  Grid,
  List,
  MapPin,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Coins,
  Building2,
  Layers,
} from 'lucide-react';

interface ProjectExplorerProps {
  onNavigate: (path: string) => void;
  initialQuery?: string;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ onNavigate }) => {
  // Read initial params from window.location.search
  const getSearchParams = () => new URLSearchParams(window.location.search);

  const initialParams = getSearchParams();

  // Filters State
  const [search, setSearch] = useState<string>(initialParams.get('search') || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(initialParams.get('region') || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialParams.get('district') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialParams.get('category') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialParams.get('status') || '');
  const [minBudget, setMinBudget] = useState<string>(initialParams.get('min_budget') || '');
  const [maxBudget, setMaxBudget] = useState<string>(initialParams.get('max_budget') || '');
  const [progressRange, setProgressRange] = useState<string>(initialParams.get('progress') || '');
  const [sortField, setSortField] = useState<string>(initialParams.get('sort') || 'updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((initialParams.get('order') as 'asc' | 'desc') || 'desc');
  const [currentPage, setCurrentPage] = useState<number>(parseInt(initialParams.get('page') || '1', 10));
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>((initialParams.get('view') as any) || 'grid');

  // Metadata dropdowns
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Project results & pagination
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Sync state with URL without full page reload
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    if (minBudget) params.set('min_budget', minBudget);
    if (maxBudget) params.set('max_budget', maxBudget);
    if (progressRange) params.set('progress', progressRange);
    if (sortField !== 'updated_at') params.set('sort', sortField);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (viewMode !== 'grid') params.set('view', viewMode);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [
    search,
    selectedRegion,
    selectedDistrict,
    selectedCategory,
    selectedStatus,
    minBudget,
    maxBudget,
    progressRange,
    sortField,
    sortOrder,
    currentPage,
    viewMode,
  ]);

  // Load Regions and Categories
  useEffect(() => {
    fetch('/api/geography/regions')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegions(d.data);
      })
      .catch((err) => console.error('Failed to load regions:', err));

    fetch('/api/geography/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Load Districts when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    const foundRegion = regions.find((r) => r.id === selectedRegion || r.code === selectedRegion || r.slug === selectedRegion);
    const regionId = foundRegion ? foundRegion.id : selectedRegion;

    fetch(`/api/geography/districts?region_id=${regionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDistricts(d.data);
      })
      .catch((err) => console.error('Failed to load districts:', err));
  }, [selectedRegion, regions]);

  // Fetch Projects from API
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (minBudget) params.append('min_budget', minBudget);
      if (maxBudget) params.append('max_budget', maxBudget);

      // Parse progress range
      if (progressRange === '0-25') {
        params.append('min_progress', '0');
        params.append('max_progress', '25');
      } else if (progressRange === '26-50') {
        params.append('min_progress', '26');
        params.append('max_progress', '50');
      } else if (progressRange === '51-75') {
        params.append('min_progress', '51');
        params.append('max_progress', '75');
      } else if (progressRange === '76-99') {
        params.append('min_progress', '76');
        params.append('max_progress', '99');
      } else if (progressRange === '100') {
        params.append('min_progress', '100');
        params.append('max_progress', '100');
      }

      params.append('sort', sortField);
      params.append('order', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
        if (data.pagination) {
          setTotalProjects(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    syncUrl();
  }, [
    search,
    selectedRegion,
    selectedDistrict,
    selectedCategory,
    selectedStatus,
    minBudget,
    maxBudget,
    progressRange,
    sortField,
    sortOrder,
    currentPage,
    viewMode,
  ]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedRegion('');
    setSelectedDistrict('');
    setSelectedCategory('');
    setSelectedStatus('');
    setMinBudget('');
    setMaxBudget('');
    setProgressRange('');
    setSortField('updated_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
      selectedRegion ||
      selectedDistrict ||
      selectedCategory ||
      selectedStatus ||
      minBudget ||
      maxBudget ||
      progressRange
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono mb-2">
            Open Civic Infrastructure Directory
          </Badge>
          <h1 className="text-3xl font-black tracking-tight">
            Explore Verified Infrastructure Projects
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Query across all 16 regions, sectors, and contractors in Ghana. All displayed records have passed on-site verification and cross-audit checks.
          </p>
        </div>
      </div>

      {/* 2. Main Search & View Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, location, or contractor..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters & View Toggles */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Filter Toggle for Mobile/Drawer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`text-xs gap-1.5 ${hasActiveFilters ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : ''}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
              )}
            </Button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'updated_at_desc') {
                    setSortField('updated_at');
                    setSortOrder('desc');
                  } else if (val === 'created_at_desc') {
                    setSortField('created_at');
                    setSortOrder('desc');
                  } else if (val === 'budget_desc') {
                    setSortField('budget');
                    setSortOrder('desc');
                  } else if (val === 'budget_asc') {
                    setSortField('budget');
                    setSortOrder('asc');
                  } else if (val === 'progress_percentage_desc') {
                    setSortField('progress_percentage');
                    setSortOrder('desc');
                  } else if (val === 'title_asc') {
                    setSortField('title');
                    setSortOrder('asc');
                  }
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="updated_at_desc">Recently Updated</option>
                <option value="created_at_desc">Recently Added</option>
                <option value="budget_desc">Highest Budget</option>
                <option value="budget_asc">Lowest Budget</option>
                <option value="progress_percentage_desc">Highest Progress</option>
                <option value="title_asc">Project Title (A-Z)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Interactive Map"
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Detailed Filters Toolbar */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Region Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All 16 Regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.code || r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">District / MMDA</label>
            <select
              value={selectedDistrict}
              disabled={!selectedRegion || districts.length === 0}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">{selectedRegion ? 'All Districts' : 'Select Region First'}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sector / Category Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sector</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Sectors</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNED">Planned</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>

          {/* Progress Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Progress</label>
            <select
              value={progressRange}
              onChange={(e) => {
                setProgressRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Any Progress</option>
              <option value="0-25">0% – 25% (Foundation)</option>
              <option value="26-50">26% – 50% (Structural)</option>
              <option value="51-75">51% – 75% (Advanced)</option>
              <option value="76-99">76% – 99% (Finishing)</option>
              <option value="100">100% (Completed)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Active:</span>
            {search && (
              <Badge variant="outline" className="gap-1 bg-slate-50">
                "{search}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch('')} />
              </Badge>
            )}
            {selectedRegion && (
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                Region: {selectedRegion}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedRegion('')} />
              </Badge>
            )}
            {selectedDistrict && (
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                District: {selectedDistrict}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDistrict('')} />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="outline" className="gap-1 bg-teal-50 text-teal-800 border-teal-200">
                Sector: {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-800 border-blue-200">
                Status: {selectedStatus}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus('')} />
              </Badge>
            )}
            {progressRange && (
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-200">
                Progress: {progressRange}%
                <X className="h-3 w-3 cursor-pointer" onClick={() => setProgressRange('')} />
              </Badge>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-2 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{projects.length}</span> of{' '}
          <span className="font-bold text-slate-900">{totalProjects}</span> verified projects
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* 5. Main Content Area according to View Mode */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <GhanaProjectMap
            height="560px"
            selectedRegion={selectedRegion}
            selectedCategory={selectedCategory}
            onProjectClick={(slug) => onNavigate(`/projects/${slug}`)}
          />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 bg-slate-100 rounded-xl border border-slate-200 animate-pulse p-6 space-y-4"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching projects found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            We couldn't find any verified infrastructure projects matching your search criteria. Try removing some filters or searching with a different term.
          </p>
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
            Reset All Filters
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant="horizontal"
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant="grid"
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* 6. Server-Side Pagination Bar */}
      {totalPages > 1 && viewMode !== 'map' && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs text-xs">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 rounded-lg font-medium cursor-pointer transition-colors ${
                    currentPage === pageNum
                      ? 'bg-emerald-800 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 text-xs"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
