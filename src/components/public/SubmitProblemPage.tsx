import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert } from '../ui/alert';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  Send,
  Upload,
} from 'lucide-react';

interface SubmitProblemPageProps {
  onNavigate: (path: string) => void;
}

export const SubmitProblemPage: React.FC<SubmitProblemPageProps> = ({ onNavigate }) => {
  const params = new URLSearchParams(window.location.search);
  const initialProject = params.get('project') || '';

  const [projectTitle, setProjectTitle] = useState(initialProject);
  const [reportType, setReportType] = useState('UNREASONABLE_DELAY');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [community, setCommunity] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const [regions, setRegions] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    fetch('/api/geography/regions')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegions(d.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Generate reference code
    const generatedRef = `REP-GH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReferenceId(generatedRef);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-mono text-xs">
              Reference: {referenceId}
            </Badge>
            <h2 className="text-2xl font-black text-slate-900">
              Citizen Report Logged Successfully
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for active civic vigilance. Your report has been registered into the MMDA verification queue for local inspection and cross-audit.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1.5 text-slate-600">
            <div>
              <strong>Project:</strong> {projectTitle || 'General Community Infrastructure'}
            </div>
            <div>
              <strong>Category:</strong> {reportType.replace(/_/g, ' ')}
            </div>
            <div>
              <strong>Location:</strong> {community || 'Community'}, {district || 'District'}, {region || 'Ghana'}
            </div>
            <div>
              <strong>Status:</strong> Queued for District Engineer Field Review
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setDescription('');
                setEvidenceNotes('');
              }}
              className="text-xs"
            >
              Submit Another Report
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => onNavigate('/projects')}
              className="text-xs font-bold text-slate-950"
            >
              Back to Projects Directory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      {/* Back navigation */}
      <button
        onClick={() => onNavigate('/projects')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Projects Explorer</span>
      </button>

      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3 shadow-md">
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono">
            Citizen Oversight Portal
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Report an Infrastructure Problem or Delay
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Help ensure public funds are honestly accounted for. Report stalled work, abandoned sites, sub-standard materials, or misreported milestone completion directly to GhanaBuild monitors.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6"
      >
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Project Name or Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Pokuase-Kwabenya Dual Carriageway or Local Health Post"
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <p className="text-[11px] text-slate-500">
            If you know the official project title from our directory, please enter it above.
          </p>
        </div>

        {/* Issue Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Nature of the Issue <span className="text-rose-500">*</span>
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="UNREASONABLE_DELAY">Unreasonable Delay / Stalled Construction</option>
            <option value="SITE_ABANDONED">Site Abandoned / Contractor Evacuated Equipment</option>
            <option value="POOR_QUALITY">Substandard Material / Structural Defect Observed</option>
            <option value="SAFETY_HAZARD">Public Safety Hazard (Uncovered Pits, Structural Risk)</option>
            <option value="MISREPORTED_PROGRESS">Misreported Progress (Claimed 80% but site is empty)</option>
            <option value="OTHER_CONCERN">Other Infrastructure Concern</option>
          </select>
        </div>

        {/* Region & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Region <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Select Region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Community / Landmark
            </label>
            <input
              type="text"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="e.g. Near Market Junction or Chief's Palace"
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Detailed Observations */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detailed Description of What You Observed <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the current site conditions, when work stopped, or specific structural flaws observed..."
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Site Evidence / Photos Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Photographic Evidence / Notes
          </label>
          <textarea
            rows={2}
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="Mention if you have site photos, video footage, or contractor signage details..."
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Citizen Contact (Optional) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Citizen Contact (Optional & Confidential)
          </div>
          <p className="text-[11px] text-slate-500">
            Provide your phone or email if you wish to receive milestone updates when local MMDA engineers inspect this site.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your Name (optional)"
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone or Email (optional)"
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={submitting}
            className="w-full font-bold text-slate-950 flex items-center justify-center gap-2 shadow-md"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Registering Citizen Report...' : 'Submit Citizen Infrastructure Report'}
          </Button>
        </div>
      </form>
    </div>
  );
};
