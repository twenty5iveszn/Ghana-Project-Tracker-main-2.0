import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Gauge, Search } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ContractorDirectoryProps { onNavigate: (path: string) => void; }

export function ContractorDirectory({ onNavigate }: ContractorDirectoryProps) {
  const [contractors, setContractors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => { fetch('/api/contractors/directory').then((response) => response.json()).then((result) => { if (result.success) setContractors(result.data); }); }, []);
  const filtered = contractors.filter((contractor) => contractor.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Public accountability</p><h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Contractor directory</h1><p className="text-slate-600 mt-2 max-w-2xl">Explore contractors attached to verified GhanaBuild projects and compare recorded delivery indicators.</p></div>
      <button onClick={() => onNavigate('/contractors/methodology')} className="text-sm font-bold text-emerald-800 hover:text-emerald-950">How indicators are calculated</button>
    </div>
    <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 max-w-xl shadow-sm"><Search className="h-4 w-4 text-slate-400" /><span className="sr-only">Search contractors</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contractors" className="w-full outline-none text-sm" /></label>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map((contractor) => <button key={contractor.id} onClick={() => onNavigate(`/contractors/${contractor.slug}`)} className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
      <div className="flex items-start justify-between gap-4"><div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center"><Building2 className="h-5 w-5" /></div><ChevronRight className="h-5 w-5 text-slate-400" /></div>
      <h2 className="font-black text-lg mt-5 text-slate-900">{contractor.name}</h2><p className="text-xs text-slate-500 mt-1">{contractor.category_specialization || 'Public works contractor'}</p>
      <div className="grid grid-cols-3 gap-2 mt-5 text-center"><div><div className="font-black text-slate-900">{contractor.total_projects_count}</div><div className="text-[10px] uppercase text-slate-500">Projects</div></div><div><div className="font-black text-slate-900">{contractor.completed_projects_count}</div><div className="text-[10px] uppercase text-slate-500">Completed</div></div><div><div className="font-black text-emerald-800">{contractor.scorecard.overall_score ?? 'N/A'}</div><div className="text-[10px] uppercase text-slate-500">Indicator</div></div></div>
      <div className="mt-5 flex items-center justify-between"><Badge variant="secondary">{contractor.scorecard.confidence_label}</Badge><span className="text-xs text-slate-500 flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{contractor.scorecard.tier.replaceAll('_', ' ')}</span></div>
    </button>)}</div>
    {!filtered.length && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">No public contractor records match your search.</div>}
  </div>;
}
