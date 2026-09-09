import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TestCase {
  id: string;
  category: string;
  name: string;
  description: string;
  passed: boolean;
  httpStatusExpected: number;
  httpStatusReceived: number;
  details: string;
}

interface TestSuiteResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  cases: TestCase[];
}

interface PublicSecurityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicSecurityTestModal: React.FC<PublicSecurityTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<TestSuiteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/public-security-tests');
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Failed to run public explorer security tests:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-lg">Phase 4 Acceptance & Security Verification</h3>
            </div>
            <p className="text-xs text-slate-400">
              Automated audit verifying public visibility rules, parameter tamper resistance, and query safety.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Explorer Acceptance Suite
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                8 tests inspecting data constraints and public API safeguards
              </div>
            </div>
            <Button
              variant="gold"
              size="sm"
              disabled={loading}
              onClick={runTests}
              className="text-xs font-bold text-slate-950 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Running...' : 'Run Automated Tests'}
            </Button>
          </div>

          {results ? (
            <div className="space-y-3">
              {/* Summary Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  results.allPassed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {results.allPassed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm">
                    {results.allPassed
                      ? 'All Phase 4 Acceptance Tests Passed (8/8)'
                      : `${results.failed} Test(s) Failed`}
                  </span>
                </div>
                <Badge
                  className={
                    results.allPassed
                      ? 'bg-emerald-600 text-white font-mono text-xs'
                      : 'bg-rose-600 text-white font-mono text-xs'
                  }
                >
                  {results.passed} / {results.total} Passed
                </Badge>
              </div>

              {/* Case Items */}
              <div className="space-y-2">
                {results.cases.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {c.id}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                      {c.description}
                    </p>
                    <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded ml-6 mt-1 border border-slate-100">
                      {c.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
              <p>Click "Run Automated Tests" to execute the Phase 4 test suite.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
