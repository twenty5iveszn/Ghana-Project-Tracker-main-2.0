import React, { useState, useEffect } from 'react';
import { ProjectDocument } from '../../../types/project';
import { Button } from '../../ui/button';
import { DocumentUploadModal } from './DocumentUploadModal';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Download,
  Plus,
  Lock,
  Globe,
  Trash2,
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface DocumentsRepositoryProps {
  projectId: string;
  projectTitle: string;
  projectRegionId?: string;
  projectDistrictId?: string;
}

export const DocumentsRepository: React.FC<DocumentsRepositoryProps> = ({
  projectId,
  projectTitle,
  projectRegionId,
  projectDistrictId,
}) => {
  const { role, profile } = useAuth();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isPrivilegedOfficer =
    Boolean(profile) &&
    (['SUPER_ADMIN', 'NATIONAL_MONITOR'].includes(role) ||
      (role === 'REGIONAL_OFFICER' && profile?.region_id === projectRegionId) ||
      (role === 'MMDCE_OFFICER' && profile?.district_id === projectDistrictId));

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch project documents');
      }
      setDocuments(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading project documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove this official document record?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete document');
      }
      fetchDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getDocIcon = (type: string) => {
    if (type === 'BILL_OF_QUANTITIES') {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    }
    if (type === 'CONTRACT' || type === 'PERMIT') {
      return <FileCheck2 className="h-5 w-5 text-amber-600" />;
    }
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-700" />
            Official Project Documents & Transparency Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Public procurement agreements, approved bills of quantities, permits, and inspection
            reports.
          </p>
        </div>

        {isPrivilegedOfficer && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold text-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            Upload Official Document
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No public documents published yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Contract documents and regulatory permits are uploaded by designated MMDA / RCC
            authorities upon official gazetting.
          </p>
          {isPrivilegedOfficer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-600/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  {getDocIcon(doc.document_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                    {!doc.is_public && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Restricted MMDA Only
                      </span>
                    )}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{formatDate(doc.created_at)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-slate-400" />
                      <span>{doc.uploader_name || 'Designated MMDA Authority'}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {(doc.file_size / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download / View</span>
                </a>

                {isPrivilegedOfficer && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        projectId={projectId}
        projectTitle={projectTitle}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};
