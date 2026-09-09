import React, { useState, useEffect } from 'react';
import { ProjectEvidence, EvidenceType } from '../../../types/project';
import { Button } from '../../ui/button';
import { VerificationBadge } from '../../ui/verification-badge';
import { EvidenceLightboxModal } from './EvidenceLightboxModal';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  Camera,
  Plus,
  Play,
  MapPin,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface EvidenceGalleryProps {
  projectId: string;
  projectTitle: string;
  projectRegionId?: string;
  projectDistrictId?: string;
  latitude?: number;
  longitude?: number;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  projectId,
  projectTitle,
  projectRegionId,
  projectDistrictId,
  latitude,
  longitude,
}) => {
  const { isAuthenticated, role, profile } = useAuth();

  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const [activeLightboxEvidence, setActiveLightboxEvidence] = useState<ProjectEvidence | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Determine officer permissions for moderation
  const isPrivilegedOfficer =
    Boolean(profile) &&
    (['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(role) ||
      (role === 'REGIONAL_OFFICER' && profile?.region_id === projectRegionId) ||
      (role === 'MMDCE_OFFICER' && profile?.district_id === projectDistrictId));

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch evidence');
      }
      setEvidenceList(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading project evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [projectId]);

  const handleVerify = async (evidenceId: string, decision: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence/${evidenceId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to moderate evidence');
      }
      // Refresh list
      fetchEvidence();
      if (activeLightboxEvidence?.id === evidenceId) {
        setActiveLightboxEvidence(data.data);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Moderation error');
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this evidence item?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence/${evidenceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete evidence');
      }
      setActiveLightboxEvidence(null);
      fetchEvidence();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete error');
    }
  };

  const filterOptions = [
    { id: 'ALL', label: 'All Media', count: evidenceList.length },
    {
      id: 'CONSTRUCTION_PHOTO',
      label: 'Site Photos',
      count: evidenceList.filter((e) => e.evidence_type === 'CONSTRUCTION_PHOTO').length,
    },
    {
      id: 'SITE_VIDEO',
      label: 'Drone / Video',
      count: evidenceList.filter((e) => e.evidence_type === 'SITE_VIDEO').length,
    },
    {
      id: 'INSPECTION_REPORT',
      label: 'Inspections',
      count: evidenceList.filter((e) => e.evidence_type === 'INSPECTION_REPORT').length,
    },
    {
      id: 'COMMUNITY_EVIDENCE',
      label: 'Community Submissions',
      count: evidenceList.filter((e) => e.evidence_type === 'COMMUNITY_EVIDENCE').length,
    },
  ];

  const filteredEvidence = evidenceList.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.evidence_type === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-700" />
            Verified Field Evidence & Media
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Photographic and video documentation verified by regional monitors and civil inspectors.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            Submit Evidence
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {filterOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedFilter === tab.id ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Camera className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No evidence items in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to submit photographic verification or drone footage of current site
            progress.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Evidence
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvidence.map((item) => {
            const isVideo =
              item.file_type.startsWith('video/') ||
              item.file_url.endsWith('.mp4') ||
              item.file_url.endsWith('.webm');

            return (
              <div
                key={item.id}
                onClick={() => setActiveLightboxEvidence(item)}
                className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Image / Video Thumbnail Container */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.caption || 'Project evidence'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                  {/* Play icon overlay if video */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/20">
                      {item.evidence_type.replace(/_/g, ' ')}
                    </span>
                    <VerificationBadge status={item.verification_status} />
                  </div>

                  {/* Bottom Timestamp & Geotag */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      <span>{formatDate(item.captured_at || item.created_at)}</span>
                    </span>
                    {item.latitude && item.longitude && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <MapPin className="h-3 w-3" />
                        <span>GPS</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Caption & Metadata */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 text-xs">
                  <p className="text-slate-700 font-medium line-clamp-2 leading-relaxed">
                    {item.caption || 'Verified physical works inspection evidence.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[160px]">{item.uploader_name || 'Observer'}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {(item.file_size / 1048576).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <EvidenceLightboxModal
        isOpen={Boolean(activeLightboxEvidence)}
        evidence={activeLightboxEvidence}
        onClose={() => setActiveLightboxEvidence(null)}
        canModerate={isPrivilegedOfficer}
        canDelete={isPrivilegedOfficer}
        onVerify={handleVerify}
        onDelete={handleDelete}
      />

      {/* Upload Modal */}
      <EvidenceUploadModal
        isOpen={isUploadModalOpen}
        projectId={projectId}
        projectTitle={projectTitle}
        defaultLatitude={latitude}
        defaultLongitude={longitude}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchEvidence}
      />
    </div>
  );
};
