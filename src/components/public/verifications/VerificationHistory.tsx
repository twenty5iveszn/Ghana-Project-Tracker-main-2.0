import React, { useState, useEffect } from 'react';
import { ProjectVerification } from '../../../types/project';
import { VerificationBadge } from '../../ui/verification-badge';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface VerificationHistoryProps {
  projectId: string;
}

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({ projectId }) => {
  const [verifications, setVerifications] = useState<ProjectVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/verifications`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load verification logs');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setVerifications(data.data || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          Official Verification & Audit Trail
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Constitutional oversight logs, gazetting events, and Regional Coordinating Council sign-offs.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs border border-rose-200">
          {error}
        </div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
          No verification events logged yet.
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-emerald-700" />
                    {item.reviewer_title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">ID: {item.id}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <VerificationBadge status={item.previous_status} />
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <VerificationBadge status={item.new_status} />
                </div>
              </div>

              {item.reason && (
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-mono">
                  &ldquo;{item.reason}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDate(item.created_at)}</span>
                </span>
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Decision: {item.decision}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
