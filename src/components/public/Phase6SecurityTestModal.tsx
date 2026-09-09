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
  MessageSquareWarning,
  MessageSquare,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';

interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  httpStatusExpected?: number;
  httpStatusReceived?: number;
  details: string;
}

interface Phase6TestSuiteResponse {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  cases: TestCaseResult[];
}

interface Phase6SecurityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase6SecurityTestModal: React.FC<Phase6SecurityTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<Phase6TestSuiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/phase6-security-tests');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to run Phase 6 security tests');
      }
      setSuiteResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute Phase 6 test suite');
    } finally {
      setRunning(false);
    }
  };

  const categories = suiteResult
    ? ['ALL', ...Array.from(new Set(suiteResult.cases.map((r) => r.category)))]
    : ['ALL'];

  const filteredResults = suiteResult
    ? suiteResult.cases.filter(
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase">
                  Phase 6 Verification
                </span>
                <span className="text-xs text-slate-400">14 Security Invariants</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Citizen Reporting, Civic Discussions & Priority Voting Suite
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action / Banner Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={runTests}
              disabled={running}
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md"
            >
              {running ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Executing Phase 6 Invariants...
                </>
              ) : suiteResult ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Rerun Invariant Suite
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Execute 14 Phase 6 Invariants
                </>
              )}
            </Button>

            {suiteResult && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    suiteResult.allPassed
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  {suiteResult.allPassed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-700" />
                  )}
                  {suiteResult.passed} of {suiteResult.total} Passed (
                  {Math.round((suiteResult.passed / suiteResult.total) * 100)}%)
                </span>
              </div>
            )}
          </div>

          {/* Category Filter Pills */}
          {suiteResult && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block font-bold">Execution Error:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!suiteResult && !running && (
            <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Run Automated Phase 6 Invariants</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Click below to execute the live server-authoritative security test suite. Validates citizen report creation, input validation, submitter privacy isolation, cross-district resolution enforcement (JBAC), automated civility filters, public visibility limits, and voting constraints.
                </p>
              </div>
              <Button
                onClick={runTests}
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2"
              >
                <Play className="h-4 w-4" />
                Start Test Execution
              </Button>
            </div>
          )}

          {running && (
            <div className="py-20 text-center space-y-4">
              <div className="h-12 w-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-600">
                Evaluating security assertions against ProjectStore & audit logs...
              </div>
            </div>
          )}

          {suiteResult && (
            <div className="space-y-3">
              {filteredResults.map((test) => (
                <div
                  key={test.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    test.passed
                      ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                      : 'bg-rose-50/50 border-rose-200/80 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {test.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {test.id}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{test.name}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                            {test.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{test.description}</p>
                        <div className="text-[11px] font-mono text-slate-500 bg-white/70 p-2 rounded-xl border border-slate-200/60 mt-2">
                          {test.details}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                          test.passed
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'bg-rose-200/70 text-rose-900'
                        }`}
                      >
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      {test.httpStatusExpected && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          HTTP {test.httpStatusReceived} (Exp: {test.httpStatusExpected})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>GhanaBuild 2.0 • Phase 6 Civic Acceptance Standard</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-bold">
            Close Runner
          </Button>
        </div>
      </div>
    </div>
  );
};
