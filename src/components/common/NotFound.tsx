import { Button } from '../ui/button';
import { Compass, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onNavigateHome?: () => void;
  onNavigateProjects?: () => void;
}

export function NotFound({ onNavigateHome, onNavigateProjects }: NotFoundProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12 text-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-5">
          <Compass className="h-8 w-8" />
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          404 Not Found
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-3 mb-2">Record or Page Not Located</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          The requested infrastructure project, region, or administrative view does not exist or has been relocated within the GhanaBuild registry.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button variant="outline" size="md" onClick={onNavigateHome} className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <Button variant="primary" size="md" onClick={onNavigateProjects}>
            Browse Verified Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
