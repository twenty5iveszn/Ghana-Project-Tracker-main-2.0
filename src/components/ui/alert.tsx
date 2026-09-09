import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const configs = {
    info: {
      border: 'border-sky-300 bg-sky-50 text-sky-900',
      icon: <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-amber-300 bg-amber-50 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-rose-300 bg-rose-50 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const config = configs[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', config.border, className)}
    >
      {config.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 text-slate-900">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
