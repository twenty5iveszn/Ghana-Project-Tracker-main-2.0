import React from 'react';
import { ProjectStatus } from '../../types/project';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
  key?: React.Key;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; styles: string; dotColor: string }
> = {
  PLANNED: {
    label: 'Planned',
    styles: 'bg-sky-50 text-sky-800 border-sky-200',
    dotColor: 'bg-sky-500',
  },
  ONGOING: {
    label: 'Ongoing',
    styles: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-600',
  },
  ON_HOLD: {
    label: 'On Hold',
    styles: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  COMPLETED: {
    label: 'Completed',
    styles: 'bg-teal-50 text-teal-800 border-teal-300',
    dotColor: 'bg-teal-600',
  },
  ABANDONED: {
    label: 'Abandoned',
    styles: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    styles: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-500',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    styles: 'bg-gray-100 text-gray-800 border-gray-300',
    dotColor: 'bg-gray-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
        config.styles,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
