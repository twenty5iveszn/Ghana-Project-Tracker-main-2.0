import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  X,
  MapPin,
  BarChart3,
  Database,
  Lock,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Phase9TestItem {
  id: string;
  name: string;
  category: 'SPATIAL_MAPPING' | 'DATA_PRIVACY' | 'ANALYTICS_INTEGRITY' | 'JURISDICTION' | 'DATA_QUALITY' | 'GEOGRAPHY_DRILLDOWN';
  description: string;
  passed: boolean;
  expectedStatus: string | number;
  actualStatus: string | number;
  message: string;
  details?: any;
}

interface Phase9TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Phase9TestModal({ isOpen, onClose }: Phase9TestModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Phase9TestItem[] | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/phase9-tests');
      const data = await res.json();
      if (data.success && data.data) {
        setResults(data.data.results);
        setSummary(data.data.summary);
      } else {
        throw new Error(data.error?.message || 'Failed to execute Phase 9 test suite');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error executing Phase 9 tests');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !results && !isRunning) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    if (!results || !summary) return;
    const blob = new Blob([JSON.stringify({ summary, results }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase9-test-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Phase 9 Automated Acceptance Suite</h3>
                <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/40 text-[10px]">
                  Map & Public Analytics
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Spatial bounds, row-level data privacy, aggregation integrity, and geographic drill-down
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            {summary ? (
              <>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span>Score:</span>
                  <span className={summary.failed === 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {summary.passed} / {summary.total} Passed
                  </span>
                </div>
                <div className="text-slate-500">Latency: {summary.duration_ms}ms</div>
              </>
            ) : (
              <span className="text-slate-500">Awaiting test execution...</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {summary && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={runTests}
              disabled={isRunning}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1.5"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Re-run Suite'}</span>
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRunning && !results && (
            <div className="py-12 text-center space-y-3">
              <RotateCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Executing 8 spatial validation and analytics test assertions...
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-3">
              {results.map((test) => (
                <div
                  key={test.id}
                  className={`p-4 rounded-xl border text-xs transition-all ${
                    test.passed
                      ? 'bg-white border-emerald-200 shadow-2xs hover:border-emerald-300'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">{test.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono shrink-0 ${
                        test.passed ? 'text-emerald-700 border-emerald-300' : 'text-rose-700 border-rose-300'
                      }`}
                    >
                      {test.category}
                    </Badge>
                  </div>

                  <p className="text-slate-500 mb-2 pl-6">{test.description}</p>

                  <div className="pl-6 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-700 font-medium">{test.message}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Status: <strong className="text-slate-600">{test.actualStatus}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>GhanaBuild 2.0 Engineering Quality Assurance</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
