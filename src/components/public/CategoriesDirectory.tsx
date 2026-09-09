import React, { useState, useEffect } from 'react';
import { formatGHS } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Building2,
  Compass,
  ArrowRight,
  Search,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CategoryStat {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  total_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  total_budget_ghs: number;
}

interface CategoriesDirectoryProps {
  onNavigate: (path: string) => void;
}

export const CategoriesDirectory: React.FC<CategoriesDirectoryProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/geography/categories-with-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error('Failed to load categories with stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-3xl space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
            Public Capital Sectors
          </Badge>
          <h1 className="text-3xl font-black tracking-tight">
            Infrastructure Categories & Sectors
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Browse public capital works organized by civic purpose. Track funding, physical delivery rates, and active sites across Ghana's core development sectors.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sectors by keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> sectors
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-60 bg-slate-100 rounded-2xl animate-pulse p-6" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/categories/${cat.slug || cat.id}`)}
              className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-lg rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono bg-slate-50 text-slate-700">
                    {cat.total_projects} {cat.total_projects === 1 ? 'project' : 'projects'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {cat.description || 'Public capital infrastructure projects.'}
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Allocated Budget:</span>
                  <span className="font-bold text-slate-900">{formatGHS(cat.total_budget_ghs)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Active Execution:</span>
                  <span className="font-semibold text-sky-700">{cat.ongoing_projects} ongoing</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 pt-2 group-hover:translate-x-1 transition-transform">
                  <span>Explore Sector Projects</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
