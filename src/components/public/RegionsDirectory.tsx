import React, { useState, useEffect } from 'react';
import { RegionData } from '../../types/geography';
import { formatGHS } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  MapPin,
  Building2,
  TrendingUp,
  ChevronRight,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface RegionStat extends RegionData {
  slug: string;
  total_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  total_budget_ghs: number;
  districts_count: number;
}

interface RegionsDirectoryProps {
  onNavigate: (path: string) => void;
}

export const RegionsDirectory: React.FC<RegionsDirectoryProps> = ({ onNavigate }) => {
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/geography/regions-with-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRegions(data.data);
        }
      })
      .catch((err) => console.error('Failed to load regions with stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRegions = regions.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.capital.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-3xl space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
            Decentralized Civic Infrastructure
          </Badge>
          <h1 className="text-3xl font-black tracking-tight">
            16 Administrative Regions of Ghana
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Discover capital infrastructure distribution across all 16 regions. Inspect allocations, active construction sites, and completed public investments by regional coordinating council.
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
            placeholder="Search region by name or capital..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filteredRegions.length}</span> of 16 regions
        </div>
      </div>

      {/* Grid of Regions */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-56 bg-slate-100 rounded-2xl animate-pulse p-6" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRegions.map((region) => (
            <div
              key={region.id}
              onClick={() => onNavigate(`/regions/${region.slug || region.id}`)}
              className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-lg rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                    {region.code}
                  </span>
                  <Badge variant="outline" className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border-emerald-200">
                    {region.total_projects} {region.total_projects === 1 ? 'Project' : 'Projects'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {region.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Capital: {region.capital}</span>
                  </div>
                </div>

                {/* District count */}
                <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  <span>{region.districts_count} MMDCE Assemblies</span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Allocated Budget:</span>
                  <span className="font-bold text-slate-900">{formatGHS(region.total_budget_ghs)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Active Works:</span>
                  <span className="font-semibold text-sky-700">{region.ongoing_projects} ongoing</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 pt-2 group-hover:translate-x-1 transition-transform">
                  <span>Explore Region Projects</span>
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
