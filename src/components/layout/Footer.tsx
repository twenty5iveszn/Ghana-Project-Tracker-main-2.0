import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
  onOpenSecurityTests?: () => void;
  onOpenPhase5SecurityTests?: () => void;
  onOpenPhase9Tests?: () => void;
}

export function Footer({
  onNavigate,
  onOpenSecurityTests,
  onOpenPhase5SecurityTests,
  onOpenPhase9Tests,
}: FooterProps) {
  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={(e) => handleLink(e, '/')}>
              <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-black text-sm">
                GB
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Ghana<span className="text-emerald-400">Build</span> 2.0
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-4">
              A public infrastructure transparency, monitoring, and citizen accountability platform designed for the Republic of Ghana. Tracking public investments from planning to completion through community evidence and official verification.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
                16 Regions
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono">
                261 MMDAs
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                PostgreSQL + RLS
              </span>
              {onOpenSecurityTests && (
                <button
                  onClick={onOpenSecurityTests}
                  className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Phase 4 Test Suite
                </button>
              )}
              {onOpenPhase5SecurityTests && (
                <button
                  onClick={onOpenPhase5SecurityTests}
                  className="px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-400/60 text-emerald-200 font-mono text-xs hover:bg-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  Phase 5 Test Suite
                </button>
              )}
              {onOpenPhase9Tests && (
                <button
                  onClick={onOpenPhase9Tests}
                  className="px-2 py-0.5 rounded bg-emerald-800/80 border border-emerald-400 text-emerald-100 font-mono text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  Phase 9 Map & Analytics Suite
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Public Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Public Explorer
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/projects"
                  onClick={(e) => handleLink(e, '/projects')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  All Projects Directory
                </a>
              </li>
              <li>
                <a
                  href="/map"
                  onClick={(e) => handleLink(e, '/map')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Map & Geospatial Explorer
                </a>
              </li>
              <li>
                <a
                  href="/analytics"
                  onClick={(e) => handleLink(e, '/analytics')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Public Transparency Analytics
                </a>
              </li>
              <li>
                <a
                  href="/regions"
                  onClick={(e) => handleLink(e, '/regions')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  16 Regions Overview
                </a>
              </li>
              <li>
                <a
                  href="/categories"
                  onClick={(e) => handleLink(e, '/categories')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Infrastructure Sectors
                </a>
              </li>
              <li>
                <a
                  href="/submit"
                  onClick={(e) => handleLink(e, '/submit')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Citizen Report Intake
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Accountability & Trust */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Accountability
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Verification Lifecycle
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  onClick={(e) => handleLink(e, '/admin')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  MMDA / Officer Portal
                </a>
              </li>
              {onOpenSecurityTests && (
                <li>
                  <button
                    onClick={onOpenSecurityTests}
                    className="hover:text-emerald-400 transition-colors cursor-pointer text-left text-emerald-400 font-medium"
                  >
                    Run Public Security Audit (Phase 4)
                  </button>
                </li>
              )}
              {onOpenPhase5SecurityTests && (
                <li>
                  <button
                    onClick={onOpenPhase5SecurityTests}
                    className="hover:text-emerald-400 transition-colors cursor-pointer text-left text-emerald-300 font-medium"
                  >
                    Run Evidence & Document Audit (Phase 5)
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Legal and Disclaimer Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} GhanaBuild Transparency Initiative. Public Data Standard for Ghana Infrastructure.
          </p>
          <div className="flex items-center gap-6">
            <span>Freedom and Justice</span>
            <span>&bull;</span>
            <span>Open Civic Data</span>
            <span>&bull;</span>
            <span>Zero Fake Credentials</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
