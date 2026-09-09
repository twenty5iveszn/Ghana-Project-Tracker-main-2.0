import React, { useState, useEffect } from 'react';
import { Project } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { GhanaProjectMap } from './GhanaProjectMap';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatGHS } from '../../lib/utils';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface CategoryDetailProps {
  slugOrId: string;
  onNavigate: (path: string) => void;
}

interface CategoryDetailData {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
  };
  statistics: {
    total_projects: number;
    ongoing_projects: number;
    completed_projects: number;
    planned_projects: number;
    total_budget_ghs: number;
  };
  projects: Project[];
}

export const CategoryDetail: React.FC<CategoryDetailProps> = ({ slugOrId, onNavigate }) => {
  const [data, setData] = useState<CategoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/geography/categories/${slugOrId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Category not found');
        return res.json();
      })
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        } else {
          throw new Error(resData.error?.message || 'Failed to load category');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Sector not found</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Button variant="outline" size="sm" onClick={() => onNavigate('/categories')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to All Sectors
        </Button>
      </div>
    );
  }

  const { category, statistics, projects } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('/categories')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Infrastructure Sectors</span>
      </button>

      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono">
              Sector Directory
            </Badge>
            <Badge variant="outline" className="text-xs text-slate-300 border-slate-700">
              {statistics.total_projects} Projects Cataloged
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {category.name}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            {category.description || 'Public capital infrastructure projects.'}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Verified Projects
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {statistics.total_projects}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Audited records</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Works
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {statistics.ongoing_projects}
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-0.5">Under construction</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Completed Works
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {statistics.completed_projects}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Handed over</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Investment
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatGHS(statistics.total_budget_ghs)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Public capital</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Verified {category.name} Projects ({projects.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(`/projects?category=${category.slug}`)}
            className="text-xs"
          >
            Filter in Full Explorer
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No verified projects currently cataloged in this sector.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
};
