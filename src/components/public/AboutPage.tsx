import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Users,
  Eye,
  FileCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-12">
      {/* Hero */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-lg space-y-4">
        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
          Ghana Civic Technology Initiative
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Transparency in Ghana's Public Infrastructure
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-3xl leading-relaxed">
          GhanaBuild is the open civic platform dedicated to tracking government-funded capital infrastructure across all 16 administrative regions of the Republic of Ghana.
        </p>
      </div>

      {/* Mission & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl w-fit">
            <Eye className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Why GhanaBuild Exists</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Billions of Ghana Cedis are budgeted annually for schools, clinics, highways, water systems, and market infrastructure. Yet communities frequently suffer from stalled works, abandoned sites, and lack of timely information. GhanaBuild provides open, verified data so every citizen can track what was promised versus what is physically delivered on the ground.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="p-3 bg-sky-50 text-sky-800 rounded-xl w-fit">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">The Verification Standard</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We do not accept project claims blindly. Every project published to the open directory must feature verified GPS coordinates, designated contractors, confirmed budget lines, and multi-tier officer authorization. When citizens report concerns, local MMDA engineers investigate to establish on-the-ground reality.
          </p>
        </div>
      </div>

      {/* 4 Pillars of Governance */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Core Governance Pillars</h2>
          <p className="text-sm text-slate-500">
            Engineered from the ground up for strict data integrity and decentralized jurisdiction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-emerald-700 font-bold text-lg">01. Open Data</div>
            <h4 className="text-sm font-bold text-slate-900">Accessible to All</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No paywalls, hidden portals, or restricted access. All verified project information is free and open to the public.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-sky-700 font-bold text-lg">02. Jurisdictions</div>
            <h4 className="text-sm font-bold text-slate-900">Decentralized JBAC</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              MMDA officers can only edit projects within their approved district boundaries, preventing administrative overreach.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-amber-700 font-bold text-lg">03. Audit Trails</div>
            <h4 className="text-sm font-bold text-slate-900">Immutable Logs</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every status change, budget revision, and verification decision is permanently recorded in an append-only audit register.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-rose-700 font-bold text-lg">04. Evidence First</div>
            <h4 className="text-sm font-bold text-slate-900">Geotagged Proof</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Physical progress must be supported by photographic evidence, milestone inspections, and GPS coordinate locks.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black">Ready to explore ongoing infrastructure?</h3>
          <p className="text-sm text-emerald-200">
            Search projects in your district, constituency, or home region today.
          </p>
        </div>
        <Button
          variant="gold"
          size="lg"
          onClick={() => onNavigate('/projects')}
          className="font-bold shrink-0 text-slate-950"
        >
          Explore Projects Directory
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};
