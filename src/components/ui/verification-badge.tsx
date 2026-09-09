import React from 'react';
import { VerificationStatus } from '../../types/project';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Archive } from 'lucide-react';

export interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
  showIcon?: boolean;
  key?: React.Key;
}

const verificationConfig: Record<
  VerificationStatus,
  { label: string; styles: string; icon: typeof CheckCircle2 }
> = {
  PENDING: {
    label: 'Pending Review',
    styles: 'bg-amber-50 text-amber-900 border-amber-300',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    styles: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    icon: AlertTriangle,
  },
  VERIFIED: {
    label: 'Verified Official',
    styles: 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    styles: 'bg-rose-50 text-rose-900 border-rose-300',
    icon: XCircle,
  },
  REQUEST_CHANGES: {
    label: 'Changes Requested',
    styles: 'bg-orange-50 text-orange-900 border-orange-300',
    icon: AlertTriangle,
  },
  ARCHIVED: {
    label: 'Archived',
    styles: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: Archive,
  },
};

export function VerificationBadge({
  status,
  className,
  showIcon = true,
}: VerificationBadgeProps) {
  const config = verificationConfig[status] || {
    label: status,
    styles: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
        config.styles,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {config.label}
    </span>
  );
}
