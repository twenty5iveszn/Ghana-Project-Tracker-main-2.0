/**
 * GhanaBuild 2.0 Project, Status, Evidence & Report Definitions
 * Strictly maps to Sections 10, 11, 12, 15, 16, 17 of the specification.
 */

export type ProjectStatus =
  | 'PLANNED'
  | 'ONGOING'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'CANCELLED';

export type VerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REQUEST_CHANGES'
  | 'ARCHIVED';

export type EvidenceType =
  | 'CONSTRUCTION_PHOTO'
  | 'SITE_VIDEO'
  | 'DOCUMENT'
  | 'COMPLETION_EVIDENCE'
  | 'FINANCIAL_DOCUMENT'
  | 'COMMUNITY_EVIDENCE'
  | 'GOVERNMENT_EVIDENCE'
  | 'INSPECTION_REPORT'
  | 'OTHER';

export type ReportType =
  | 'DELAYED'
  | 'POOR_WORKMANSHIP'
  | 'ABANDONED'
  | 'INCORRECT_INFORMATION'
  | 'ENVIRONMENTAL_CONCERN'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'REJECTED';

export interface Region {
  id: string;
  name: string;
  code: string;
  capital: string;
  created_at?: string;
}

export interface District {
  id: string;
  region_id: string;
  name: string;
  district_type: string;
  created_at?: string;
}

export interface Community {
  id: string;
  district_id: string;
  name: string;
  created_at?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  created_at?: string;
}

export interface Contractor {
  id: string;
  name: string;
  slug?: string;
  registration_number?: string | null;
  tin_number?: string | null;
  category_specialization?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  website?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  year_established?: number | null;
  created_at: string;
  updated_at: string;
}

export type FiscalFundingStatus = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'CANCELLED';
export type FiscalCommitmentStatus = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type FiscalTrancheStatus = 'PLANNED' | 'APPROVED' | 'PARTIALLY_DISBURSED' | 'DISBURSED' | 'SUSPENDED' | 'CANCELLED';
export type FiscalPaymentStatus = 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REVERSED' | 'CANCELLED';
export type FiscalVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type FiscalExpenditureCategory = 'LABOUR' | 'MATERIALS' | 'EQUIPMENT' | 'TRANSPORT' | 'PROFESSIONAL_SERVICES' | 'LAND' | 'ADMINISTRATION' | 'OTHER';

export interface ProjectFunding {
  id: string; project_id: string; funding_source: string; funding_reference?: string | null;
  allocated_amount: number; currency: string; allocation_date: string; fiscal_year: number;
  funding_status: FiscalFundingStatus; notes?: string | null; created_by: string; created_at: string; updated_at: string;
}
export interface ProjectCommitment {
  id: string; project_id: string; contractor_id?: string | null; commitment_reference: string;
  committed_amount: number; currency: string; commitment_date: string; approved_by?: string | null;
  status: FiscalCommitmentStatus; notes?: string | null; created_by: string; created_at: string; updated_at: string;
}
export interface ProjectTranche {
  id: string; project_id: string; commitment_id: string; tranche_number: number; tranche_name: string;
  approved_amount: number; currency: string; approval_date?: string | null; scheduled_disbursement_date?: string | null;
  status: FiscalTrancheStatus; notes?: string | null; created_by: string; created_at: string; updated_at: string;
}
export interface ProjectDisbursement {
  id: string; project_id: string; tranche_id: string; disbursement_reference: string; amount: number; currency: string;
  disbursement_date: string; payment_status: FiscalPaymentStatus; payment_method?: string | null;
  source_reference?: string | null; notes?: string | null; created_by: string; created_at: string; updated_at: string;
}
export interface ProjectExpenditure {
  id: string; project_id: string; disbursement_id?: string | null; expenditure_reference: string; amount: number; currency: string;
  expenditure_date: string; expenditure_category: FiscalExpenditureCategory; description: string;
  verification_status: FiscalVerificationStatus; verified_by?: string | null; verified_at?: string | null;
  source_document_id?: string | null; created_by: string; created_at: string; updated_at: string;
}
export interface ProjectFiscalSummary {
  project_id: string; currency: string; total_allocated: number; total_committed: number; total_tranche_value: number;
  total_disbursed: number; total_reported_expenditure: number; verified_expenditure: number;
  remaining_allocation: number; remaining_commitment: number; physical_progress: number; disbursement_progress: number;
  financial_physical_variance: number | null; flags: Array<{ code: string; severity: 'INFO' | 'ATTENTION' | 'HIGH'; message: string; threshold: string }>;
}
export interface ProjectFiscalRecords {
  summary: ProjectFiscalSummary; funding: ProjectFunding[]; commitments: ProjectCommitment[]; tranches: ProjectTranche[];
  disbursements: ProjectDisbursement[]; expenditures: ProjectExpenditure[];
}

export type InspectionSyncStatus = 'LOCAL_DRAFT' | 'QUEUED' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED' | 'CONFLICT';
export type InspectionVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type InspectionType = 'ROUTINE' | 'PROGRESS' | 'QUALITY' | 'SAFETY' | 'COMPLETION' | 'FOLLOW_UP' | 'OTHER';
export type InspectionIssueType = 'DELAYED_WORK' | 'POOR_WORKMANSHIP' | 'INCOMPLETE_WORK' | 'SAFETY_CONCERN' | 'ENVIRONMENTAL_CONCERN' | 'MISSING_MATERIALS' | 'SITE_INACTIVITY' | 'INCORRECT_INFORMATION' | 'OTHER';

export interface FieldInspection {
  id: string; client_id: string; project_id: string; inspector_id: string; inspection_reference: string;
  inspection_date: string; inspection_type: InspectionType; observed_status: ProjectStatus;
  observed_progress_percentage: number; observations: string; issues_found: InspectionIssueType[];
  safety_observations?: string | null; environmental_observations?: string | null; latitude?: number | null;
  longitude?: number | null; gps_accuracy?: number | null; captured_at: string; device_timestamp: string;
  sync_status: InspectionSyncStatus; verification_status: InspectionVerificationStatus;
  server_received_at?: string | null; reviewed_by?: string | null; reviewed_at?: string | null;
  review_notes?: string | null; distance_from_project_meters?: number | null; created_at: string; updated_at: string;
}

export interface InspectionPublicSummary {
  id: string; project_id: string; inspection_date: string; inspection_type: InspectionType;
  observed_status: ProjectStatus; observed_progress_percentage: number; observations: string;
  verification_status: 'VERIFIED'; captured_at: string; evidence_count: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  region_id: string;
  district_id: string;
  community_id?: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  contractor_id?: string | null;
  budget: number;
  currency: string;
  start_date?: string | null;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  progress_percentage: number;
  project_status: ProjectStatus;
  verification_status: VerificationStatus;
  created_by?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  project_code?: string;
  category_name?: string;
  region_name?: string;
  district_name?: string;
  community_name?: string;
  contractor_name?: string;
  budget_allocated?: number;
  target_completion_date?: string | null;
  evidence?: ProjectEvidence[];
  documents?: ProjectDocument[];
  category?: ProjectCategory;
  region?: Region;
  district?: District;
  community?: Community;
  contractor?: Contractor;
}

export interface ProjectFilters {
  search?: string;
  region_id?: string;
  district_id?: string;
  category_id?: string;
  project_status?: ProjectStatus;
  verification_status?: VerificationStatus;
  min_budget?: number;
  max_budget?: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'budget' | 'progress_percentage' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface ProjectEvidence {
  id: string;
  project_id: string;
  uploaded_by: string;
  uploader_name?: string;
  file_url: string;
  thumbnail_url?: string;
  file_type: string;
  file_size: number;
  caption: string | null;
  evidence_type: EvidenceType;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: VerificationStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  file_url: string;
  document_type: string;
  file_size: number;
  is_public: boolean;
  uploaded_by: string;
  uploader_name?: string;
  created_at: string;
}

export interface ProjectVerification {
  id: string;
  project_id: string;
  reviewer_id?: string;
  reviewer_title?: string;
  previous_status: VerificationStatus;
  new_status: VerificationStatus;
  decision: string;
  reason: string | null;
  created_at: string;
}

export interface ProjectTimelineUpdate {
  id: string;
  project_id: string;
  title: string;
  description: string;
  progress_percentage: number;
  status: ProjectStatus;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface CommunityReportSummary {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  recent_public_categories: string[];
}

export type CommentStatus = 'PUBLISHED' | 'FLAGGED' | 'REMOVED';
export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface ProjectReport {
  id: string;
  project_id: string;
  project_title?: string;
  submitted_by: string;
  submitter_name?: string;
  report_type: ReportType;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  location_notes?: string | null;
  evidence_url?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolver_name?: string | null;
  resolution_notes?: string | null;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  status: CommentStatus;
  flag_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectVoteSummary {
  project_id: string;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  priority_score: number;
  user_vote: VoteType | null;
}

export interface ProjectVoteRecord {
  id: string;
  project_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface SystemNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'VERIFICATION' | 'REPORT' | 'COMMENT' | 'EVIDENCE' | 'SYSTEM';
  entity_id?: string | null;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface VerificationActionInput {
  decision: 'VERIFIED' | 'REJECTED' | 'REQUEST_CHANGES' | 'UNDER_REVIEW';
  reason?: string;
  notes?: string;
  expected_status?: VerificationStatus;
  checklist?: {
    location_confirmed?: boolean;
    budget_verified?: boolean;
    contractor_valid?: boolean;
    evidence_audited?: boolean;
  };
}

export interface AdminMetricsData {
  projects: {
    total: number;
    verified: number;
    pending: number;
    under_review: number;
    rejected: number;
    request_changes: number;
  };
  reports: {
    total: number;
    open: number;
    under_review: number;
    acknowledged: number;
    resolved: number;
    rejected: number;
    critical_or_high: number;
  };
  evidence: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  comments: {
    total: number;
    published: number;
    flagged: number;
    removed: number;
  };
  civic_votes_total: number;
  recent_audits: Array<{
    id: string;
    action: string;
    user_email?: string | null;
    entity_type: string;
    entity_id: string;
    created_at: string;
    reason?: string | null;
  }>;
  jurisdiction_scope: {
    role: string;
    region_id?: string | null;
    district_id?: string | null;
    label: string;
  };
}

export interface OperationalAnalyticsData {
  time_range: '7d' | '30d' | '90d' | 'year' | 'all';
  jurisdiction_label: string;
  summary: {
    total_projects: number;
    total_budget: number;
    average_progress: number;
    completed_projects: number;
    ongoing_projects: number;
    abandoned_or_suspended: number;
    critical_reports_count: number;
    evidence_verified_rate: number;
  };
  projects_by_region: Array<{
    region_id: string;
    region_name: string;
    count: number;
    total_budget: number;
    average_progress: number;
  }>;
  projects_by_category: Array<{
    category_id: string;
    category_name: string;
    count: number;
    total_budget: number;
  }>;
  projects_by_status: Array<{
    status: ProjectStatus;
    count: number;
    percentage: number;
  }>;
  projects_by_verification_status: Array<{
    status: VerificationStatus;
    count: number;
    percentage: number;
  }>;
  reports_by_severity: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    count: number;
  }>;
  reports_by_status: Array<{
    status: ReportStatus;
    count: number;
  }>;
  evidence_by_status: Array<{
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    count: number;
  }>;
  submissions_timeline: Array<{
    period: string;
    submissions: number;
    verifications: number;
  }>;
  progress_distribution?: Array<{
    range: '0-25%' | '26-50%' | '51-75%' | '76-99%' | '100%';
    count: number;
    percentage: number;
  }>;
  budget_metrics?: {
    total_budget: number;
    average_budget: number;
    currency: string;
    budget_by_status: Array<{ status: string; total_budget: number }>;
  };
  projects_requiring_attention?: Array<{
    id: string;
    slug: string;
    title: string;
    region_name: string;
    district_name: string;
    status: ProjectStatus;
    progress: number;
    reason: string;
    severity: 'HIGH' | 'CRITICAL' | 'WARNING';
    flag_type: string;
    reports_count: number;
    updated_at: string;
  }>;
  data_quality_metrics?: {
    total_flagged: number;
    missing_coordinates: number;
    missing_contractor: number;
    zero_progress_ongoing: number;
    past_expected_completion: number;
    completed_under_100: number;
    flag_details: Array<{
      project_id: string;
      project_title: string;
      issue: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      category: string;
    }>;
  };
  verification_metrics?: {
    total_decisions: number;
    verified_count: number;
    pending_count: number;
    rejected_count: number;
    changes_requested: number;
    verification_rate: number;
  };
}

export interface PublicAnalyticsData {
  time_range: string;
  last_updated: string;
  summary: {
    total_projects: number;
    verified_projects: number;
    total_budget: number;
    average_progress: number;
    completed_projects: number;
    ongoing_projects: number;
    on_hold_projects: number;
    abandoned_projects: number;
    active_regions_count: number;
    active_districts_count: number;
    evidence_count: number;
    community_reports_count: number;
  };
  projects_by_region: Array<{
    region_id: string;
    region_name: string;
    code: string;
    slug: string;
    count: number;
    total_budget: number;
    average_progress: number;
    completed_count: number;
    ongoing_count: number;
  }>;
  projects_by_category: Array<{
    category_id: string;
    category_name: string;
    slug: string;
    icon: string;
    count: number;
    total_budget: number;
    average_progress: number;
    completion_rate: number;
  }>;
  projects_by_status: Array<{
    status: ProjectStatus;
    count: number;
    percentage: number;
  }>;
  progress_distribution: Array<{
    range: '0-25%' | '26-50%' | '51-75%' | '76-99%' | '100%';
    count: number;
    percentage: number;
  }>;
  verification_overview: Array<{
    status: VerificationStatus;
    count: number;
    percentage: number;
  }>;
  reports_summary: {
    total_reports: number;
    resolved_count: number;
    under_review_count: number;
    reports_by_type: Array<{ type: string; label: string; count: number }>;
  };
  monthly_activity: Array<{
    period: string;
    new_projects: number;
    completed_projects: number;
  }>;
  top_investments?: Array<{
    id: string;
    title: string;
    slug: string;
    region_name: string;
    district_name: string;
    status: ProjectStatus;
    progress: number;
    budget: number;
    currency: string;
  }>;
}

export interface MapProjectMarkerItem {
  id: string;
  title: string;
  slug: string;
  category: { name: string; slug: string; icon: string | null };
  region: { id: string; name: string; code: string };
  district: { id: string; name: string };
  location_name: string;
  latitude: number;
  longitude: number;
  project_status: ProjectStatus;
  verification_status: VerificationStatus;
  progress_percentage: number;
  budget: number;
  currency: string;
  contractor_name?: string;
  has_valid_coordinates: boolean;
  updated_at?: string;
}

export type { SystemSettings } from './user';

// ==========================================
// Phase 10: Contractor Accountability & Performance Scorecards
// ==========================================

export type PerformanceTier =
  | 'EXCEPTIONAL'       // 90-100
  | 'RELIABLE'          // 75-89
  | 'MODERATE'          // 60-74
  | 'NEEDS_IMPROVEMENT' // 45-59
  | 'CRITICAL_ATTENTION'// 0-44
  | 'UNRATED';          // Insufficient Data (< 1 project)

export type DataSufficiencyLevel =
  | 'INSUFFICIENT' // 0 projects
  | 'LOW'          // 1 project (preliminary indicator)
  | 'MODERATE'     // 2-3 projects
  | 'HIGH';        // 4+ projects

export interface ScorecardPillar {
  key: 'delivery' | 'velocity' | 'community' | 'reliability';
  name: string;
  score: number; // 0-100
  weight: number; // e.g. 0.40, 0.25, 0.20, 0.15
  weighted_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  rationale: string;
  metrics: Record<string, string | number>;
}

export interface ContractorScorecard {
  contractor_id: string;
  contractor_name: string;
  overall_score: number | null; // null if INSUFFICIENT
  letter_grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';
  tier: PerformanceTier;
  data_sufficiency: DataSufficiencyLevel;
  confidence_label: string;
  confidence_description: string;
  
  // 4 Core Performance Pillars
  pillars: {
    delivery: ScorecardPillar;
    velocity: ScorecardPillar;
    community: ScorecardPillar;
    reliability: ScorecardPillar;
  };

  // Quantitative Metrics
  metrics: {
    total_projects: number;
    completed_projects: number;
    ongoing_projects: number;
    delayed_projects: number;
    on_hold_projects: number;
    abandoned_projects: number;

    total_capital_managed: number;
    total_capital_delivered: number;
    currency: string;

    on_time_delivery_rate: number; // 0-100
    completion_rate: number; // 0-100
    average_progress_active: number; // 0-100

    total_community_reports: number;
    resolved_community_reports: number;
    resolution_rate: number; // 0-100
    critical_defects_count: number;

    active_regions_count: number;
    active_districts_count: number;
    regions_served: Array<{ id: string; name: string }>;
  };

  // Civic Methodology & Disclaimer Transparency
  methodology: {
    title: string;
    disclaimer: string;
    notice: string;
    weights: {
      delivery_weight: number;
      velocity_weight: number;
      community_weight: number;
      reliability_weight: number;
    };
  };

  evaluated_at: string;
}

export interface ContractorWithScorecard extends Contractor {
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  scorecard: ContractorScorecard;
  total_projects_count: number;
  completed_projects_count: number;
  ongoing_projects_count: number;
  delayed_projects_count: number;
  total_budget_managed: number;
  currency: string;
}

export interface ContractorSummaryStats {
  total_contractors: number;
  active_contractors: number;
  total_projects_contracted: number;
  active_works_count: number;
  completed_works_count: number;
  total_capital_managed_ghs: number;
  total_capital_delivered_ghs: number;
  average_performance_score: number;
  average_on_time_rate: number;
  high_confidence_count: number;
  moderate_confidence_count: number;
  low_sufficiency_count: number;
}


