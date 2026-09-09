import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Lock,
  MapPin,
  FileCheck2,
  Layers,
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

interface TestReport {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  cases: TestCase[];
}

interface ProjectSecurityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSecurityTestModal: React.FC<ProjectSecurityTestModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/security-tests');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to run security tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['ALL', 'Security', 'Jurisdiction', 'IDOR', 'Geography', 'Validation', 'Slugs', 'Timeline', 'Archiving', 'Audit & Immutability'];

  const filteredCases = report?.cases.filter(
    (c) => filterCategory === 'ALL' || c.category.toLowerCase().includes(filterCategory.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Phase 3 Security & CRUD Automated Test Suite</h2>
              <p className="text-xs text-slate-300">
                Verifies RBAC, JBAC, IDOR protection, geographic integrity, and audit immutability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runTests}
              disabled={loading}
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-run Suite
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        {report && (
          <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Total Test Cases</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{report.total}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <div className="text-xs text-emerald-700 font-medium">Passed</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{report.passed}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-rose-200">
              <div className="text-xs text-rose-700 font-medium">Failed</div>
              <div className="text-xl font-black text-rose-700 mt-0.5">{report.failed}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Verification Status</div>
              <div className="mt-1">
                {report.allPassed ? (
                  <Badge variant="success" className="text-xs px-2 py-0.5">
                    ALL GREEN (100%)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    FAILURES DETECTED
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap gap-1.5 text-xs overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Test Cases List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-100/50">
          {loading ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm font-medium">Executing Phase 3 authorization and negative scenarios...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No test cases found.</div>
          ) : (
            filteredCases.map((tc) => (
              <div
                key={tc.id}
                className={`p-4 rounded-xl border transition-all ${
                  tc.passed
                    ? 'bg-white border-emerald-200/80 shadow-xs'
                    : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {tc.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500">{tc.id}</span>
                        <h4 className="text-sm font-bold text-slate-900">{tc.name}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50">
                          {tc.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{tc.description}</p>
                      <div className="mt-2 text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                        {tc.details}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        tc.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {tc.httpStatusReceived}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      exp: {tc.httpStatusExpected}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Automated testing against Phase 3 specifications (Section 28 & 29).
          </div>
          <Button onClick={onClose} size="sm">
            Close Test Suite
          </Button>
        </div>
      </div>
    </div>
  );
};
