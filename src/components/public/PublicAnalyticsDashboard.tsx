import React, { useState, useEffect } from 'react';
import { PublicAnalyticsData } from '../../types/project';
import { formatGHS } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Compass,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Building2,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

interface PublicAnalyticsDashboardProps {
  onNavigate: (path: string) => void;
}

export const PublicAnalyticsDashboard: React.FC<PublicAnalyticsDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<PublicAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'all' | 'year' | '90d' | '30d'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Regions & Categories list for filters
  const [regions, setRegions] = useState<{ id: string; name: string; code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch regions & categories for filter dropdowns
    fetch('/api/geography/regions')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setRegions(resData.data);
      })
      .catch((err) => console.error('Failed to load regions:', err));

    fetch('/api/geography/categories')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setCategories(resData.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const fetchPublicAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (timeRange !== 'all') params.append('range', timeRange);
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`/api/projects/public-analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to retrieve public transparency analytics');
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compile public analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAnalytics();
  }, [timeRange, selectedRegion, selectedCategory]);

  const handleExportPublicData = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghanabuild-transparency-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-emerald-600 to-transparent pointer-events-none" />
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>National Infrastructure Transparency Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Public Capital & Delivery Analytics
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Real-time public transparency on national budget allocations, physical construction completion rates, and cross-regional investments across Ghana's 16 administrative regions.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time range */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              {(['all', 'year', '90d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    timeRange === r
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r === 'year' ? 'Past Year' : r === '90d' ? 'Last 90 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All 16 Regions</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Sectors</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPublicData}
              disabled={!data}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Open Data (JSON)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPublicAnalytics}
              disabled={loading}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aggregating Verified Public Data...</h3>
          <p className="text-xs text-slate-500">Computing regional progress and capital totals across verified records</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-2">
          <h3 className="text-base font-bold">Failed to Load Transparency Analytics</h3>
          <p className="text-xs text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPublicAnalytics} className="mt-2 text-xs">
            Retry
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* 1. KEY HIGH-LEVEL METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
                <Coins className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {formatGHS(data.summary.total_budget)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">Verified Public Funds</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified Projects</span>
                <Building2 className="h-4 w-4 text-slate-700" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {data.summary.total_projects}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Full state oversight</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Ongoing</span>
                <Clock className="h-4 w-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-700">
                {data.summary.ongoing_projects}
              </div>
              <div className="text-[11px] text-sky-600 font-medium mt-1">Under construction</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Commissioned</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {data.summary.completed_projects}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">100% finished</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg. Progress</span>
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {data.summary.average_progress}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Weighted physical progress</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Halted / Stalled</span>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {data.summary.abandoned_projects + data.summary.on_hold_projects}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">Halted / on hold</div>
            </div>
          </div>

          {/* 2. REGIONAL INFRASTRUCTURE DISTRIBUTION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Regional Capital Allocation & Progress
                </h3>
                <p className="text-xs text-slate-500">
                  Distribution of verified projects and capital across Ghana's 16 administrative regions
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/regions')}
                className="text-xs font-semibold self-start sm:self-auto"
              >
                <span>View 16 Regions Directory</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.projects_by_region.map((reg) => (
                <div
                  key={reg.region_id}
                  onClick={() => onNavigate(`/regions/${reg.region_id}`)}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      {reg.region_name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {reg.count} {reg.count === 1 ? 'proj' : 'projs'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    Budget: <strong className="text-slate-800 font-semibold">{formatGHS(reg.total_budget)}</strong>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Physical Delivery</span>
                      <span className="text-slate-800">{reg.average_progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${reg.average_progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. SECTOR & STATUS BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Infrastructure Investment by Sector
                  </h3>
                  <p className="text-xs text-slate-500">
                    Public capital distribution across development sectors
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('/categories')}
                  className="text-xs"
                >
                  All Sectors
                </Button>
              </div>

              <div className="space-y-3">
                {data.projects_by_category.map((cat) => {
                  const percentOfTotal =
                    data.summary.total_budget > 0
                      ? Math.round((cat.total_budget / data.summary.total_budget) * 100)
                      : 0;
                  return (
                    <div
                      key={cat.category_id}
                      onClick={() => onNavigate(`/categories/${cat.category_id}`)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">{cat.category_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-500">{cat.count} projects</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {formatGHS(cat.total_budget)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full rounded-full"
                          style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right mt-1">
                        {percentOfTotal}% of total verified budget
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status & Progress Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Status Distribution</h3>
                <p className="text-xs text-slate-500">Current execution phase of tracked projects</p>
                <div className="mt-4 space-y-2">
                  {data.projects_by_status.map((st) => (
                    <div
                      key={st.status}
                      className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            st.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : st.status === 'ONGOING'
                              ? 'bg-sky-500'
                              : st.status === 'PLANNED'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-700 capitalize">
                          {st.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">{st.count}</span>
                        <span className="text-slate-400 text-[11px]">({st.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Physical Delivery Ranges</h3>
                <p className="text-xs text-slate-500 mb-3">Projects grouped by completion bracket</p>
                <div className="space-y-2">
                  {data.progress_distribution?.map((item) => (
                    <div key={item.range} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-600">{item.range}</span>
                        <span className="font-bold font-mono text-slate-800">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. HIGHEST-VALUE PUBLIC INVESTMENTS */}
          {data.top_investments && data.top_investments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Highest-Value Public Capital Investments
                  </h3>
                  <p className="text-xs text-slate-500">
                    Major strategic state infrastructure assets by total allocated budget
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('/projects')}
                  className="text-xs font-semibold self-start sm:self-auto"
                >
                  Explore All Projects
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Project Title</th>
                      <th className="py-3 px-3">Region & District</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Progress</th>
                      <th className="py-3 px-3 text-right">Budget</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.top_investments.map((proj) => (
                      <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <span
                            onClick={() => onNavigate(`/projects/${proj.slug}`)}
                            className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer block max-w-sm sm:max-w-md truncate"
                          >
                            {proj.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {proj.region_name} • {proj.district_name}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              proj.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : proj.status === 'ONGOING'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{proj.progress}%</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${proj.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatGHS(proj.budget)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => onNavigate(`/projects/${proj.slug}`)}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Dossier</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
