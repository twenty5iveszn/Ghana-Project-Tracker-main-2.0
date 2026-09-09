import React, { useState } from 'react';
import { Button } from '../../ui/button';
import {
  X,
  FileUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [documentType, setDocumentType] = useState('CONTRACT');
  const [fileSizeMB, setFileSizeMB] = useState('3.2');
  const [isPublic, setIsPublic] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    {
      name: 'PPA Approved Public Procurement Contract Agreement',
      type: 'CONTRACT',
      url: 'https://ghanabuild.gov.gh/docs/contracts/ppa-tender-agreement-001.pdf',
      description: 'Fully signed Government of Ghana works contract with Consar Limited.',
    },
    {
      name: 'EPA Environmental Impact Assessment Certification',
      type: 'PERMIT',
      url: 'https://ghanabuild.gov.gh/docs/permits/epa-gh-permit-2024.pdf',
      description: 'Statutory environmental clearance issued by the EPA Ghana.',
    },
    {
      name: 'Approved Bill of Quantities & Structural Schedule',
      type: 'BILL_OF_QUANTITIES',
      url: 'https://ghanabuild.gov.gh/docs/boq/bill-of-quantities-milestone.xlsx',
      description: 'Certified breakdown of engineering quantities and material cost lines.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Document title is required.');
      return;
    }

    if (!fileUrl.trim()) {
      setError('Document file URL is required.');
      return;
    }

    const sizeNum = parseFloat(fileSizeMB);
    const sizeInBytes = Math.round((isNaN(sizeNum) ? 1 : sizeNum) * 1024 * 1024);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          file_url: fileUrl.trim(),
          document_type: documentType,
          file_size: sizeInBytes,
          is_public: isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload document');
      }

      setSuccessMessage('Official document uploaded successfully.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-emerald-700" />
              Upload Official Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{projectTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Document Templates (Demo / Testing)
            </label>
            <div className="space-y-1.5">
              {samplePresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setName(preset.name);
                    setDocumentType(preset.type);
                    setFileUrl(preset.url);
                    setDescription(preset.description);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all text-xs text-slate-800 flex items-center justify-between"
                >
                  <span className="font-semibold">{preset.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {preset.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ministry of Roads & Highways Contract Agreement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Type & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Classification
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="CONTRACT">Public Works Contract</option>
                <option value="PERMIT">Permit & Regulatory Approval</option>
                <option value="BILL_OF_QUANTITIES">Bill of Quantities (BOQ)</option>
                <option value="INSPECTION_REPORT">Site Inspection & Audit Report</option>
                <option value="ENVIRONMENTAL_ASSESSMENT">Environmental Impact Report</option>
                <option value="OTHER">Other Public Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                File Size (MB)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                value={fileSizeMB}
                onChange={(e) => setFileSizeMB(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Download URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://... secure PDF or spreadsheet link"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Executive Summary
            </label>
            <textarea
              rows={2}
              placeholder="Summary of document purpose, approvals, signatory authority..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {isPublic ? 'Publicly Visible Document' : 'Restricted Internal Document'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isPublic
                    ? 'All citizens and researchers can view and download this record'
                    : 'Confidential: Accessible exclusively to verified MMDA / RCC officers'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublic ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold"
            >
              <FileUp className="h-4 w-4" />
              {submitting ? 'Uploading Document...' : 'Publish Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
