import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
  cardCount?: number;
}

export function LoadingState({
  message = 'Loading GhanaBuild records...',
  description,
  className,
  cardCount = 0,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-slate-50/50 border border-slate-200/60',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
      <p className="font-semibold text-slate-800 text-base">{message}</p>
      {description && <p className="text-sm text-slate-500 max-w-md mt-1">{description}</p>}

      {cardCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6 animate-pulse">
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200/70 rounded-xl border border-slate-300/60" />
          ))}
        </div>
      )}
    </div>
  );
}
