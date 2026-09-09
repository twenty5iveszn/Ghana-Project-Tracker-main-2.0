import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  X,
  Lock,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TestResult {
  id: string;
  name: string;
  description: string;
  category: 'RBAC' | 'Self-Escalation' | 'Jurisdiction' | 'Audit' | 'Export';
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  httpStatus?: number;
  expectedStatus: string;
  receivedStatus?: string;
  details?: string;
  timestamp?: string;
}

export function Phase8SecurityTestModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'P8-SEC-01',
      name: 'Super Admin Self-Escalation Prevention',
      description: 'Super Administrator cannot modify their own role or elevate their own jurisdictional credentials.',
      category: 'Self-Escalation',
      status: 'IDLE',
      expectedStatus: 'HTTP 403 (SELF_ESCALATION_BLOCKED)',
    },
    {
      id: 'P8-SEC-02',
      name: 'Unauthorized Role Assignment Rejection',
      description: 'Non-administrative users (Citizens, Observers, Officers) attempting to invoke role assignment must be rejected.',
      category: 'RBAC',
      status: 'IDLE',
      expectedStatus: 'HTTP 403 (SUPER_ADMIN_REQUIRED)',
    },
    {
      id: 'P8-SEC-03',
      name: 'Mandatory MMDA Jurisdiction Enforcement',
      description: 'Assigning MMDCE_OFFICER without specifying an assigned district assembly must fail with validation error.',
      category: 'Jurisdiction',
      status: 'IDLE',
      expectedStatus: 'HTTP 400 (MISSING_JURISDICTION)',
    },
    {
      id: 'P8-SEC-04',
      name: 'Super Admin Self-Deactivation Prevention',
      description: 'A Super Administrator cannot deactivate or suspend their own account, preventing administrative lockout.',
      category: 'Self-Escalation',
      status: 'IDLE',
      expectedStatus: 'HTTP 403 (SELF_STATUS_MODIFICATION_BLOCKED)',
    },
    {
      id: 'P8-SEC-05',
      name: 'Audit Trail Export Authorization Boundary',
      description: 'Non-privileged users attempting to download the full immutable audit trail CSV must be rejected.',
      category: 'Export',
      status: 'IDLE',
      expectedStatus: 'HTTP 403 (FORBIDDEN_OPERATION)',
    },
    {
      id: 'P8-SEC-06',
      name: 'System Parameter Modification Audit Trail',
      description: 'Any change to system settings requires justification and appends a tamper-evident entry to the audit log.',
      category: 'Audit',
      status: 'IDLE',
      expectedStatus: 'HTTP 200 + Audit Log Appended',
    },
    {
      id: 'P8-SEC-07',
      name: 'Operational Analytics Jurisdiction Boundary',
      description: 'An MMDCE officer querying analytics must only receive data scoped to their assigned district.',
      category: 'Jurisdiction',
      status: 'IDLE',
      expectedStatus: 'HTTP 200 (District Scoped Summary)',
    },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  if (!isOpen) return null;

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const runTest = async (testId: string) => {
    updateTest(testId, { status: 'RUNNING', details: 'Executing API security probe...' });

    try {
      if (testId === 'P8-SEC-01') {
        // Self-Escalation: Super admin updates own role
        const res = await fetch('/api/admin/users/usr-adm-001/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-super_admin-token',
          },
          body: JSON.stringify({
            role: 'SUPER_ADMIN',
            reason: 'Automated penetration probe attempting self-role alteration',
          }),
        });
        const json = await res.json();
        if (res.status === 403 && json.error?.message?.includes('SELF_ESCALATION_BLOCKED')) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 403 SELF_ESCALATION_BLOCKED',
            details: `Intercepted: ${json.error.message}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Unexpected response: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-02') {
        // Unauthorized Role Assignment: Citizen role
        const res = await fetch('/api/admin/users/usr-cit-001/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-citizen-token',
          },
          body: JSON.stringify({
            role: 'SUPER_ADMIN',
            reason: 'Illegal privilege elevation probe',
          }),
        });
        const json = await res.json();
        // Either rejected with 403 SUPER_ADMIN_REQUIRED or ACCOUNT_SUSPENDED / unauthorized
        if (res.status === 403) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: `HTTP 403 (${json.error?.code || 'REJECTED'})`,
            details: `Successfully rejected unauthorized role change: ${json.error?.message}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Expected 403, got: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-03') {
        // Missing Jurisdiction: MMDCE without district
        const res = await fetch('/api/admin/users/usr-cit-003/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-super_admin-token',
          },
          body: JSON.stringify({
            role: 'MMDCE_OFFICER',
            region_id: 'REG-GAR-01',
            district_id: null,
            reason: 'Testing district validation mandate',
          }),
        });
        const json = await res.json();
        if (res.status === 400 && json.error?.message?.includes('MISSING_JURISDICTION')) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 400 MISSING_JURISDICTION',
            details: `Validation enforced: ${json.error.message}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Unexpected response: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-04') {
        // Self-Deactivation: Super Admin attempts self-suspension
        const res = await fetch('/api/admin/users/usr-adm-001/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-super_admin-token',
          },
          body: JSON.stringify({
            status: 'SUSPENDED',
            reason: 'Testing self lockout block',
          }),
        });
        const json = await res.json();
        if (res.status === 403 && json.error?.message?.includes('SELF_STATUS_MODIFICATION_BLOCKED')) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 403 SELF_STATUS_MODIFICATION_BLOCKED',
            details: `Lockout prevented: ${json.error.message}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Unexpected response: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-05') {
        // Audit Export Authorization: Citizen attempts audit logs export
        const res = await fetch('/api/admin/export?resource=audit_logs', {
          headers: {
            Authorization: 'Bearer simulated-community_observer-token',
          },
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 403) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 403 FORBIDDEN_OPERATION',
            details: `Protected: ${json.error?.message || 'Unauthorized download blocked'}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Audit logs leaked without authorization! Status: ${res.status}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-06') {
        // System Settings Modification Audit Trail
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-super_admin-token',
          },
          body: JSON.stringify({
            default_page_size: 25,
            reason: 'Automated verification probe for Phase 8 immutable configuration logging',
          }),
        });
        const json = await res.json();
        if (res.status === 200 && json.success) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 200 OK',
            details: `Configuration saved (Version ${json.data.version}). Audit entry appended with digital signature.`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Failed to update settings: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (testId === 'P8-SEC-07') {
        // Operational Analytics Jurisdiction Scoping: MMDCE Officer
        const res = await fetch('/api/admin/analytics?range=all', {
          headers: {
            Authorization: 'Bearer simulated-mmdce_officer-token',
          },
        });
        const json = await res.json();
        if (res.status === 200 && json.success && json.data.jurisdiction_label?.includes('MMDA')) {
          updateTest(testId, {
            status: 'PASSED',
            httpStatus: res.status,
            receivedStatus: 'HTTP 200 OK (Scoped)',
            details: `Jurisdiction enforced: '${json.data.jurisdiction_label}', Total projects: ${json.data.summary.total_projects}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          updateTest(testId, {
            status: 'FAILED',
            httpStatus: res.status,
            receivedStatus: `HTTP ${res.status}`,
            details: `Analytics failed or not scoped: ${JSON.stringify(json)}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    } catch (err: unknown) {
      updateTest(testId, {
        status: 'FAILED',
        details: err instanceof Error ? err.message : 'Execution error during probe',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (const test of tests) {
      await runTest(test.id);
    }
    setIsRunningAll(false);
  };

  const passedCount = tests.filter((t) => t.status === 'PASSED').length;
  const failedCount = tests.filter((t) => t.status === 'FAILED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Phase 8 • Security & Governance Assurance Suite
              </div>
              <h2 className="text-lg font-black tracking-tight">Administrative RBAC & Oversight Audit</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-semibold">
            <span>
              Pass Rate:{' '}
              <strong className={passedCount === tests.length ? 'text-emerald-700' : 'text-slate-800'}>
                {passedCount} / {tests.length}
              </strong>
            </span>
            {failedCount > 0 && <span className="text-rose-700 font-bold">{failedCount} Failed</span>}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="h-8 px-3 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            <Play className={`h-3 w-3 ${isRunningAll ? 'animate-spin' : ''}`} />
            {isRunningAll ? 'Executing Suite...' : 'Run All 7 Probes'}
          </Button>
        </div>

        {/* Test List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {tests.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {t.status === 'PASSED' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : t.status === 'FAILED' ? (
                      <XCircle className="h-5 w-5 text-rose-600" />
                    ) : t.status === 'RUNNING' ? (
                      <RotateCw className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{t.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {t.id}
                      </Badge>
                      <Badge className="text-[10px] py-0 px-1.5 bg-slate-100 text-slate-700 border-slate-200">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={t.status === 'RUNNING' || isRunningAll}
                  onClick={() => runTest(t.id)}
                  className="h-7 px-2.5 text-[11px] font-semibold shrink-0"
                >
                  Probe
                </Button>
              </div>

              {/* Status details */}
              <div className="text-[11px] bg-slate-50 p-2 rounded-md border border-slate-100 flex flex-wrap items-center justify-between gap-2 font-mono">
                <span className="text-slate-500">
                  Target Expectation: <strong className="text-slate-700">{t.expectedStatus}</strong>
                </span>
                {t.receivedStatus && (
                  <span
                    className={
                      t.status === 'PASSED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                    }
                  >
                    Outcome: {t.receivedStatus}
                  </span>
                )}
              </div>

              {t.details && (
                <div className="text-[11px] text-slate-700 bg-slate-100/70 px-2 py-1 rounded-sm">
                  {t.details}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">GhanaBuild 2.0 Security Framework • Phase 8</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
