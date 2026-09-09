import React from 'react';
import { Project } from '../../types/project';
import { StatusBadge } from '../ui/status-badge';
import { VerificationBadge } from '../ui/verification-badge';
import {
  MapPin,
  Building2,
  Calendar,
  Coins,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatGHS, formatDate } from '../../lib/utils';

interface ProjectCardProps {
  project: Project;
  variant?: 'grid' | 'horizontal' | 'compact';
  onSelect?: (project: Project) => void;
  onNavigate?: (path: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  variant = 'grid',
  onSelect,
  onNavigate,
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(project);
    } else if (onNavigate) {
      onNavigate(`/projects/${project.slug || project.id}`);
    }
  };

  const categoryName = project.category?.name || 'Infrastructure';
  const regionName = project.region?.name || 'Ghana';
  const districtName = project.district?.name || '';
  const contractorName = project.contractor?.name || 'Contractor on file';

  // Calculate progress color
  const getProgressColor = (pct: number, status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-600';
    if (status === 'ON_HOLD' || status === 'ABANDONED') return 'bg-amber-500';
    if (pct >= 75) return 'bg-emerald-600';
    if (pct >= 40) return 'bg-teal-600';
    return 'bg-blue-600';
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer group shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 truncate max-w-[150px]">
            {categoryName}
          </span>
          <StatusBadge status={project.project_status} />
        </div>
        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {project.title}
        </h4>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{regionName}{districtName ? ` • ${districtName}` : ''}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
          <span className="font-semibold text-slate-900">{formatGHS(project.budget)}</span>
          <span className="font-mono text-emerald-700 font-bold">{project.progress_percentage}%</span>
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-5 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
              {categoryName}
            </span>
            <StatusBadge status={project.project_status} />
            <VerificationBadge status={project.verification_status} />
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">{project.id}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {project.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{regionName}{districtName ? ` • ${districtName}` : ''}</span>
            </span>
            <span className="flex items-center gap-1 truncate hidden sm:flex">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[200px]">{contractorName}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Target: {formatDate(project.expected_completion_date)}</span>
            </span>
          </div>
        </div>

        <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 shrink-0 gap-3 min-w-[180px]">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Budget</div>
            <div className="text-base font-black text-slate-900">{formatGHS(project.budget)}</div>
          </div>

          <div className="w-full max-w-[140px] text-right">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Progress</span>
              <span className="font-mono font-bold text-slate-900">{project.progress_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(project.progress_percentage, project.project_status)}`}
                style={{ width: `${Math.min(100, Math.max(0, project.progress_percentage))}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>View Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Variant
  return (
    <div
      onClick={handleClick}
      className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-5 transition-all flex flex-col justify-between cursor-pointer group"
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 truncate max-w-[170px]">
            {categoryName}
          </span>
          <StatusBadge status={project.project_status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
          {project.title}
        </h3>

        {/* Location & Details */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-700 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{regionName}{districtName ? ` • ${districtName}` : ''}</span>
          </div>
          {project.location_name && (
            <div className="text-[11px] text-slate-500 pl-5 truncate">
              {project.location_name}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 truncate">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{contractorName}</span>
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
          {project.description}
        </p>
      </div>

      {/* Progress & Financials Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-slate-400" />
              Completion
            </span>
            <span className="font-mono font-bold text-slate-900">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                project.progress_percentage,
                project.project_status
              )}`}
              style={{ width: `${Math.min(100, Math.max(0, project.progress_percentage))}%` }}
            />
          </div>
        </div>

        {/* Budget and Target Date */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Allocated Budget</div>
            <div className="text-sm font-black text-slate-900">{formatGHS(project.budget)}</div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>Details</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
