import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert } from '../ui/alert';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Lock,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';

interface Phase7SecurityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase7SecurityTestModal: React.FC<Phase7SecurityTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [testReport, setTestReport] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runTests = async () => {
    try {
      setRunning(true);
      setErrorMsg(null);
      const res = await fetch('/api/tests/phase7-security-tests', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestReport(data.data);
      } else {
        throw new Error(data.error?.message || 'Security tests failed to execute');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to run security suite');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !testReport) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-black tracking-tight text-white">
                Phase 7 Verification & Security Test Suite
              </h2>
              <Badge className="bg-amber-600 text-white font-mono text-xs">
                AUTOMATED SUITE
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Validating Jurisdiction Isolation (JBAC), Role-Based Access (RBAC), Workflow Concurrency, and Audit Immutability.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Summary Row */}
          {testReport && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Tests
                </div>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {testReport.total}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-center">
                <div className="text-xs text-emerald-800 uppercase tracking-wider font-semibold">
                  Passed Tests
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  {testReport.passed}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Failed Tests
                </div>
                <div className={`text-3xl font-black mt-1 ${testReport.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {testReport.failed}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <Alert variant="error" title="Security Test Suite Error">
              {errorMsg}
            </Alert>
          )}

          {/* Test List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Test Assertions & Security Results
            </h3>

            {running ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-800" />
                <div className="font-semibold text-slate-700">Executing Phase 7 Security Probes...</div>
                <p className="text-xs text-slate-400">
                  Simulating cross-district bypasses, unauthorized citizen verifications, and audit tampering.
                </p>
              </div>
            ) : !testReport?.results ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No test results available. Click "Run Tests" below.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {testReport.results.map((test: any) => (
                  <div key={test.id} className="p-4 space-y-2 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {test.id}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase bg-slate-50"
                          >
                            {test.category}
                          </Badge>
                          <span className="text-sm font-bold text-slate-900">
                            {test.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{test.description}</p>
                      </div>

                      <div className="shrink-0">
                        {test.passed ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                            PASSED
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-xs gap-1">
                            <XCircle className="h-3.5 w-3.5 text-rose-700" />
                            FAILED
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                      {test.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-700" />
            <span>Government of Ghana Security Standard ISO 27001 & Statutory PPA Act 663</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={running}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={runTests}
              disabled={running}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
              Re-run Security Suite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
