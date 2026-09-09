import React, { useState } from 'react';
import { EvidenceType } from '../../../types/project';
import { Button } from '../../ui/button';
import {
  X,
  UploadCloud,
  Camera,
  Video,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  defaultLatitude,
  defaultLongitude,
  onClose,
  onSuccess,
}) => {
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('image/jpeg');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('CONSTRUCTION_PHOTO');
  const [caption, setCaption] = useState('');
  const [capturedAt, setCapturedAt] = useState(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState(defaultLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(defaultLongitude?.toString() || '');
  const [fileSizeMB, setFileSizeMB] = useState('2.5');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample quick presets for rapid testing / demonstration
  const samplePresets: Array<{ label: string; url: string; type: EvidenceType; caption: string }> = [
    {
      label: 'Concrete Foundation Pouring',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80',
      type: 'CONSTRUCTION_PHOTO',
      caption: 'Concrete foundation reinforcement inspection and casting on site.',
    },
    {
      label: 'Structural Steel Erection',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      type: 'INSPECTION_REPORT',
      caption: 'Primary structural steel framework completion verified by resident engineer.',
    },
    {
      label: 'Asphalt Road Pavement Footage',
      url: 'https://images.unsplash.com/photo-1584463699039-399622d140e6?auto=format&fit=crop&w=1200&q=80',
      type: 'SITE_VIDEO',
      caption: 'Aerial perspective of dual carriage road pavement works.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fileUrl.trim()) {
      setError('Please provide a valid image or video media URL.');
      return;
    }

    const sizeNum = parseFloat(fileSizeMB);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      setError('Please enter a valid file size.');
      return;
    }

    const sizeInBytes = Math.round(sizeNum * 1024 * 1024);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: fileUrl.trim(),
          file_type: fileType,
          file_size: sizeInBytes,
          evidence_type: evidenceType,
          caption: caption.trim() || null,
          captured_at: capturedAt ? new Date(capturedAt).toISOString() : new Date().toISOString(),
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit evidence');
      }

      setSuccessMessage(data.message || 'Evidence uploaded successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during evidence upload');
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-700" />
              Submit Project Evidence
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

        {/* Modal Body */}
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
              Quick Verified Sample Assets (Testing / Demo)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setFileUrl(preset.url);
                    setEvidenceType(preset.type as EvidenceType);
                    setCaption(preset.caption);
                  }}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-[11px] text-slate-700 font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Media File URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/... or cloud bucket URL"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports high-resolution JPEG, PNG, WebP photos or MP4/WebM drone videos.
            </p>
          </div>

          {/* Media Format & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Evidence Category
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="CONSTRUCTION_PHOTO">Construction Progress Photo</option>
                <option value="SITE_VIDEO">Site Video Footage</option>
                <option value="INSPECTION_REPORT">Inspection & Field Audit Record</option>
                <option value="COMMUNITY_EVIDENCE">Community Citizen Observation</option>
                <option value="COMPLETION_EVIDENCE">Completion & Commissioning Record</option>
                <option value="DOCUMENT">Official Blueprint / Document</option>
                <option value="OTHER">Other Ground Evidence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                MIME Content Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="image/jpeg">image/jpeg (Photo)</option>
                <option value="image/png">image/png (Photo / Blueprint)</option>
                <option value="image/webp">image/webp (Web Optimized)</option>
                <option value="video/mp4">video/mp4 (Video Footage)</option>
                <option value="video/webm">video/webm (Web Video)</option>
              </select>
            </div>
          </div>

          {/* Captured Date & File Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Capture Date
              </label>
              <input
                type="date"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                File Size (MB)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={fileSizeMB}
                onChange={(e) => setFileSizeMB(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="5.6037"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="-0.1870"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descriptive Caption / Milestone Observations
            </label>
            <textarea
              rows={3}
              placeholder="Describe physical works observed, equipment on site, or specific structural progress..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
            />
          </div>

          {/* Verification Notice */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <strong>Civic Integrity Notice:</strong> All public submissions are audited against
            GhanaBuild community standards. Unverified citizen submissions undergo RCC / MMDA
            moderation before publication to public directories.
          </div>

          {/* Actions */}
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
              <UploadCloud className="h-4 w-4" />
              {submitting ? 'Uploading Evidence...' : 'Submit Evidence'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
