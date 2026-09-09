import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Project, VerificationStatus } from '../../types/project';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { VerificationBadge } from '../ui/verification-badge';
import { Card, CardContent } from '../ui/card';
import { Alert } from '../ui/alert';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Image as ImageIcon,
  AlertOctagon,
  History,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { formatGHS, formatDate } from '../../lib/utils';

interface ProjectVerificationModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (updatedProject: Project) => void;
}

export const ProjectVerificationModal: React.FC<ProjectVerificationModalProps> = ({
  project,
  isOpen,
  onClose,
  onVerificationComplete,
}) => {
  const { profile, token } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'documents' | 'reports' | 'history'>('overview');

  // Verification Decision Form state
  const [decision, setDecision] = useState<VerificationStatus>('VERIFIED');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification Checklist state
  const [checklist, setChecklist] = useState({
    gpsCoordinatesConfirmed: false,
    procurementContractValid: false,
    billOfQuantitiesAudited: false,
    contractorLicenseActive: false,
    communityConsentAudited: false,
  });

  // History and reports state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setDecision(project.verification_status === 'PENDING' ? 'UNDER_REVIEW' : 'VERIFIED');
      setReason('');
      setNotes('');
      setErrorMsg(null);
      setSuccessMsg(null);
      fetchVerificationHistory(project.id);
    }
  }, [project, isOpen]);

  const fetchVerificationHistory = async (projectId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/projects/${projectId}/verifications`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load verification history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !project) return null;

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecklistCompleted = Object.values(checklist).every(Boolean);

  const handleSubmitVerification = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if ((decision === 'REJECTED' || decision === 'REQUEST_CHANGES') && (!reason || reason.trim().length < 5)) {
      setErrorMsg(`A detailed justification reason (minimum 5 characters) is mandatory when selecting ${decision}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/projects/${project.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          decision,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
          expected_status: project.verification_status,
          checklist,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit verification decision.');
      }

      setSuccessMsg(`Project verification status successfully updated to ${decision}.`);
      setTimeout(() => {
        onVerificationComplete(data.data.project);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                {project.project_code || project.id}
              </span>
              <VerificationBadge status={project.verification_status} />
              <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                {project.category_name || project.category_id}
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white line-clamp-1 mt-1">
              {project.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {project.district_name || project.district_id}, {project.region_name || project.region_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                Budget: {formatGHS(project.budget_allocated)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body & Navigation Tabs */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/80 shrink-0 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Project Dossier
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'evidence'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Site Evidence ({project.evidence?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Official Documents ({project.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              Audit Trail & Timeline ({history.length})
            </button>
          </div>

          {/* Tab Content + Verification Control Split Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
            {/* Left Pane: Dossier Content (7 cols) */}
            <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Description & Scope
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {project.description || 'No detailed scope description provided.'}
                    </p>
                  </div>

                  {/* Key Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        Contractor
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {project.contractor_name || 'Direct Labor / Municipal Force'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        Allocated Budget
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatGHS(project.budget_allocated)}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Start & Target Date
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {project.start_date || 'N/A'} — {project.target_completion_date || 'N/A'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Physical GPS Coordinates
                      </div>
                      <div className="text-xs font-mono font-medium text-slate-900">
                        {project.latitude && project.longitude
                          ? `${Number(project.latitude).toFixed(5)}° N, ${Number(project.longitude).toFixed(5)}° W`
                          : 'Coordinates Pending Field Geotag'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Site Photos & Geotagged Media
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {project.evidence?.length || 0} assets available
                    </span>
                  </div>

                  {!project.evidence || project.evidence.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                      No site media has been uploaded for this project yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {project.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors"
                        >
                          <div className="h-36 bg-slate-100 relative">
                            <img
                              src={ev.file_url}
                              alt={ev.caption || 'Site evidence'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <Badge
                              variant="secondary"
                              className="absolute top-2 right-2 text-[10px] bg-white/90 backdrop-blur-xs font-mono"
                            >
                              {ev.verification_status}
                            </Badge>
                          </div>
                          <div className="p-3 space-y-1">
                            <div className="text-xs font-bold text-slate-900 line-clamp-1">
                              {ev.caption || 'Field Inspection Photo'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>{formatDate(ev.created_at)}</span>
                              <span className="font-mono text-[10px] text-emerald-700">
                                {ev.latitude ? 'GPS Geotagged' : 'No GPS'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Statutory Contracts & Technical Files
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {project.documents?.length || 0} documents
                    </span>
                  </div>

                  {!project.documents || project.documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                      No official procurement or technical documents attached.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 border border-slate-200 rounded-xl bg-white flex items-center justify-between gap-3 hover:border-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{doc.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {doc.document_type} • Uploaded {formatDate(doc.created_at)}
                              </div>
                            </div>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Immutable Historical Verification Trail
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {history.length} audit records
                    </span>
                  </div>

                  {loadingHistory ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Loading verification history...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                      No previous verification reviews recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((h, i) => (
                        <div
                          key={h.id || i}
                          className="p-4 border border-slate-200 rounded-xl bg-white space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-bold ${
                                  h.decision === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : h.decision === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-900 border-rose-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                {h.decision}
                              </Badge>
                              <span className="text-xs text-slate-500 font-medium">
                                by {h.reviewer_name || h.reviewer_email || 'Authorized Officer'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(h.created_at)}
                            </span>
                          </div>

                          {h.reason && (
                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <strong className="text-slate-900">Reason:</strong> {h.reason}
                            </p>
                          )}

                          {h.notes && (
                            <p className="text-xs text-slate-600 italic">
                              Notes: {h.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Pane: Authoritative Verification Action Panel (5 cols) */}
            <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-800" />
                    Officer Decision Dossier
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select authoritative outcome. Decisions are published immediately.
                  </p>
                </div>

                {/* Statutory Checklist */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Statutory Audit Checklist</span>
                    <span className="text-[11px] font-mono text-emerald-800">
                      {Object.values(checklist).filter(Boolean).length}/5 Done
                    </span>
                  </div>

                  <div className="space-y-2 pt-1 text-xs text-slate-700">
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem('gpsCoordinatesConfirmed')}
                      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:text-slate-900"
                    >
                      {checklist.gpsCoordinatesConfirmed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-800 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span>Physical GPS site coordinates confirmed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChecklistItem('procurementContractValid')}
                      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:text-slate-900"
                    >
                      {checklist.procurementContractValid ? (
                        <CheckSquare className="h-4 w-4 text-emerald-800 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span>Statutory procurement contract valid (PPA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChecklistItem('billOfQuantitiesAudited')}
                      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:text-slate-900"
                    >
                      {checklist.billOfQuantitiesAudited ? (
                        <CheckSquare className="h-4 w-4 text-emerald-800 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span>Bill of Quantities (BoQ) audited</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChecklistItem('contractorLicenseActive')}
                      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:text-slate-900"
                    >
                      {checklist.contractorLicenseActive ? (
                        <CheckSquare className="h-4 w-4 text-emerald-800 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span>Contractor registration & licenses verified</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChecklistItem('communityConsentAudited')}
                      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:text-slate-900"
                    >
                      {checklist.communityConsentAudited ? (
                        <CheckSquare className="h-4 w-4 text-emerald-800 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span>Environmental & social impact verified</span>
                    </button>
                  </div>
                </div>

                {/* Decision Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Authoritative Decision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision('VERIFIED')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        decision === 'VERIFIED'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                        <span className="text-xs font-bold">VERIFIED</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Gazette as verified public project
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('UNDER_REVIEW')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        decision === 'UNDER_REVIEW'
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold">UNDER REVIEW</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Field inspection in progress
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('REQUEST_CHANGES')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        decision === 'REQUEST_CHANGES'
                          ? 'border-orange-600 bg-orange-50/80 text-orange-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-bold">REQUEST CHANGES</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Return to submitter for revision
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('REJECTED')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        decision === 'REJECTED'
                          ? 'border-rose-600 bg-rose-50/80 text-rose-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span className="text-xs font-bold">REJECTED</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Non-compliant or disproven
                      </div>
                    </button>
                  </div>
                </div>

                {/* Justification Reason Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Statutory Justification Reason{' '}
                      {(decision === 'REJECTED' || decision === 'REQUEST_CHANGES') && (
                        <span className="text-rose-600 font-mono">* (Mandatory)</span>
                      )}
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {reason.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      decision === 'REJECTED' || decision === 'REQUEST_CHANGES'
                        ? 'Explain why this submission was rejected or what modifications are required...'
                        : 'Optional justification or verification summary notes...'
                    }
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {/* Internal Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Internal Technical Observations (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Field officer observations, reference file #, or inspection dates..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {/* Feedback Messages */}
                {errorMsg && (
                  <Alert variant="error" title="Verification Error">
                    {errorMsg}
                  </Alert>
                )}

                {successMsg && (
                  <Alert variant="success" title="Verification Recorded">
                    {successMsg}
                  </Alert>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitVerification}
                  disabled={isSubmitting}
                  className={`gap-1.5 font-bold text-xs ${
                    decision === 'VERIFIED'
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                      : decision === 'REJECTED'
                      ? 'bg-rose-700 hover:bg-rose-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isSubmitting ? 'Recording Audit...' : `Confirm Decision (${decision})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
