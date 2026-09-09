import React from 'react';
import { ProjectEvidence } from '../../../types/project';
import { Button } from '../../ui/button';
import { VerificationBadge } from '../../ui/verification-badge';
import {
  X,
  MapPin,
  Calendar,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface EvidenceLightboxModalProps {
  isOpen: boolean;
  evidence: ProjectEvidence | null;
  onClose: () => void;
  canModerate?: boolean;
  canDelete?: boolean;
  onVerify?: (evidenceId: string, decision: 'VERIFIED' | 'REJECTED') => void;
  onDelete?: (evidenceId: string) => void;
}

export const EvidenceLightboxModal: React.FC<EvidenceLightboxModalProps> = ({
  isOpen,
  evidence,
  onClose,
  canModerate = false,
  canDelete = false,
  onVerify,
  onDelete,
}) => {
  if (!isOpen || !evidence) return null;

  const isVideo =
    evidence.file_type.startsWith('video/') ||
    evidence.file_url.endsWith('.mp4') ||
    evidence.file_url.endsWith('.webm');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
              {evidence.evidence_type.replace(/_/g, ' ')}
            </span>
            <VerificationBadge status={evidence.verification_status} />
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              ID: {evidence.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Lightbox"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media Preview Stage */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[55vh] overflow-hidden">
          {isVideo ? (
            <video
              src={evidence.file_url}
              controls
              autoPlay
              className="max-h-[55vh] w-auto max-w-full object-contain"
            >
              Your browser does not support HTML video.
            </video>
          ) : (
            <img
              src={evidence.file_url}
              alt={evidence.caption || 'Project evidence preview'}
              className="max-h-[55vh] w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Media Metadata & Caption */}
        <div className="p-6 bg-slate-900 text-white space-y-4 overflow-y-auto">
          {evidence.caption && (
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              &ldquo;{evidence.caption}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span>Captured Date</span>
              </div>
              <div className="font-bold text-slate-200 mt-1">
                {formatDate(evidence.captured_at || evidence.created_at)}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-400" />
                <span>Submitted By</span>
              </div>
              <div className="font-bold text-slate-200 mt-1 truncate">
                {evidence.uploader_name || 'Community Observer'}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                <span>Geotag Coordinates</span>
              </div>
              <div className="font-mono text-slate-200 mt-1">
                {evidence.latitude && evidence.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>
                      {evidence.latitude.toFixed(4)}°, {evidence.longitude.toFixed(4)}°
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-500">Not recorded</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>File Size</span>
              </div>
              <div className="font-mono text-slate-200 mt-1">
                {(evidence.file_size / 1048576).toFixed(2)} MB
              </div>
            </div>
          </div>

          {/* Officer Moderation Bar */}
          {(canModerate || canDelete) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-3">
              <div className="text-xs text-amber-400 font-medium">
                Official Administrative Moderation Actions:
              </div>
              <div className="flex items-center gap-2">
                {canModerate && evidence.verification_status !== 'VERIFIED' && onVerify && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
                    onClick={() => onVerify(evidence.id, 'VERIFIED')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve as Verified
                  </Button>
                )}

                {canModerate && evidence.verification_status !== 'REJECTED' && onVerify && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-950/50 text-xs gap-1.5"
                    onClick={() => onVerify(evidence.id, 'REJECTED')}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Submission
                  </Button>
                )}

                {canDelete && onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-900 text-xs gap-1.5"
                    onClick={() => onDelete(evidence.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Evidence
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
