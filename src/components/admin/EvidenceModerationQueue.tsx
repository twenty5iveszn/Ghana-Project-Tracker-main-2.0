import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Image as ImageIcon,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const EvidenceModerationQueue: React.FC = () => {
  const { profile, token } = useAuth();
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Action state
  const [actionReason, setActionReason] = useState('');
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);

  const fetchEvidence = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('evidence_type', typeFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/evidence?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load evidence queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [statusFilter, typeFilter, profile?.region_id, profile?.district_id]);

  const handleVerify = async (projectId: string, evidenceId: string, decision: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence/${evidenceId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ decision, reason }),
      });

      const data = await res.json();
      if (data.success) {
        setEvidenceList((prev) =>
          prev.map((item) =>
            item.id === evidenceId ? { ...item, verification_status: decision } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to moderate evidence:', err);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    await handleVerify(rejectingItem.project_id, rejectingItem.id, 'REJECTED', actionReason);
    setRejectingItem(null);
    setActionReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Site Evidence & Media Moderation Queue
            </h1>
            <Badge className="bg-indigo-700 text-white font-mono text-xs">
              {evidenceList.length} ASSETS
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Validate on-site photographic & video evidence against physical location GPS records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvidence}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Media Assets' },
            { id: 'PENDING', label: 'Pending Verification' },
            { id: 'VERIFIED', label: 'Verified Official' },
            { id: 'REJECTED', label: 'Rejected / Discarded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchEvidence()}
              placeholder="Search by caption, project title, or uploader..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>
          <Button size="sm" onClick={fetchEvidence} className="bg-slate-900 hover:bg-slate-800 text-xs">
            Filter
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
          Loading evidence queue...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white rounded-xl border border-slate-200">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">No media evidence found</div>
          <p className="text-xs text-slate-500">No uploads match the active filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {evidenceList.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:border-slate-300 transition-colors flex flex-col">
              <div className="h-48 bg-slate-100 relative group overflow-hidden">
                <img
                  src={item.file_url}
                  alt={item.caption || 'Site inspection evidence'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 backdrop-blur-xs ${
                      item.verification_status === 'VERIFIED'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                        : item.verification_status === 'REJECTED'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500'
                        : 'bg-slate-900/80 text-amber-300 border-amber-500'
                    }`}
                  >
                    {item.verification_status}
                  </Badge>
                </div>

                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-md hover:bg-black/80 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">
                    {item.project_title || 'Project Evidence'}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.caption || 'No caption provided by uploader.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {item.latitude ? `${Number(item.latitude).toFixed(4)}° N, ${Number(item.longitude).toFixed(4)}° W` : 'No GPS'}
                    </span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {item.verification_status === 'PENDING' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleVerify(item.project_id, item.id, 'VERIFIED')}
                        className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold h-8"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectingItem(item)}
                        className="flex-1 text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-8"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 text-center italic py-1 bg-slate-50 rounded-md">
                      Status determined ({item.verification_status})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              Reject Site Evidence
            </h3>
            <p className="text-xs text-slate-500">
              Provide justification reason for rejecting this photographic evidence (e.g. GPS mismatch, blurry image, duplicate).
            </p>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmReject} className="bg-rose-700 hover:bg-rose-600 text-white">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
