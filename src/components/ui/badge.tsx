import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'neutral';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', children }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap';

  const variants = {
    default: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border border-amber-300',
    destructive: 'bg-rose-50 text-rose-800 border border-rose-300',
    neutral: 'bg-zinc-100 text-zinc-800 border border-zinc-200',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}
