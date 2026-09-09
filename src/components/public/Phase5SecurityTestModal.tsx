import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  FileCheck2,
  Lock,
  Eye,
  Database,
} from 'lucide-react';

interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  details: string;
}

interface TestSuiteSummary {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  execution_ms: number;
  results: TestCaseResult[];
}

interface Phase5SecurityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase5SecurityTestModal: React.FC<Phase5SecurityTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<TestSuiteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/phase5-security-tests');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to run Phase 5 security tests');
      }
      setSuiteResult(data.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute test suite');
    } finally {
      setRunning(false);
    }
  };

  const categories = suiteResult
    ? ['ALL', ...Array.from(new Set(suiteResult.results.map((r) => r.category)))]
    : ['ALL'];

  const filteredResults = suiteResult
    ? suiteResult.results.filter(
        (r) => activeCategory === 'ALL' || r.category === activeCategory
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Phase 5 Security & Data-Integrity Verification
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Automated test suite validating Evidence Uploads, Document JBAC, Privacy Sanitization & Pagination
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action & Metric Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={runTests}
              disabled={running}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold text-xs"
            >
              {running ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  Running 14 Automated Verification Tests...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  {suiteResult ? 'Re-Run Acceptance Suite' : 'Execute Acceptance Tests'}
                </>
              )}
            </Button>
          </div>

          {suiteResult && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-600">
                Total: <strong className="text-slate-900">{suiteResult.total}</strong>
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                Passed: {suiteResult.passed}
              </span>
              {suiteResult.failed > 0 && (
                <span className="font-semibold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Failed: {suiteResult.failed}
                </span>
              )}
              <span className="text-slate-400 font-mono">
                {suiteResult.execution_ms}ms execution
              </span>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!suiteResult && !running && (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <FileCheck2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Ready to Verify Phase 5 Acceptance Criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Click &ldquo;Execute Acceptance Tests&rdquo; to run the test suite against the live
                server. The suite validates evidence moderation, document jurisdiction boundaries
                (JBAC), file size caps, privacy masking (no PII leak), and paginated endpoints.
              </p>
            </div>
          )}

          {running && (
            <div className="py-16 text-center space-y-3">
              <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">
                Running Phase 5 verification test matrix...
              </div>
              <div className="text-[11px] text-slate-500">
                Verifying jurisdiction boundaries, upload constraints, and report privacy masking.
              </div>
            </div>
          )}

          {suiteResult && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Test Cases List */}
              <div className="space-y-3">
                {filteredResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      t.passed
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {t.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-600" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {t.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {t.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {t.description}
                          </p>
                          <div className="font-mono text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/80 mt-2">
                            {t.details}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
