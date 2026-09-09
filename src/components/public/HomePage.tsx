import React, { useState, useEffect } from 'react';
import { Project } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { GhanaProjectMap } from './GhanaProjectMap';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatGHS } from '../../lib/utils';
import {
  Search,
  ShieldCheck,
  Building2,
  MapPin,
  Compass,
  ArrowRight,
  TrendingUp,
  Coins,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

interface PublicStats {
  total_verified_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  planned_projects: number;
  on_hold_projects: number;
  total_public_investment_ghs: number;
  active_regions_count: number;
  active_districts_count: number;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string; slug: string; total_projects: number }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; total_projects: number; total_budget_ghs: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load public statistics
    fetch('/api/projects/public-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch((err) => console.error('Error fetching public stats:', err));

    // Load featured projects
    fetch('/api/projects/featured?limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFeaturedProjects(data.data);
      })
      .catch((err) => console.error('Error fetching featured projects:', err));

    // Load regions with project counts
    fetch('/api/geography/regions-with-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRegions(data.data);
      })
      .catch((err) => console.error('Error fetching regions:', err));

    // Load categories with project counts
    fetch('/api/geography/categories-with-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch((err) => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/projects');
    }
  };

  const quickSectors = [
    { name: 'Roads & Highways', slug: 'roads-highways' },
    { name: 'Healthcare & Hospitals', slug: 'health' },
    { name: 'Education & Schools', slug: 'education' },
    { name: 'Water & Sanitation', slug: 'water-sanitation' },
    { name: 'Markets & Trade', slug: 'markets-economic' },
    { name: 'Energy & Power', slug: 'energy-power' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto relative z-10 text-center sm:text-left">
          {/* Civic Badge with Flag Elements */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold mb-6">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-slate-300">Republic of Ghana Public Infrastructure Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white max-w-3xl">
            Track the projects <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              building Ghana.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-2xl mt-5 leading-relaxed">
            Open, verified, and geotagged data on government infrastructure investments. From regional hospitals and asphalt roads to local community schools and water systems.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-2xl bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200 text-slate-900"
          >
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, contractor, district, or town..."
                className="w-full px-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full sm:w-auto font-bold px-6 shadow-md text-slate-950"
            >
              Search Projects
            </Button>
          </form>

          {/* Quick Category Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Popular Sectors:</span>
            {quickSectors.map((sector) => (
              <button
                key={sector.slug}
                onClick={() => onNavigate(`/projects?category=${sector.slug}`)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
              >
                {sector.name}
              </button>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              variant="gold"
              size="lg"
              onClick={() => onNavigate('/projects')}
              className="flex items-center gap-2 font-bold"
            >
              <Compass className="h-4 w-4" />
              Browse All Projects
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('/regions')}
              className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800 flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-emerald-400" />
              Explore by 16 Regions
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('/submit')}
              className="border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/40 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Report an Issue / Delay
            </Button>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME STATS COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Verified Projects */}
          <div className="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats ? stats.total_verified_projects : '...'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Verified Projects
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Officially vetted on site
              </div>
            </div>
          </div>

          {/* Ongoing Works */}
          <div className="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200/60">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats ? stats.ongoing_projects : '...'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Active Works
              </div>
              <div className="text-[11px] text-sky-700 font-medium mt-1">
                Under active construction
              </div>
            </div>
          </div>

          {/* Total Investment */}
          <div className="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats ? formatGHS(stats.total_public_investment_ghs) : '...'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Total Budget
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                Public funds allocated
              </div>
            </div>
          </div>

          {/* Geographic Coverage */}
          <div className="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                16 / 16
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Regions Tracked
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-1">
                Nationwide MMDA coverage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED HIGH-IMPACT PROJECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>National Priority Investments</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Featured Infrastructure Projects
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Major national and municipal investments currently reshaping transportation, healthcare, and education across Ghana.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('/projects')}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold"
          >
            <span>View All Verified Projects</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant="grid"
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE MAP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Geographic Footprint</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Ghana Infrastructure Map
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore real, geotagged infrastructure projects across all 16 regions. Click any marker to view milestones and budget.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/projects?view=map')}
                className="text-xs"
              >
                Expand Fullscreen Map
              </Button>
            </div>
          </div>

          {/* Embedded Interactive Map */}
          <GhanaProjectMap
            height="480px"
            onProjectClick={(slug) => onNavigate(`/projects/${slug}`)}
          />
        </div>
      </section>

      {/* 5. EXPLORE BY 16 REGIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Decentralized Governance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Explore by Region
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Inspect infrastructure allocations across all 16 administrative regions of the Republic of Ghana.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('/regions')}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold"
          >
            <span>All 16 Regions Directory</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {regions.map((reg) => (
            <div
              key={reg.id}
              onClick={() => onNavigate(`/regions/${reg.slug}`)}
              className="p-4 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {reg.name}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>{reg.total_projects} verified</span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Explore
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. EXPLORE BY INFRASTRUCTURE SECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5 text-emerald-600" />
              <span>Investment Focus</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Explore by Sector
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Discover verified works categorized by public purpose, from critical transport corridors to water purification plants.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('/categories')}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold"
          >
            <span>All Sectors Directory</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/categories/${cat.slug}`)}
              className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {cat.total_projects} projects
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Allocated Budget</span>
                <span className="font-bold text-slate-900">{formatGHS(cat.total_budget_ghs)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. VERIFICATION & TRUST FRAMEWORK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="max-w-3xl mb-10">
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono mb-3">
              Civic Accountability Standards
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              How GhanaBuild Verifies Public Infrastructure
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              Every project listed on GhanaBuild undergoes a rigorous multi-tier audit process to protect the public record against phantom projects, inaccurate claims, or unverified announcements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm mb-3">
                1
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Contract Gazette</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Project is recorded from official MMDA tender releases, national budgets, or approved district assemblies.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm mb-3">
                2
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Geotagged Site Evidence</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Local officers or monitors record verified GPS coordinates and site milestone photos directly in the field.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm mb-3">
                3
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Officer Cross-Audit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Regional or national monitors review contractor progress percentages against physical milestone completions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm mb-3">
                4
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Public Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verified status is published to the open directory for continuous civic monitoring and community feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CITIZEN PROBLEM INTAKE CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl shrink-0">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Notice an abandoned site, stalled road, or structural defect in your community?
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Citizens are Ghana's first line of monitoring. File a report with your local MMDA through GhanaBuild to alert district engineers and national monitors.
              </p>
            </div>
          </div>
          <Button
            variant="gold"
            onClick={() => onNavigate('/submit')}
            className="shrink-0 font-bold text-slate-950 px-6"
          >
            Submit a Citizen Report
          </Button>
        </div>
      </section>
    </div>
  );
};
