import React, { useState } from 'react';
import { ReportType, ReportSeverity } from '../../../types/project';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  AlertTriangle,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Camera,
} from 'lucide-react';
import { Button } from '../../ui/button';

interface SubmitReportModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onReportCreated,
}) => {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('SAFETY_CONCERN');
  const [severity, setSeverity] = useState<ReportSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be signed in as a citizen or officer to file a formal issue report.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters long describing the observed condition.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          report_type: reportType,
          severity,
          description: description.trim(),
          location_notes: locationNotes.trim() || undefined,
          evidence_url: evidenceUrl.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit report');
      }

      setSuccessReport(data.data);
      if (onReportCreated) onReportCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error filing report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-100" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Report Site Issue</h3>
              <p className="text-[11px] text-amber-100 line-clamp-1">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successReport ? (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Report Registered in Official Queue</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Reference ID: <span className="font-mono font-bold text-slate-900">{successReport.id}</span>
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your observation has been assigned to the responsible Municipal District Assembly (MMDA)
                and Regional Coordinating Council (RCC) monitoring officers for verification.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="bg-slate-900 text-white text-xs font-bold px-6"
              >
                Close & View Updates
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Issue Classification *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="SAFETY_CONCERN">Safety Hazard / Exposed Excavation / Missing Guardrails</option>
                <option value="POOR_WORKMANSHIP">Poor Workmanship / Structural Cracks / Material Defects</option>
                <option value="DELAYED">Unreasonable Delays / Site Inactivity</option>
                <option value="ABANDONED">Site Abandoned / Contractor Demobilized</option>
                <option value="ENVIRONMENTAL_CONCERN">Environmental Impact / Erosion / Blocked Drainage</option>
                <option value="INCORRECT_INFORMATION">Discrepancy with Official Signboard / Budget</option>
                <option value="OTHER">Other Community Observation</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Urgency / Severity Level *</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as ReportSeverity[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      severity === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : lvl === 'HIGH'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Detailed Condition Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you observed on site (e.g. guardrails missing at KM 2+300, stagnant water flooding nearby school compound)..."
                required
                minLength={10}
                maxLength={2000}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
              />
              <div className="text-[10px] text-slate-400 text-right mt-0.5">
                {description.length}/2000 characters (min. 10)
              </div>
            </div>

            {/* Location Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Specific Site Location or Landmark (Optional)
              </label>
              <input
                type="text"
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                placeholder="e.g. Near the main market junction or culvert bridge 4"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Evidence URL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Camera className="h-3.5 w-3.5 text-slate-400" />
                Evidence Photo URL (Optional)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://... photo or document link"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Contact Phone for Field Inspector Clarification (Optional)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+233 24 123 4567"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || description.trim().length < 10}
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Submitting...' : 'Transmit Report to MMDA'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
