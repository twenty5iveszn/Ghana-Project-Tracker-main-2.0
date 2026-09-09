import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lock,
  ArrowUpDown,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const AuditLogsViewer: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '25');
      if (entityFilter !== 'ALL') params.append('entity_type', entityFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Immutable System Audit Logs
            </h1>
            <Badge className="bg-slate-900 text-white font-mono text-xs flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" />
              {totalCount} IMMUTABLE ENTRIES
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tamper-proof append-only ledger of all statutory modifications, status transitions, and verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'PROJECT', label: 'Projects' },
            { id: 'PROJECT_EVIDENCE', label: 'Evidence' },
            { id: 'PROJECT_REPORT', label: 'Reports' },
            { id: 'COMMENT', label: 'Comments' },
            { id: 'DOCUMENT', label: 'Documents' },
            { id: 'CONTRACTOR', label: 'Contractors' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setEntityFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                entityFilter === tab.id
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
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              placeholder="Search by action, email, entity ID, or reason..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>
          <Button size="sm" onClick={fetchLogs} className="bg-slate-900 hover:bg-slate-800 text-xs">
            Filter
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ScrollText className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No audit records found</div>
              <p className="text-xs text-slate-500">No matching activity found for this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {log.entity_type}
                          </Badge>
                          <span className="font-mono text-xs text-slate-500">
                            Target: {log.entity_id}
                          </span>
                        </div>

                        {log.reason && (
                          <div className="text-xs text-slate-700 font-medium">
                            <span className="text-slate-400 font-normal">Reason:</span> "{log.reason}"
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Actor: {log.user_email || 'System'}</span>
                          <span>•</span>
                          <span>Log ID: {log.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500 font-mono">
                          {formatDate(log.created_at)}
                        </span>
                        {(log.old_values || log.new_values) && (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable JSON Diff */}
                    {isExpanded && (log.old_values || log.new_values) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                        {log.old_values && (
                          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100 space-y-1">
                            <div className="text-rose-900 font-bold uppercase tracking-wider text-[10px]">
                              Previous State (Before)
                            </div>
                            <pre className="overflow-x-auto text-rose-950 max-h-40">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.new_values && (
                          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 space-y-1">
                            <div className="text-emerald-900 font-bold uppercase tracking-wider text-[10px]">
                              New State (After)
                            </div>
                            <pre className="overflow-x-auto text-emerald-950 max-h-40">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
