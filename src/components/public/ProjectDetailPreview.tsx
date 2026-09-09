import React, { useState, useEffect } from 'react';
import { Project } from '../../types/project';
import { StatusBadge } from '../ui/status-badge';
import { VerificationBadge } from '../ui/verification-badge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Coins,
  TrendingUp,
  Share2,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Check,
  Camera,
  MessageSquareWarning,
  MessageSquare,
  Layers,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { formatGHS, formatDate } from '../../lib/utils';
import { EvidenceGallery } from './evidence/EvidenceGallery';
import { DocumentsRepository } from './documents/DocumentsRepository';
import { ProjectTimeline } from './timeline/ProjectTimeline';
import { VerificationHistory } from './verifications/VerificationHistory';
import { CommunityReportsSummary } from './reports/CommunityReportsSummary';
import { RelatedProjectsSection } from './related/RelatedProjectsSection';
import { Phase5SecurityTestModal } from './Phase5SecurityTestModal';
import { Phase6SecurityTestModal } from './Phase6SecurityTestModal';
import { CivicVotingWidget } from './civic/CivicVotingWidget';
import { ProjectCommentsSection } from './civic/ProjectCommentsSection';
import { FinanceTransparency } from './FinanceTransparency';
import { FieldInspectionsSummary } from './FieldInspectionsSummary';

interface ProjectDetailPreviewProps {
  slugOrId: string;
  onNavigate: (path: string) => void;
}

type TabType = 'overview' | 'finance' | 'inspections' | 'evidence' | 'documents' | 'timeline' | 'verifications' | 'reports' | 'discussion';

export const ProjectDetailPreview: React.FC<ProjectDetailPreviewProps> = ({
  slugOrId,
  onNavigate,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPhase6ModalOpen, setIsPhase6ModalOpen] = useState(false);

  // Counts for tabs
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);
  const [documentsCount, setDocumentsCount] = useState<number | null>(null);

  const fetchProjectData = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${slugOrId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Project not found');
          if (res.status === 403)
            throw new Error(
              'This project is pending official verification and is not yet publicly visible.'
            );
          throw new Error('Failed to load project details');
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setProject(data.data);
          // Pre-fetch count of evidence and documents for badges
          fetch(`/api/projects/${data.data.id}/evidence`)
            .then((r) => r.json())
            .then((ed) => {
              if (ed.success) setEvidenceCount(ed.data?.length || 0);
            })
            .catch(() => {});

          fetch(`/api/projects/${data.data.id}/documents`)
            .then((r) => r.json())
            .then((dd) => {
              if (dd.success) setDocumentsCount(dd.data?.length || 0);
            })
            .catch(() => {});
        } else {
          throw new Error('Malformed project response');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjectData();
  }, [slugOrId]);

  const handleCopyShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-28 animate-pulse" />
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to load project dossier</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">{error || 'Project not found'}</p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to All Projects
          </Button>
        </div>
      </div>
    );
  }

  const categoryName = project.category?.name || 'Infrastructure';
  const regionName = project.region?.name || 'Ghana';
  const districtName = project.district?.name || '';
  const contractorName = project.contractor?.name || 'Designated MMDA Contractor';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Navigation Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => onNavigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects Directory</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTestModalOpen(true)}
            className="text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            title="Run Phase 5 Automated Verification Suite"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Phase 5 Security</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPhase6ModalOpen(true)}
            className="text-xs gap-1.5 border-indigo-300 text-indigo-800 hover:bg-indigo-50"
            title="Run Phase 6 Civic & Voting Verification Suite"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Phase 6 Civic Tests</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyShare}
            className="text-xs gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            {copied ? 'Link Copied!' : 'Share Dossier'}
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => onNavigate(`/submit?project=${encodeURIComponent(project.title)}`)}
            className="text-xs font-bold gap-1.5 text-slate-950"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-900" />
            Report an Issue
          </Button>
        </div>
      </div>

      {/* Main Project Dossier Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
              {categoryName}
            </span>
            <StatusBadge status={project.project_status} />
            <VerificationBadge status={project.verification_status} />
            <span className="text-xs text-slate-400 font-mono ml-auto">ID: {project.id}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                {regionName} &bull; {districtName || 'Regional Jurisdiction'}{' '}
                {project.community?.name ? `&bull; ${project.community.name}` : ''}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{contractorName}</span>
            </span>
          </div>

          {/* Civic Priority Sentiment & Voting Bar */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Civic Priority & Public Sentiment:</span>
            </div>
            <CivicVotingWidget projectId={project.id} size="sm" />
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-emerald-700" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'finance'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Coins className="h-3.5 w-3.5 text-amber-700" />
              <span>Financial Transparency</span>
            </button>

            <button
              onClick={() => setActiveTab('inspections')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'inspections' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Field Inspections</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-emerald-700" />
              <span>Evidence & Media</span>
              {evidenceCount !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-100 text-emerald-900">
                  {evidenceCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'documents'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
              <span>Official Documents</span>
              {documentsCount !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200 text-slate-700">
                  {documentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-emerald-700" />
              <span>Milestone Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'verifications'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Audit History</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquareWarning className="h-3.5 w-3.5 text-amber-600" />
              <span>Citizen Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'discussion'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>Civic Discussion</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Metrics Overview Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Approved Budget
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {formatGHS(project.budget)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {project.currency}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Physical Progress
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                    {project.progress_percentage}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">On-site execution</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Commencement
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {formatDate(project.start_date)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Site handover</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Target Completion
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {formatDate(project.expected_completion_date)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Contract deadline</div>
                </div>
              </div>

              {/* Progress Bar Detail */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                    Physical Works Milestone Completion
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {project.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress_percentage))}%` }}
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Project Scope & Objective
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200">
                  {project.description}
                </p>
              </div>

              {/* Geographic Location & Coordinates */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  Site Location & Coordinates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Region:</span>{' '}
                      <span className="text-slate-900 font-bold">{regionName}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">District:</span>{' '}
                      <span className="text-slate-900 font-bold">{districtName || 'National'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Community:</span>{' '}
                      <span className="text-slate-900">
                        {project.community?.name || project.location_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Site Landmark:</span>{' '}
                      <span className="text-slate-900">{project.location_name}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Geographic Coordinates:</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                      {project.latitude.toFixed(6)}° N, {Math.abs(project.longitude).toFixed(6)}° W
                    </div>
                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                      >
                        Open in External Satellite Maps &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Verification Statement */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-950 text-sm">
                    Official Verification Status: VERIFIED
                  </div>
                  <p className="text-emerald-900 leading-relaxed">
                    This project record is officially gazetted and synchronized with the Ministry of
                    Local Government & Rural Development and verified by the designated Regional
                    Coordinating Council.
                  </p>
                  <div className="pt-1 text-emerald-800 font-mono text-[11px]">
                    Last system audit: {formatDate(project.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <FinanceTransparency
              projectId={project.id}
              projectCurrency={project.currency}
              physicalProgress={project.progress_percentage}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'inspections' && <FieldInspectionsSummary projectId={project.id} />}

          {activeTab === 'evidence' && (
            <EvidenceGallery
              projectId={project.id}
              projectTitle={project.title}
              projectRegionId={project.region_id}
              projectDistrictId={project.district_id}
              latitude={project.latitude}
              longitude={project.longitude}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsRepository
              projectId={project.id}
              projectTitle={project.title}
              projectRegionId={project.region_id}
              projectDistrictId={project.district_id}
            />
          )}

          {activeTab === 'timeline' && (
            <ProjectTimeline
              projectId={project.id}
              projectTitle={project.title}
              currentProgress={project.progress_percentage}
              currentStatus={project.project_status}
              projectRegionId={project.region_id}
              projectDistrictId={project.district_id}
              onProjectUpdated={fetchProjectData}
            />
          )}

          {activeTab === 'verifications' && <VerificationHistory projectId={project.id} />}

          {activeTab === 'reports' && (
            <CommunityReportsSummary
              projectId={project.id}
              projectTitle={project.title}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'discussion' && <ProjectCommentsSection projectId={project.id} />}
        </div>
      </div>

      {/* Related Projects Section */}
      <RelatedProjectsSection projectId={project.id} onNavigate={onNavigate} />

      {/* Phase 5 Automated Test Modal */}
      <Phase5SecurityTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Phase 6 Civic & Voting Test Modal */}
      <Phase6SecurityTestModal
        isOpen={isPhase6ModalOpen}
        onClose={() => setIsPhase6ModalOpen(false)}
      />
    </div>
  );
};
