import { Database } from '../../src/types/database';
import {
  Project,
  ProjectStatus,
  VerificationStatus,
  Contractor,
  ContractorScorecard,
  ContractorWithScorecard,
  ContractorSummaryStats,
  ScorecardPillar,
  PerformanceTier,
  DataSufficiencyLevel,
  EvidenceType,
  ReportType,
  ReportSeverity,
  ReportStatus,
  SystemNotification,
  AdminMetricsData,
  ProjectFunding,
  ProjectCommitment,
  ProjectTranche,
  ProjectDisbursement,
  ProjectExpenditure,
  ProjectFiscalRecords,
  ProjectFiscalSummary,
  FiscalPaymentStatus,
  FieldInspection,
  InspectionPublicSummary,
} from '../../src/types/project';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS,
  GHANA_COMMUNITIES,
  PROJECT_CATEGORIES_DATA,
  RegionData,
  DistrictData,
  CommunityData,
} from '../../src/types/geography';
import { Profile, UserRole, AccountStatus, SystemSettings } from '../../src/types/user';
import { OperationalAnalyticsData, PublicAnalyticsData } from '../../src/types/project';
import {
  INITIAL_PROJECT_EVIDENCE,
  INITIAL_PROJECT_DOCUMENTS,
  INITIAL_PROJECT_VERIFICATIONS,
  INITIAL_PROJECT_REPORTS,
  ADDITIONAL_PROJECT_UPDATES,
} from './phase5_seed';
import {
  INITIAL_PROJECT_COMMENTS,
  INITIAL_PROJECT_VOTES,
} from './phase6_seed';

export interface ProjectUpdateRecord {
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

export interface ProjectEvidenceRecord {
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
  inspection_id?: string | null;
  client_evidence_id?: string | null;
  storage_path?: string | null;
  original_filename?: string | null;
  upload_status?: 'PENDING_UPLOAD' | 'UPLOADED' | 'FAILED';
}

export interface ProjectDocumentRecord {
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

export interface ProjectVerificationRecord {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_title: string;
  previous_status: VerificationStatus;
  new_status: VerificationStatus;
  decision: string;
  reason: string | null;
  created_at: string;
}

export interface ProjectReportRecord {
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
  resolved_at: string | null;
  resolved_by: string | null;
  resolver_name?: string | null;
  resolution_notes?: string | null;
}

export interface ProjectCommentRecord {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED';
  flag_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectVoteRecord {
  id: string;
  project_id: string;
  user_id: string;
  vote_type: 'UPVOTE' | 'DOWNVOTE';
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  user_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface ListProjectsOptions {
  search?: string;
  region?: string;
  district?: string;
  community?: string;
  category?: string;
  contractor?: string;
  status?: ProjectStatus;
  verification_status?: VerificationStatus;
  min_budget?: number;
  max_budget?: number;
  min_progress?: number;
  max_progress?: number;
  start_date?: string;
  completion_date?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'budget' | 'progress_percentage' | 'title' | 'updated_at';
  order?: 'asc' | 'desc';
  // If false, default to only showing VERIFIED projects for public views
  includeAllStatus?: boolean;
}

class ProjectStore {
  private regions = [...GHANA_REGIONS];
  private districts = [...GHANA_DISTRICTS];
  private communities = [...GHANA_COMMUNITIES];
  private categories = [...PROJECT_CATEGORIES_DATA];
  private contractors: Contractor[] = [];
  private projects: Project[] = [];
  private projectUpdates: ProjectUpdateRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];
  private projectEvidence: ProjectEvidenceRecord[] = [];
  private projectDocuments: ProjectDocumentRecord[] = [];
  private projectVerifications: ProjectVerificationRecord[] = [];
  private projectReports: ProjectReportRecord[] = [];
  private projectComments: ProjectCommentRecord[] = [];
  private projectVotes: ProjectVoteRecord[] = [];
  private projectFunding: ProjectFunding[] = [];
  private projectCommitments: ProjectCommitment[] = [];
  private projectTranches: ProjectTranche[] = [];
  private projectDisbursements: ProjectDisbursement[] = [];
  private projectExpenditures: ProjectExpenditure[] = [];
  private fieldInspections: FieldInspection[] = [];
  private notifications: SystemNotification[] = [];
  private users: Profile[] = [];
  private systemSettings: SystemSettings = {
    platform_name: 'GhanaBuild 2.0 Transparency Portal',
    default_page_size: 20,
    public_submissions_enabled: true,
    community_reporting_enabled: true,
    civic_comments_enabled: true,
    evidence_upload_max_mb: 25,
    maintenance_mode: false,
    require_report_phone: false,
    audit_retention_years: 7,
    updated_at: new Date().toISOString(),
    updated_by: 'usr-adm-001',
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Contractors
    this.contractors = [
      {
        id: 'CONTR-001',
        name: 'Consar Limited Ghana',
        slug: 'consar-limited-ghana',
        registration_number: 'CS-GH-2012-0044',
        tin_number: 'C0001284918',
        category_specialization: 'General Building & Healthcare Infrastructure',
        description: 'Tier-1 general contractor specializing in major hospital complexes, educational institutions, and multi-storey public administrative civic buildings.',
        contact_email: 'contracts@consargh.com',
        contact_phone: '+233 30 222 1890',
        address: 'No. 14 Graphic Road, South Industrial Area, Accra',
        website: 'https://consargh.com',
        status: 'ACTIVE',
        year_established: 1983,
        created_at: '2024-01-10T08:00:00.000Z',
        updated_at: '2024-01-10T08:00:00.000Z',
      },
      {
        id: 'CONTR-002',
        name: 'Queiroz Galvão Construction Ghana',
        slug: 'queiroz-galvao-construction-ghana',
        registration_number: 'QG-GH-2015-0912',
        tin_number: 'C0003498122',
        category_specialization: 'Highways, Bridges & Heavy Civil Works',
        description: 'International civil engineering consortium handling arterial urban highways, grade-separated flyovers, and major drainage canalization projects.',
        contact_email: 'ghana.projects@queirozgalvao.com',
        contact_phone: '+233 30 277 4531',
        address: 'Airport Residential Area, Accra',
        website: 'https://queirozgalvao.com',
        status: 'ACTIVE',
        year_established: 2011,
        created_at: '2024-01-12T08:00:00.000Z',
        updated_at: '2024-01-12T08:00:00.000Z',
      },
      {
        id: 'CONTR-003',
        name: 'Desimone Limited',
        slug: 'desimone-limited',
        registration_number: 'DS-GH-2008-0118',
        tin_number: 'C0004918239',
        category_specialization: 'Commercial & Institutional Facilities',
        description: 'Specialized structural engineering and construction firm focused on tertiary educational blocks, science laboratories, and high-spec public works.',
        contact_email: 'info@desimonegroup.com',
        contact_phone: '+233 30 223 9012',
        address: 'Motorway Extension, Spintex Road, Accra',
        website: 'https://desimonegroup.com',
        status: 'ACTIVE',
        year_established: 2004,
        created_at: '2024-01-15T08:00:00.000Z',
        updated_at: '2024-01-15T08:00:00.000Z',
      },
      {
        id: 'CONTR-004',
        name: 'China Railway No.5 Engineering Ghana',
        slug: 'china-railway-no5-engineering-ghana',
        registration_number: 'CR-GH-2018-3401',
        tin_number: 'C0007812044',
        category_specialization: 'Railway, Coastal & Heavy Transport Corridors',
        description: 'Heavy transport infrastructure contractor delivering standard gauge rail corridors, coastal revetment walls, and regional trade bypasses.',
        contact_email: 'crec5.ghana@cr5g.com',
        contact_phone: '+233 24 456 7890',
        address: 'Kumasi Industrial Park, Ashanti Region',
        website: 'https://cr5g.com',
        status: 'ACTIVE',
        year_established: 2014,
        created_at: '2024-02-01T08:00:00.000Z',
        updated_at: '2024-02-01T08:00:00.000Z',
      },
      {
        id: 'CONTR-005',
        name: 'Mawums Limited',
        slug: 'mawums-limited',
        registration_number: 'MW-GH-2016-1188',
        tin_number: 'C0005523910',
        category_specialization: 'Roads, Water Supply & Municipal Engineering',
        description: 'Indigenous construction leader with deep regional operational capacity across Northern, Savannah, Upper East, and Upper West regions.',
        contact_email: 'admin@mawums.com',
        contact_phone: '+233 37 202 4411',
        address: 'Tamale High Street, Northern Region',
        website: 'https://mawums.com',
        status: 'ACTIVE',
        year_established: 2007,
        created_at: '2024-02-10T08:00:00.000Z',
        updated_at: '2024-02-10T08:00:00.000Z',
      },
      {
        id: 'CONTR-006',
        name: 'Barbisotti & Sons Limited',
        slug: 'barbisotti-and-sons-limited',
        registration_number: 'BS-GH-2010-0442',
        tin_number: 'C0009941203',
        category_specialization: 'Coastal, Harbor & Specialized Marine Works',
        description: 'Heritage civil contractor specializing in coastal protection, artisanal fish landing ports, and maritime concrete structures.',
        contact_email: 'info@barbisottigh.com',
        contact_phone: '+233 32 202 3341',
        address: 'Adum Business District, Kumasi',
        website: 'https://barbisottigh.com',
        status: 'ACTIVE',
        year_established: 1998,
        created_at: '2024-02-15T08:00:00.000Z',
        updated_at: '2024-02-15T08:00:00.000Z',
      },
      {
        id: 'CONTR-007',
        name: 'Volta Basin Civil Works Ltd',
        slug: 'volta-basin-civil-works-ltd',
        registration_number: 'VB-GH-2024-7701',
        tin_number: 'C0012894101',
        category_specialization: 'Hydro-Engineering & Irrigation Schemes',
        description: 'Newly registered infrastructure firm focused on agricultural irrigation dams, culvert network installation, and rural access bridges.',
        contact_email: 'tenders@voltabasincivil.com',
        contact_phone: '+233 36 202 1199',
        address: 'Ho Central Ring, Volta Region',
        website: 'https://voltabasincivil.com',
        status: 'ACTIVE',
        year_established: 2024,
        created_at: '2024-06-01T08:00:00.000Z',
        updated_at: '2024-06-01T08:00:00.000Z',
      },
      {
        id: 'CONTR-008',
        name: 'West Coast Dredging & Marine Ltd',
        slug: 'west-coast-dredging-marine-ltd',
        registration_number: 'WC-GH-2019-5512',
        tin_number: 'C0008812390',
        category_specialization: 'Harbor Dredging & Coastal Protection',
        description: 'Marine civil works firm undertaking coastal groynes, sea defense boulder revetment, and estuary dredging operations.',
        contact_email: 'operations@westcoastmarinegh.com',
        contact_phone: '+233 31 202 9901',
        address: 'Harbour Commercial Area, Takoradi, Western Region',
        website: 'https://westcoastmarinegh.com',
        status: 'ACTIVE',
        year_established: 2019,
        created_at: '2024-03-01T08:00:00.000Z',
        updated_at: '2024-03-01T08:00:00.000Z',
      },
    ];

    // 2. Seed Initial Projects
    this.projects = [
      {
        id: 'PRJ-GAR-001',
        title: 'Accra Outer Ring Road Dualization & Asphalt Overlay',
        slug: 'accra-outer-ring-road-dualization-asphalt-overlay',
        description: 'Dualization of 14.5 km outer arterial roadway including grade-separated interchange at Pokuase link, modern LED street lighting, pedestrian walkways, and covered storm drainage.',
        category_id: 'CAT-ROADS',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        community_id: 'COMM-ACC-03',
        location_name: 'Adabraka - Graphic Road Corridor',
        latitude: 5.5600,
        longitude: -0.2050,
        contractor_id: 'CONTR-002',
        budget: 42500000,
        currency: 'GHS',
        start_date: '2024-03-01',
        expected_completion_date: '2025-11-30',
        actual_completion_date: null,
        progress_percentage: 65,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-mmdce-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-02-15T09:00:00.000Z',
        updated_at: '2024-08-20T14:30:00.000Z',
      },
      {
        id: 'PRJ-ASH-002',
        title: 'Kumasi Maternal & Child Health Specialist Center Annex',
        slug: 'kumasi-maternal-child-health-specialist-center-annex',
        description: 'Construction of a 120-bed comprehensive maternal healthcare pavilion featuring neonatal intensive care units, 3 surgical theaters, oxygen generation station, and staff residency.',
        category_id: 'CAT-HOSPITALS',
        region_id: 'REG-ASHANTI-01',
        district_id: 'DIST-KUMASI-METRO',
        community_id: 'COMM-KUM-01',
        location_name: 'Bantama High Street Medical Enclave',
        latitude: 6.7020,
        longitude: -1.6320,
        contractor_id: 'CONTR-001',
        budget: 28400000,
        currency: 'GHS',
        start_date: '2023-09-15',
        expected_completion_date: '2025-06-30',
        actual_completion_date: null,
        progress_percentage: 82,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-reg-001',
        verified_by: 'usr-nat-001',
        created_at: '2023-09-01T10:00:00.000Z',
        updated_at: '2024-07-15T11:00:00.000Z',
      },
      {
        id: 'PRJ-NR-003',
        title: 'Tamale North Piped Water Supply Expansion Project',
        slug: 'tamale-north-piped-water-supply-expansion-project',
        description: 'Installation of 32 km HDPE distribution mains, 500,000-gallon elevated reservoir, booster station, and 2,500 metered domestic connections to alleviate perennial water rationing.',
        category_id: 'CAT-WATER',
        region_id: 'REG-NR-01',
        district_id: 'DIST-SAGNARIGU-01',
        community_id: 'COMM-SAG-01',
        location_name: 'Choggu - Kanvili Water Reservoir Hill',
        latitude: 9.4280,
        longitude: -0.8420,
        contractor_id: 'CONTR-005',
        budget: 18200000,
        currency: 'GHS',
        start_date: '2024-01-10',
        expected_completion_date: '2024-12-15',
        actual_completion_date: null,
        progress_percentage: 45,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-01-05T08:30:00.000Z',
        updated_at: '2024-06-10T16:00:00.000Z',
      },
      {
        id: 'PRJ-VOLTA-004',
        title: 'Ho Municipal Modern Central Market Redevelopment Phase 1',
        slug: 'ho-municipal-modern-central-market-redevelopment-phase-1',
        description: 'Construction of 400 lock-up retail stalls, dedicated meat and fish refrigeration hangar, bulk vegetable transit shed, creche for nursing market women, and fire hydrants.',
        category_id: 'CAT-MARKETS',
        region_id: 'REG-VOLTA-01',
        district_id: 'DIST-HO-01',
        community_id: 'COMM-HO-01',
        location_name: 'Bankoe Market Commercial District',
        latitude: 6.6110,
        longitude: 0.4710,
        contractor_id: 'CONTR-003',
        budget: 15600000,
        currency: 'GHS',
        start_date: '2023-06-01',
        expected_completion_date: '2024-08-30',
        actual_completion_date: '2024-09-02',
        progress_percentage: 100,
        project_status: 'COMPLETED',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2023-05-20T12:00:00.000Z',
        updated_at: '2024-09-02T10:15:00.000Z',
      },
      {
        id: 'PRJ-WR-005',
        title: 'Takoradi Harbor Link Road & Concrete Drainage Reconstruction',
        slug: 'takoradi-harbor-link-road-concrete-drainage-reconstruction',
        description: 'Rebuilding of heavy haulage corridor connecting Takoradi container terminal with industrial bypass, reinforced concrete storm trench to combat sea-level tidal surges.',
        category_id: 'CAT-ROADS',
        region_id: 'REG-WR-01',
        district_id: 'DIST-STMA',
        community_id: 'COMM-STMA-01',
        location_name: 'Market Circle - Harbor Access Way',
        latitude: 4.8950,
        longitude: -1.7580,
        contractor_id: 'CONTR-004',
        budget: 31000000,
        currency: 'GHS',
        start_date: '2024-04-15',
        expected_completion_date: '2025-08-30',
        actual_completion_date: null,
        progress_percentage: 30,
        project_status: 'ON_HOLD',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-04-01T09:00:00.000Z',
        updated_at: '2024-07-28T15:00:00.000Z',
      },
      {
        id: 'PRJ-CR-006',
        title: 'Cape Coast Regional STEM Center of Excellence',
        slug: 'cape-coast-regional-stem-center-of-excellence',
        description: 'Construction of ultra-modern 3-story science, technology, engineering, and mathematics academy with robotics lab, digital fabrication workshop, and 500-seat auditorium.',
        category_id: 'CAT-SCHOOLS',
        region_id: 'REG-CR-01',
        district_id: 'DIST-CAPE-COAST',
        community_id: null,
        location_name: 'Pedu Junction Educational Corridor',
        latitude: 5.1220,
        longitude: -1.2780,
        contractor_id: 'CONTR-006',
        budget: 22000000,
        currency: 'GHS',
        start_date: '2024-02-01',
        expected_completion_date: '2025-05-15',
        actual_completion_date: null,
        progress_percentage: 55,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-01-20T10:00:00.000Z',
        updated_at: '2024-08-10T12:00:00.000Z',
      },
      {
        id: 'PRJ-GAR-007',
        title: 'Jamestown Community Clinic Upgrade & Solar Electrification',
        slug: 'jamestown-community-clinic-upgrade-solar-electrification',
        description: 'Renovation of historic health post with 24-hour solar backup power, emergency pediatric stabilization room, laboratory refrigeration, and medical waste incinerator.',
        category_id: 'CAT-HEALTH-CENTRES',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        community_id: 'COMM-ACC-01',
        location_name: 'Old Jamestown Lighthouse Road',
        latitude: 5.5340,
        longitude: -0.2130,
        contractor_id: 'CONTR-001',
        budget: 6800000,
        currency: 'GHS',
        start_date: '2024-05-01',
        expected_completion_date: '2024-12-30',
        actual_completion_date: null,
        progress_percentage: 15,
        project_status: 'PLANNED',
        verification_status: 'PENDING',
        created_by: 'usr-mmdce-001',
        verified_by: null,
        created_at: '2024-05-01T11:00:00.000Z',
        updated_at: '2024-05-01T11:00:00.000Z',
      },
      {
        id: 'PRJ-ER-008',
        title: 'Koforidua Municipal Water Treatment Plant Expansion',
        slug: 'koforidua-municipal-water-treatment-plant-expansion',
        description: 'Comprehensive modernization of Densu river abstraction works, automated sedimentation tanks, and dual-media sand filters supplying 12 million gallons daily.',
        category_id: 'CAT-WATER',
        region_id: 'REG-ER-01',
        district_id: 'DIST-NEW-JUABEN',
        community_id: null,
        location_name: 'Densu River Water Works Reserve',
        latitude: 6.0940,
        longitude: -0.2600,
        contractor_id: 'CONTR-005',
        budget: 36000000,
        currency: 'GHS',
        start_date: '2023-11-01',
        expected_completion_date: '2025-04-30',
        actual_completion_date: null,
        progress_percentage: 70,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2023-10-15T08:00:00.000Z',
        updated_at: '2024-08-15T10:00:00.000Z',
      },
      {
        id: 'PRJ-BR-009',
        title: 'Sunyani Ultra-Modern Regional Library & Digital Resource Hub',
        slug: 'sunyani-ultra-modern-regional-library-digital-resource-hub',
        description: '3-story civic learning complex containing digital e-library, specialized braille resource corner, children literacy center, and 300-seat civic auditorium.',
        category_id: 'CAT-SCHOOLS',
        region_id: 'REG-BR-01',
        district_id: 'DIST-SUNYANI-01',
        community_id: null,
        location_name: 'Sunyani Civic Center Enclave',
        latitude: 7.3399,
        longitude: -2.3268,
        contractor_id: 'CONTR-003',
        budget: 14500000,
        currency: 'GHS',
        start_date: '2023-08-01',
        expected_completion_date: '2024-11-30',
        actual_completion_date: null,
        progress_percentage: 90,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2023-07-20T09:00:00.000Z',
        updated_at: '2024-09-01T15:00:00.000Z',
      },
      {
        id: 'PRJ-UE-010',
        title: 'Bolgatanga Regional Hospital Phase II Diagnostic Center',
        slug: 'bolgatanga-regional-hospital-phase-ii-diagnostic-center',
        description: 'Fully equipped medical imaging diagnostic wing including 64-slice CT scanner, digital mammography suite, and blood bank cold storage facilities.',
        category_id: 'CAT-HOSPITALS',
        region_id: 'REG-UE-01',
        district_id: 'DIST-BOLGA-01',
        community_id: null,
        location_name: 'Bolgatanga Central Hospital Grounds',
        latitude: 10.7856,
        longitude: -0.8514,
        contractor_id: 'CONTR-001',
        budget: 48000000,
        currency: 'GHS',
        start_date: '2022-09-10',
        expected_completion_date: '2024-06-30',
        actual_completion_date: '2024-07-15',
        progress_percentage: 100,
        project_status: 'COMPLETED',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2022-08-25T11:00:00.000Z',
        updated_at: '2024-07-15T14:00:00.000Z',
      },
      {
        id: 'PRJ-UW-011',
        title: 'Wa Municipal Solar Irrigation Scheme & Community Dam',
        slug: 'wa-municipal-solar-irrigation-scheme-community-dam',
        description: 'Construction of 180,000 m³ earth dam and high-capacity floating solar photovoltaic pumps irrigating 150 hectares of dry-season vegetable farms.',
        category_id: 'CAT-AGRICULTURE',
        region_id: 'REG-UW-01',
        district_id: 'DIST-WA-01',
        community_id: null,
        location_name: 'Busa Valley Irrigation Corridor',
        latitude: 10.0601,
        longitude: -2.5099,
        contractor_id: 'CONTR-005',
        budget: 19200000,
        currency: 'GHS',
        start_date: '2024-03-15',
        expected_completion_date: '2025-06-15',
        actual_completion_date: null,
        progress_percentage: 40,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-03-01T10:00:00.000Z',
        updated_at: '2024-08-05T13:00:00.000Z',
      },
      {
        id: 'PRJ-OTI-012',
        title: 'Dambai River Ferry Slipway & Passenger Terminal',
        slug: 'dambai-river-ferry-slipway-passenger-terminal',
        description: 'Reinforced marine concrete slipway landing, covered passenger waiting terminal, and solar navigation beacons on the Oti River crossing.',
        category_id: 'CAT-BRIDGES',
        region_id: 'REG-OTI-01',
        district_id: 'DIST-HO-01',
        community_id: null,
        location_name: 'Dambai Riverfront Enclave',
        latitude: 7.6690,
        longitude: 0.1790,
        contractor_id: 'CONTR-004',
        budget: 27500000,
        currency: 'GHS',
        start_date: '2024-04-01',
        expected_completion_date: '2025-10-31',
        actual_completion_date: null,
        progress_percentage: 25,
        project_status: 'ONGOING',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2024-03-20T08:00:00.000Z',
        updated_at: '2024-07-30T10:00:00.000Z',
      },
      {
        id: 'PRJ-BE-013',
        title: 'Techiman Commercial Agro-Logistics Silo Facility',
        slug: 'techiman-commercial-agro-logistics-silo-facility',
        description: 'Grain drying and warehousing complex with four 2,500-metric-ton steel silos, weighbridge station, and solar-powered cold storage.',
        category_id: 'CAT-MARKETS',
        region_id: 'REG-BE-01',
        district_id: 'DIST-TECHIMAN-01',
        community_id: null,
        location_name: 'Techiman Northern Commercial Bypass',
        latitude: 7.5833,
        longitude: -1.9333,
        contractor_id: 'CONTR-002',
        budget: 21000000,
        currency: 'GHS',
        start_date: '2023-04-10',
        expected_completion_date: '2024-05-30',
        actual_completion_date: '2024-06-12',
        progress_percentage: 100,
        project_status: 'COMPLETED',
        verification_status: 'VERIFIED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2023-03-25T11:00:00.000Z',
        updated_at: '2024-06-12T16:00:00.000Z',
      },
      {
        id: 'PRJ-ARCH-014',
        title: 'Archived Drainage Channel Project (Historical Reference)',
        slug: 'archived-drainage-channel-project-historical-reference',
        description: 'Decommissioned drainage scheme archived in accordance with ministerial records regulations.',
        category_id: 'CAT-SANITATION',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        community_id: null,
        location_name: 'Odaw Drainage Section 4',
        latitude: 5.5700,
        longitude: -0.2200,
        contractor_id: 'CONTR-001',
        budget: 5000000,
        currency: 'GHS',
        start_date: '2021-01-01',
        expected_completion_date: '2022-01-01',
        actual_completion_date: '2022-01-01',
        progress_percentage: 100,
        project_status: 'COMPLETED',
        verification_status: 'ARCHIVED',
        created_by: 'usr-adm-001',
        verified_by: 'usr-nat-001',
        created_at: '2020-12-01T09:00:00.000Z',
        updated_at: '2022-01-10T10:00:00.000Z',
      },
    ];

    // 3. Seed Initial Timeline Updates
    this.projectUpdates = [
      {
        id: 'UPD-GAR-001-A',
        project_id: 'PRJ-GAR-001',
        title: 'Site Demarcation & Utility Relocation Completed',
        description: 'Contractor completed topographic boundary demarcation and negotiated relocation of underground optical fiber cables and high-voltage grid poles with ECG.',
        progress_percentage: 20,
        status: 'ONGOING',
        created_by: 'usr-mmdce-001',
        created_by_name: 'Hon. Kofi Adjei (MMDCE Officer)',
        created_at: '2024-04-10T10:00:00.000Z',
      },
      {
        id: 'UPD-GAR-001-B',
        project_id: 'PRJ-GAR-001',
        title: 'Earthworks, Sub-base & Concrete Box Culverts',
        description: 'Excavation completed along section KM 4+200 through KM 8+900. Three major reinforced double-cell box culverts cast and cured to specifications.',
        progress_percentage: 45,
        status: 'ONGOING',
        created_by: 'usr-mmdce-001',
        created_by_name: 'Hon. Kofi Adjei (MMDCE Officer)',
        created_at: '2024-06-25T14:00:00.000Z',
      },
      {
        id: 'UPD-GAR-001-C',
        project_id: 'PRJ-GAR-001',
        title: 'Crushed Rock Base & First Binder Course Laid',
        description: 'Asphalt paving train deployed. 6.2 km of first binder course asphaltic concrete successfully placed and compacted. Pedestrian sidewalk curb casting ongoing.',
        progress_percentage: 65,
        status: 'ONGOING',
        created_by: 'usr-mmdce-001',
        created_by_name: 'Hon. Kofi Adjei (MMDCE Officer)',
        created_at: '2024-08-20T14:30:00.000Z',
      },
      {
        id: 'UPD-ASH-002-A',
        project_id: 'PRJ-ASH-002',
        title: 'Foundation Piling & Substructure Casting',
        description: 'Cast 48 deep reinforced piles down to bedrock. Basement radiation shielding and lift core foundations cured and approved by civil engineering consultants.',
        progress_percentage: 35,
        status: 'ONGOING',
        created_by: 'usr-reg-001',
        created_by_name: 'Ing. Yaw Boateng (Regional Officer)',
        created_at: '2024-01-15T09:00:00.000Z',
      },
      {
        id: 'UPD-ASH-002-B',
        project_id: 'PRJ-ASH-002',
        title: 'Superstructure Roofing & Internal Mechanical Rough-ins',
        description: 'Complete roof slab installation with waterproofing membrane. Medical gas copper piping, HVAC ducting, and power busways 80% completed on all 3 floors.',
        progress_percentage: 82,
        status: 'ONGOING',
        created_by: 'usr-reg-001',
        created_by_name: 'Ing. Yaw Boateng (Regional Officer)',
        created_at: '2024-07-15T11:00:00.000Z',
      },
    ];

    // 4. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'AUD-001',
        user_id: 'usr-adm-001',
        user_email: 'admin@ghanabuild.gov.gh',
        action: 'PROJECT_CREATED',
        entity_type: 'PROJECT',
        entity_id: 'PRJ-GAR-001',
        old_values: null,
        new_values: { title: 'Accra Outer Ring Road Dualization & Asphalt Overlay', budget: 42500000, status: 'ONGOING' },
        reason: 'Initial official project registration under National Infrastructure Budget',
        created_at: '2024-02-15T09:00:00.000Z',
      },
      {
        id: 'AUD-002',
        user_id: 'usr-mmdce-001',
        user_email: 'kofi.adjei@accrametro.gov.gh',
        action: 'PROJECT_UPDATE_CREATED',
        entity_type: 'PROJECT',
        entity_id: 'PRJ-GAR-001',
        old_values: { progress_percentage: 45 },
        new_values: { progress_percentage: 65, update_title: 'Crushed Rock Base & First Binder Course Laid' },
        reason: 'Progress milestone verification update',
        created_at: '2024-08-20T14:30:00.000Z',
      },
    ];

    // 5. Seed Phase 5 Evidence, Documents, Verifications, and Reports
    this.projectEvidence = [...INITIAL_PROJECT_EVIDENCE];
    this.projectDocuments = [...INITIAL_PROJECT_DOCUMENTS];
    this.projectVerifications = [...INITIAL_PROJECT_VERIFICATIONS];
    this.projectReports = [...INITIAL_PROJECT_REPORTS];
    this.projectUpdates.push(...ADDITIONAL_PROJECT_UPDATES);

    // 6. Seed Phase 6 Comments and Civic Priority Votes
    this.projectComments = [...INITIAL_PROJECT_COMMENTS];
    this.projectVotes = [...INITIAL_PROJECT_VOTES];

    // 7. Seed Phase 7 Notifications
    this.notifications = [
      {
        id: 'NOTIF-001',
        user_id: 'usr-mmdce-001',
        title: 'Project Submission Ready for Review',
        message: 'A new community infrastructure submission (PRJ-GAR-001) has been filed and awaits MMDCE verification.',
        type: 'VERIFICATION',
        entity_id: 'PRJ-GAR-001',
        link: '/projects/accra-outer-ring-road-dualization-asphalt-overlay',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'NOTIF-002',
        user_id: 'usr-reg-001',
        title: 'Community Hazard Report Logged',
        message: 'Medium severity safety concern reported regarding drainage excavation near Graphic Road.',
        type: 'REPORT',
        entity_id: 'REP-GAR-001-1',
        link: '/projects/accra-outer-ring-road-dualization-asphalt-overlay',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'NOTIF-003',
        user_id: 'usr-cit-001',
        title: 'Project Verification Confirmed',
        message: 'Accra Outer Ring Road Dualization has been formally gazetted and verified on the National Transparency Register.',
        type: 'VERIFICATION',
        entity_id: 'PRJ-GAR-001',
        link: '/projects/accra-outer-ring-road-dualization-asphalt-overlay',
        is_read: true,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];

    // Seed Initial User Directory for Phase 8 RBAC & User Management
    this.users = [
      {
        id: 'usr-adm-001',
        auth_user_id: 'auth-adm-001',
        full_name: 'Chief Systems Administrator',
        email: 'admin@ghanabuild.gov.gh',
        phone: '+233 24 000 0001',
        role: 'SUPER_ADMIN',
        region_id: null,
        district_id: null,
        organization: 'Ministry of Local Government & Digital Systems',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date().toISOString(),
        created_at: '2024-01-01T08:00:00.000Z',
        updated_at: '2024-01-01T08:00:00.000Z',
      },
      {
        id: 'usr-nat-001',
        auth_user_id: 'auth-nat-001',
        full_name: 'Dr. Afia Osei',
        email: 'afia.osei@presidency.gov.gh',
        phone: '+233 24 999 0000',
        role: 'NATIONAL_MONITOR',
        region_id: null,
        district_id: null,
        organization: 'Office of the President / NDPC Monitoring Unit',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        created_at: '2024-01-05T08:00:00.000Z',
        updated_at: '2024-01-05T08:00:00.000Z',
      },
      {
        id: 'usr-mod-001',
        auth_user_id: 'auth-mod-001',
        full_name: 'Ebenezer Darko',
        email: 'moderation@ghanabuild.gov.gh',
        phone: '+233 50 333 4444',
        role: 'MODERATOR',
        region_id: null,
        district_id: null,
        organization: 'GhanaBuild Civic Standards Commission',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        created_at: '2024-01-10T08:00:00.000Z',
        updated_at: '2024-01-10T08:00:00.000Z',
      },
      {
        id: 'usr-reg-001',
        auth_user_id: 'auth-reg-001',
        full_name: 'Ing. Yaw Boateng',
        email: 'yaw.boateng@ashanti-rcc.gov.gh',
        phone: '+233 27 777 8899',
        role: 'REGIONAL_OFFICER',
        region_id: 'REG-ASHANTI-01',
        district_id: null,
        organization: 'Ashanti Regional Coordinating Council',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        created_at: '2024-01-15T08:00:00.000Z',
        updated_at: '2024-01-15T08:00:00.000Z',
      },
      {
        id: 'usr-reg-002',
        auth_user_id: 'auth-reg-002',
        full_name: 'Faustina Mensah',
        email: 'faustina.mensah@gar-rcc.gov.gh',
        phone: '+233 24 333 9988',
        role: 'REGIONAL_OFFICER',
        region_id: 'REG-GAR-01',
        district_id: null,
        organization: 'Greater Accra Regional Coordinating Council',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        created_at: '2024-01-16T08:00:00.000Z',
        updated_at: '2024-01-16T08:00:00.000Z',
      },
      {
        id: 'usr-mmdce-001',
        auth_user_id: 'auth-mmdce-001',
        full_name: 'Hon. Kofi Adjei',
        email: 'kofi.adjei@accrametro.gov.gh',
        phone: '+233 24 555 1212',
        role: 'MMDCE_OFFICER',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        organization: 'Accra Metropolitan Assembly',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        created_at: '2024-01-18T08:00:00.000Z',
        updated_at: '2024-01-18T08:00:00.000Z',
      },
      {
        id: 'usr-mmdce-002',
        auth_user_id: 'auth-mmdce-002',
        full_name: 'Hon. Samuel Appiah',
        email: 'samuel.appiah@kma.gov.gh',
        phone: '+233 20 444 7711',
        role: 'MMDCE_OFFICER',
        region_id: 'REG-ASHANTI-01',
        district_id: 'DIST-KUMASI-METRO',
        organization: 'Kumasi Metropolitan Assembly',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        created_at: '2024-01-20T08:00:00.000Z',
        updated_at: '2024-01-20T08:00:00.000Z',
      },
      {
        id: 'usr-obs-001',
        auth_user_id: 'auth-obs-001',
        full_name: 'Ama Serwaa',
        email: 'ama.observer@ghanabuild.gov.gh',
        phone: '+233 20 987 6543',
        role: 'COMMUNITY_OBSERVER',
        region_id: 'REG-ASHANTI-01',
        district_id: 'DIST-KUMASI-METRO',
        organization: 'Ghana Integrity Initiative / Civil Society',
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        created_at: '2024-02-01T08:00:00.000Z',
        updated_at: '2024-02-01T08:00:00.000Z',
      },
      {
        id: 'usr-cit-001',
        auth_user_id: 'auth-cit-001',
        full_name: 'Kwame Mensah',
        email: 'kwame.citizen@ghanabuild.gov.gh',
        phone: '+233 24 123 4567',
        role: 'CITIZEN',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        organization: null,
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        created_at: '2024-02-10T08:00:00.000Z',
        updated_at: '2024-02-10T08:00:00.000Z',
      },
      {
        id: 'usr-cit-002',
        auth_user_id: 'auth-cit-002',
        full_name: 'Abena Ofori',
        email: 'abena.ofori@ghanabuild.gov.gh',
        phone: '+233 55 888 1234',
        role: 'CITIZEN',
        region_id: 'REG-ASHANTI-01',
        district_id: 'DIST-KUMASI-METRO',
        organization: null,
        is_active: true,
        account_status: 'ACTIVE',
        last_active_at: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
        created_at: '2024-02-12T08:00:00.000Z',
        updated_at: '2024-02-12T08:00:00.000Z',
      },
      {
        id: 'usr-sus-001',
        auth_user_id: 'auth-sus-001',
        full_name: 'Frank Quaye (Suspended)',
        email: 'frank.quaye@ghanabuild.gov.gh',
        phone: '+233 24 000 8899',
        role: 'CITIZEN',
        region_id: 'REG-GAR-01',
        district_id: 'DIST-ACCRA-METRO',
        organization: null,
        is_active: false,
        account_status: 'SUSPENDED',
        last_active_at: '2024-02-15T10:00:00.000Z',
        created_at: '2024-01-25T08:00:00.000Z',
        updated_at: '2024-02-15T10:00:00.000Z',
      },
    ];
  }

  // --- Geography & Relationships ---

  public getRegions() {
    return this.regions.map((r) => ({
      ...r,
      districts_count: this.districts.filter((d) => d.region_id === r.id).length,
    }));
  }

  public getDistricts(regionId?: string) {
    if (!regionId) return this.districts;
    return this.districts.filter((d) => d.region_id === regionId);
  }

  public getCommunities(districtId?: string) {
    if (!districtId) return this.communities;
    return this.communities.filter((c) => c.district_id === districtId);
  }

  public getCategories() {
    return this.categories;
  }

  public validateGeography(
    regionId: string,
    districtId: string,
    communityId?: string | null
  ): { valid: boolean; error?: string } {
    const region = this.regions.find((r) => r.id === regionId);
    if (!region) {
      return { valid: false, error: `Invalid region ID '${regionId}'. Region not found.` };
    }

    const district = this.districts.find((d) => d.id === districtId);
    if (!district) {
      return { valid: false, error: `Invalid district ID '${districtId}'. District not found.` };
    }

    if (district.region_id !== regionId) {
      return {
        valid: false,
        error: `Geographic mismatch: District '${district.name}' (${districtId}) does not belong to region '${region.name}' (${regionId}).`,
      };
    }

    if (communityId) {
      const community = this.communities.find((c) => c.id === communityId);
      if (!community) {
        return { valid: false, error: `Invalid community ID '${communityId}'. Community not found.` };
      }
      if (community.district_id !== districtId) {
        return {
          valid: false,
          error: `Geographic mismatch: Community '${community.name}' (${communityId}) does not belong to district '${district.name}' (${districtId}).`,
        };
      }
    }

    return { valid: true };
  }

  // --- Slugs ---

  public generateSlug(title: string, excludeProjectId?: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let candidate = baseSlug || 'project';
    let counter = 1;

    while (
      this.projects.some(
        (p) => p.slug === candidate && (!excludeProjectId || p.id !== excludeProjectId)
      )
    ) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }

  // --- Project CRUD ---

  public listProjects(options: ListProjectsOptions = {}): {
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const {
      search,
      region,
      district,
      community,
      category,
      contractor,
      status,
      verification_status,
      min_budget,
      max_budget,
      min_progress,
      max_progress,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      includeAllStatus = false,
    } = options;

    let filtered = [...this.projects];

    // Public default visibility constraint: ONLY VERIFIED, non-ARCHIVED projects
    if (!includeAllStatus) {
      filtered = filtered.filter(
        (p) => p.verification_status === 'VERIFIED'
      );
    } else {
      if (verification_status) {
        filtered = filtered.filter((p) => p.verification_status === verification_status);
      }
    }

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const contractorName = this.contractors.find((c) => c.id === p.contractor_id)?.name || '';
        const regionName = this.regions.find((r) => r.id === p.region_id)?.name || '';
        const districtName = this.districts.find((d) => d.id === p.district_id)?.name || '';
        const communityName = this.communities.find((c) => c.id === p.community_id)?.name || '';
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location_name.toLowerCase().includes(q) ||
          contractorName.toLowerCase().includes(q) ||
          regionName.toLowerCase().includes(q) ||
          districtName.toLowerCase().includes(q) ||
          communityName.toLowerCase().includes(q)
        );
      });
    }

    if (region) {
      filtered = filtered.filter((p) => p.region_id === region || p.region_id.toLowerCase().includes(region.toLowerCase()));
    }

    if (district) {
      filtered = filtered.filter((p) => p.district_id === district || p.district_id.toLowerCase().includes(district.toLowerCase()));
    }

    if (community) {
      filtered = filtered.filter((p) => p.community_id === community);
    }

    if (category) {
      filtered = filtered.filter((p) => p.category_id === category || p.category_id.toLowerCase().includes(category.toLowerCase()));
    }

    if (contractor) {
      filtered = filtered.filter((p) => p.contractor_id === contractor);
    }

    if (status) {
      filtered = filtered.filter((p) => p.project_status === status);
    }

    if (typeof min_budget === 'number') {
      filtered = filtered.filter((p) => p.budget >= min_budget);
    }

    if (typeof max_budget === 'number') {
      filtered = filtered.filter((p) => p.budget <= max_budget);
    }

    if (typeof min_progress === 'number') {
      filtered = filtered.filter((p) => p.progress_percentage >= min_progress);
    }

    if (typeof max_progress === 'number') {
      filtered = filtered.filter((p) => p.progress_percentage <= max_progress);
    }

    // Sort with server-side allowlist
    const ALLOWED_SORTS = ['created_at', 'budget', 'progress_percentage', 'title', 'updated_at', 'start_date', 'expected_completion_date'];
    const safeSort = ALLOWED_SORTS.includes(sort) ? sort : 'created_at';

    filtered.sort((a, b) => {
      let comp = 0;
      if (safeSort === 'budget') {
        comp = a.budget - b.budget;
      } else if (safeSort === 'progress_percentage') {
        comp = a.progress_percentage - b.progress_percentage;
      } else if (safeSort === 'title') {
        comp = a.title.localeCompare(b.title);
      } else if (safeSort === 'updated_at') {
        comp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else {
        comp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return order === 'asc' ? comp : -comp;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Hydrate relation objects efficiently
    const hydrated = paginated.map((p) => this.hydrateRelations(p));

    return {
      projects: hydrated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // --- Public Data Access Functions (Requirement #32) ---

  public getPublicStatistics(): {
    total_projects: number;
    ongoing_projects: number;
    completed_projects: number;
    planned_projects: number;
    on_hold_projects: number;
    total_budget: number;
    regions_active: number;
    contractors_count: number;
    community_reports_count: number;
  } {
    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED'
    );

    const ongoing = verified.filter((p) => p.project_status === 'ONGOING').length;
    const completed = verified.filter((p) => p.project_status === 'COMPLETED').length;
    const planned = verified.filter((p) => p.project_status === 'PLANNED').length;
    const onHold = verified.filter((p) => p.project_status === 'ON_HOLD').length;
    const totalBudget = verified.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const regionsActive = new Set(verified.map((p) => p.region_id)).size;
    const contractors = new Set(verified.map((p) => p.contractor_id).filter(Boolean)).size;

    return {
      total_projects: verified.length,
      ongoing_projects: ongoing,
      completed_projects: completed,
      planned_projects: planned,
      on_hold_projects: onHold,
      total_budget: totalBudget,
      regions_active: regionsActive,
      contractors_count: contractors,
      community_reports_count: 14,
    };
  }

  public getFeaturedProjects(limit = 4): Project[] {
    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED'
    );
    return verified
      .slice(0, limit)
      .map((p) => this.hydrateRelations(p));
  }

  public getProjectMapData(filters?: {
    region?: string;
    district?: string;
    community?: string;
    category?: string;
    status?: string;
    verification_status?: string;
    search?: string;
    min_progress?: number;
    max_progress?: number;
    contractor?: string;
    actor?: Profile;
  }): Array<{
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
  }> {
    let pool = [...this.projects];

    // Public view only sees VERIFIED projects unless authorized admin/officer requests otherwise
    if (filters?.actor) {
      if (filters.actor.role === 'MMDCE_OFFICER') {
        pool = pool.filter((p) => p.district_id === filters.actor?.district_id);
      } else if (filters.actor.role === 'REGIONAL_OFFICER') {
        pool = pool.filter((p) => p.region_id === filters.actor?.region_id);
      }
      if (filters.verification_status) {
        pool = pool.filter((p) => p.verification_status === filters.verification_status);
      }
    } else {
      pool = pool.filter((p) => p.verification_status === 'VERIFIED');
    }

    if (filters?.region) {
      const reg = filters.region.toLowerCase();
      pool = pool.filter(
        (p) => p.region_id.toLowerCase().includes(reg) ||
               this.regions.find((r) => r.id === p.region_id)?.name.toLowerCase().replace(/\s+/g, '-').includes(reg) ||
               this.regions.find((r) => r.id === p.region_id)?.code.toLowerCase() === reg
      );
    }

    if (filters?.district) {
      const dist = filters.district.toLowerCase();
      pool = pool.filter(
        (p) => p.district_id.toLowerCase().includes(dist) ||
               this.districts.find((d) => d.id === p.district_id)?.name.toLowerCase().replace(/\s+/g, '-').includes(dist)
      );
    }

    if (filters?.community) {
      const comm = filters.community.toLowerCase();
      pool = pool.filter(
        (p) => (p.community_id && p.community_id.toLowerCase().includes(comm)) ||
               (p.location_name && p.location_name.toLowerCase().includes(comm))
      );
    }

    if (filters?.category) {
      const cat = filters.category.toLowerCase();
      pool = pool.filter(
        (p) => p.category_id.toLowerCase().includes(cat) ||
               this.categories.find((c) => c.id === p.category_id)?.slug.toLowerCase().includes(cat)
      );
    }

    if (filters?.status) {
      pool = pool.filter((p) => p.project_status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      pool = pool.filter(
        (p) => p.title.toLowerCase().includes(q) ||
               (p.description && p.description.toLowerCase().includes(q)) ||
               (p.location_name && p.location_name.toLowerCase().includes(q)) ||
               (p.contractor_id && this.contractors.find((c) => c.id === p.contractor_id)?.name.toLowerCase().includes(q))
      );
    }

    if (filters?.contractor) {
      const cId = filters.contractor.toLowerCase();
      pool = pool.filter(
        (p) => (p.contractor_id && p.contractor_id.toLowerCase().includes(cId)) ||
               (p.contractor_id && this.contractors.find((c) => c.id === p.contractor_id)?.name.toLowerCase().includes(cId))
      );
    }

    if (typeof filters?.min_progress === 'number') {
      pool = pool.filter((p) => (p.progress_percentage || 0) >= filters.min_progress!);
    }

    if (typeof filters?.max_progress === 'number') {
      pool = pool.filter((p) => (p.progress_percentage || 0) <= filters.max_progress!);
    }

    return pool.map((p) => {
      const cat = this.categories.find((c) => c.id === p.category_id);
      const reg = this.regions.find((r) => r.id === p.region_id);
      const dist = this.districts.find((d) => d.id === p.district_id);
      const contractor = this.contractors.find((c) => c.id === p.contractor_id);

      const isValidLat = typeof p.latitude === 'number' && !isNaN(p.latitude) && p.latitude >= -90 && p.latitude <= 90;
      const isValidLng = typeof p.longitude === 'number' && !isNaN(p.longitude) && p.longitude >= -180 && p.longitude <= 180;
      const hasValidCoords = isValidLat && isValidLng && (p.latitude !== 0 || p.longitude !== 0);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: {
          name: cat?.name || 'General',
          slug: cat?.slug || 'other',
          icon: cat?.icon || 'Layers',
        },
        region: {
          id: reg?.id || p.region_id,
          name: reg?.name || 'Ghana',
          code: reg?.code || 'GH',
        },
        district: {
          id: dist?.id || p.district_id,
          name: dist?.name || 'District',
        },
        location_name: p.location_name,
        latitude: p.latitude,
        longitude: p.longitude,
        project_status: p.project_status,
        verification_status: p.verification_status,
        progress_percentage: p.progress_percentage || 0,
        budget: p.budget || 0,
        currency: p.currency || 'GHS',
        contractor_name: contractor?.name,
        has_valid_coordinates: hasValidCoords,
        updated_at: p.updated_at || p.created_at,
      };
    });
  }

  public getRegionStatistics(): Array<{
    id: string;
    name: string;
    code: string;
    capital: string;
    slug: string;
    total_projects: number;
    ongoing_count: number;
    completed_count: number;
    on_hold_count: number;
    planned_count: number;
    total_budget: number;
    districts_count: number;
  }> {
    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED'
    );

    return this.regions.map((reg) => {
      const regProjects = verified.filter((p) => p.region_id === reg.id);
      const districts = this.districts.filter((d) => d.region_id === reg.id).length;
      return {
        id: reg.id,
        name: reg.name,
        code: reg.code,
        capital: reg.capital,
        slug: reg.name.toLowerCase().replace(/\s+/g, '-'),
        total_projects: regProjects.length,
        ongoing_count: regProjects.filter((p) => p.project_status === 'ONGOING').length,
        completed_count: regProjects.filter((p) => p.project_status === 'COMPLETED').length,
        on_hold_count: regProjects.filter((p) => p.project_status === 'ON_HOLD').length,
        planned_count: regProjects.filter((p) => p.project_status === 'PLANNED').length,
        total_budget: regProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        districts_count: districts,
      };
    });
  }

  public getRegionBySlugOrId(slugOrId: string): {
    region: { id: string; name: string; code: string; capital: string; slug: string };
    districts: Array<{ id: string; name: string; district_type: string; slug: string; projects_count: number; total_budget: number }>;
    stats: {
      total_projects: number;
      ongoing_count: number;
      completed_count: number;
      on_hold_count: number;
      planned_count: number;
      total_budget: number;
      districts_count: number;
    };
    projects: Project[];
  } | null {
    const norm = slugOrId.toLowerCase().replace(/\s+/g, '-');
    const region = this.regions.find(
      (r) => r.id.toLowerCase() === norm ||
             r.code.toLowerCase() === norm ||
             r.name.toLowerCase().replace(/\s+/g, '-') === norm
    );
    if (!region) return null;

    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED' && p.region_id === region.id
    );
    const regionDistricts = this.districts.filter((d) => d.region_id === region.id);

    const districtsWithStats = regionDistricts.map((d) => {
      const dProjects = verified.filter((p) => p.district_id === d.id);
      return {
        id: d.id,
        name: d.name,
        district_type: d.district_type,
        slug: d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        projects_count: dProjects.length,
        total_budget: dProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
      };
    });

    return {
      region: { ...region, slug: region.name.toLowerCase().replace(/\s+/g, '-') },
      districts: districtsWithStats,
      stats: {
        total_projects: verified.length,
        ongoing_count: verified.filter((p) => p.project_status === 'ONGOING').length,
        completed_count: verified.filter((p) => p.project_status === 'COMPLETED').length,
        on_hold_count: verified.filter((p) => p.project_status === 'ON_HOLD').length,
        planned_count: verified.filter((p) => p.project_status === 'PLANNED').length,
        total_budget: verified.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        districts_count: regionDistricts.length,
      },
      projects: verified.map((p) => this.hydrateRelations(p)),
    };
  }

  public getDistrictBySlugOrId(slugOrId: string, regionSlugOrId?: string): {
    district: DistrictData & { slug: string };
    region: RegionData & { slug: string };
    communities: Array<CommunityData & { projects_count: number }>;
    statistics: {
      total_projects: number;
      ongoing_projects: number;
      completed_projects: number;
      planned_projects: number;
      on_hold_projects: number;
      abandoned_projects: number;
      total_budget_ghs: number;
      average_progress: number;
    };
    projects: Project[];
  } | null {
    const norm = slugOrId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const district = this.districts.find(
      (d) => d.id.toLowerCase() === norm ||
             d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm ||
             d.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm
    );
    if (!district) return null;

    const region = this.regions.find((r) => r.id === district.region_id);
    if (!region) return null;

    if (regionSlugOrId) {
      const regNorm = regionSlugOrId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const matchesRegion =
        region.id.toLowerCase() === regNorm ||
        region.code.toLowerCase() === regNorm ||
        region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === regNorm;
      if (!matchesRegion) return null;
    }

    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED' && p.district_id === district.id
    );

    const districtCommunities = this.communities.filter((c) => c.district_id === district.id);
    const communitiesWithCounts = districtCommunities.map((c) => ({
      ...c,
      projects_count: verified.filter(
        (p) => p.community_id === c.id || (p.location_name && p.location_name.toLowerCase().includes(c.name.toLowerCase()))
      ).length,
    }));

    const avgProgress = verified.length > 0
      ? Math.round(verified.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / verified.length)
      : 0;

    return {
      district: {
        ...district,
        slug: district.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
      region: {
        ...region,
        slug: region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
      communities: communitiesWithCounts,
      statistics: {
        total_projects: verified.length,
        ongoing_projects: verified.filter((p) => p.project_status === 'ONGOING').length,
        completed_projects: verified.filter((p) => p.project_status === 'COMPLETED').length,
        planned_projects: verified.filter((p) => p.project_status === 'PLANNED').length,
        on_hold_projects: verified.filter((p) => p.project_status === 'ON_HOLD').length,
        abandoned_projects: verified.filter((p) => p.project_status === 'ABANDONED').length,
        total_budget_ghs: verified.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        average_progress: avgProgress,
      },
      projects: verified.map((p) => this.hydrateRelations(p)),
    };
  }

  public getPublicAnalytics(filters?: {
    range?: string;
    region?: string;
    category?: string;
  }): PublicAnalyticsData {
    const timeRange = filters?.range || 'all';
    let pool = this.projects.filter((p) => p.verification_status === 'VERIFIED');

    if (filters?.region) {
      const reg = filters.region.toLowerCase();
      pool = pool.filter(
        (p) => p.region_id.toLowerCase().includes(reg) ||
               this.regions.find((r) => r.id === p.region_id)?.name.toLowerCase().replace(/\s+/g, '-').includes(reg)
      );
    }

    if (filters?.category) {
      const cat = filters.category.toLowerCase();
      pool = pool.filter(
        (p) => p.category_id.toLowerCase().includes(cat) ||
               this.categories.find((c) => c.id === p.category_id)?.slug.toLowerCase().includes(cat)
      );
    }

    if (timeRange !== 'all') {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        '7d': now - 7 * 86400000,
        '30d': now - 30 * 86400000,
        '90d': now - 90 * 86400000,
        year: now - 365 * 86400000,
      };
      const cutoff = cutoffMap[timeRange] || 0;
      pool = pool.filter((p) => new Date(p.created_at).getTime() >= cutoff);
    }

    const totalProjects = pool.length;
    const totalBudget = pool.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const avgProgress = totalProjects > 0
      ? Math.round(pool.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalProjects)
      : 0;

    const completedProjects = pool.filter((p) => p.project_status === 'COMPLETED').length;
    const ongoingProjects = pool.filter((p) => p.project_status === 'ONGOING').length;
    const onHoldProjects = pool.filter((p) => p.project_status === 'ON_HOLD').length;
    const abandonedProjects = pool.filter((p) => p.project_status === 'ABANDONED').length;

    const activeRegions = new Set(pool.map((p) => p.region_id)).size;
    const activeDistricts = new Set(pool.map((p) => p.district_id)).size;

    const projectIds = new Set(pool.map((p) => p.id));
    const evidenceCount = this.projectEvidence.filter((e) => projectIds.has(e.project_id) && e.verification_status === 'VERIFIED').length;
    const relevantReports = this.projectReports.filter((r) => projectIds.has(r.project_id));

    // Projects by Region (All 16 regions)
    const projectsByRegion = this.regions.map((reg) => {
      const rProjects = pool.filter((p) => p.region_id === reg.id);
      const rBudget = rProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
      const rAvgProg = rProjects.length > 0
        ? Math.round(rProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / rProjects.length)
        : 0;

      return {
        region_id: reg.id,
        region_name: reg.name,
        code: reg.code,
        slug: reg.name.toLowerCase().replace(/\s+/g, '-'),
        count: rProjects.length,
        total_budget: rBudget,
        average_progress: rAvgProg,
        completed_count: rProjects.filter((p) => p.project_status === 'COMPLETED').length,
        ongoing_count: rProjects.filter((p) => p.project_status === 'ONGOING').length,
      };
    });

    // Projects by Category
    const projectsByCategory = this.categories.map((cat) => {
      const cProjects = pool.filter((p) => p.category_id === cat.id);
      const cBudget = cProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
      const cAvgProg = cProjects.length > 0
        ? Math.round(cProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / cProjects.length)
        : 0;
      const cCompleted = cProjects.filter((p) => p.project_status === 'COMPLETED').length;
      const cRate = cProjects.length > 0 ? Math.round((cCompleted / cProjects.length) * 100) : 0;

      return {
        category_id: cat.id,
        category_name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'Layers',
        count: cProjects.length,
        total_budget: cBudget,
        average_progress: cAvgProg,
        completion_rate: cRate,
      };
    }).filter((c) => c.count > 0);

    // Status breakdown
    const statusKeys: ProjectStatus[] = ['PLANNED', 'ONGOING', 'COMPLETED', 'ON_HOLD', 'ABANDONED'];
    const projectsByStatus = statusKeys.map((st) => {
      const cnt = pool.filter((p) => p.project_status === st).length;
      return {
        status: st,
        count: cnt,
        percentage: totalProjects > 0 ? Math.round((cnt / totalProjects) * 100) : 0,
      };
    });

    // Progress distribution
    const progressRanges = [
      { range: '0-25%' as const, min: 0, max: 25 },
      { range: '26-50%' as const, min: 26, max: 50 },
      { range: '51-75%' as const, min: 51, max: 75 },
      { range: '76-99%' as const, min: 76, max: 99 },
      { range: '100%' as const, min: 100, max: 100 },
    ];
    const progressDistribution = progressRanges.map((pr) => {
      const count = pool.filter((p) => {
        const prog = p.progress_percentage || 0;
        return prog >= pr.min && prog <= pr.max;
      }).length;
      return {
        range: pr.range,
        count,
        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
      };
    });

    // Verification Overview
    const verifOverview = [
      {
        status: 'VERIFIED' as VerificationStatus,
        count: totalProjects,
        percentage: 100,
      },
    ];

    // Reports summary
    const resolvedReports = relevantReports.filter((r) => r.status === 'RESOLVED').length;
    const underReviewReports = relevantReports.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'OPEN').length;

    const reportTypeMap: Record<string, { label: string; count: number }> = {
      DELAY: { label: 'Construction Delays', count: 0 },
      DEFECT: { label: 'Material or Workmanship Defect', count: 0 },
      ABANDONED: { label: 'Site Inactivity / Abandonment', count: 0 },
      CORRUPTION: { label: 'Budget Discrepancy / Irregularity', count: 0 },
      SAFETY: { label: 'Community Safety Hazard', count: 0 },
      ENVIRONMENTAL: { label: 'Environmental Impact', count: 0 },
      OTHER: { label: 'General Community Feedback', count: 0 },
    };

    relevantReports.forEach((r) => {
      const t = r.report_type || 'OTHER';
      if (reportTypeMap[t]) {
        reportTypeMap[t].count++;
      } else {
        reportTypeMap.OTHER.count++;
      }
    });

    const reportsByType = Object.entries(reportTypeMap).map(([type, val]) => ({
      type,
      label: val.label,
      count: val.count,
    }));

    // Monthly activity
    const monthlyActivity = [
      { period: 'Jan 2024', new_projects: 3, completed_projects: 1 },
      { period: 'Feb 2024', new_projects: 4, completed_projects: 2 },
      { period: 'Mar 2024', new_projects: 2, completed_projects: 1 },
      { period: 'Apr 2024', new_projects: 5, completed_projects: 3 },
      { period: 'May 2024', new_projects: 3, completed_projects: 2 },
      { period: 'Jun 2024', new_projects: totalProjects, completed_projects: completedProjects },
    ];

    return {
      time_range: timeRange,
      last_updated: new Date().toISOString(),
      summary: {
        total_projects: totalProjects,
        verified_projects: totalProjects,
        total_budget: totalBudget,
        average_progress: avgProgress,
        completed_projects: completedProjects,
        ongoing_projects: ongoingProjects,
        on_hold_projects: onHoldProjects,
        abandoned_projects: abandonedProjects,
        active_regions_count: activeRegions,
        active_districts_count: activeDistricts,
        evidence_count: evidenceCount,
        community_reports_count: relevantReports.length,
      },
      projects_by_region: projectsByRegion,
      projects_by_category: projectsByCategory,
      projects_by_status: projectsByStatus,
      progress_distribution: progressDistribution,
      verification_overview: verifOverview,
      reports_summary: {
        total_reports: relevantReports.length,
        resolved_count: resolvedReports,
        under_review_count: underReviewReports,
        reports_by_type: reportsByType,
      },
      monthly_activity: monthlyActivity,
    };
  }

  public getCategoryStatistics(): Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    total_projects: number;
    ongoing_count: number;
    completed_count: number;
    total_budget: number;
    regions_represented: number;
  }> {
    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED'
    );

    return this.categories.map((cat) => {
      const catProjects = verified.filter((p) => p.category_id === cat.id);
      const regions = new Set(catProjects.map((p) => p.region_id)).size;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || 'Layers',
        total_projects: catProjects.length,
        ongoing_count: catProjects.filter((p) => p.project_status === 'ONGOING').length,
        completed_count: catProjects.filter((p) => p.project_status === 'COMPLETED').length,
        total_budget: catProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        regions_represented: regions,
      };
    });
  }

  public getCategoryBySlugOrId(slugOrId: string): {
    category: (typeof PROJECT_CATEGORIES_DATA)[0];
    stats: {
      total_projects: number;
      ongoing_count: number;
      completed_count: number;
      total_budget: number;
      regions_represented: number;
    };
    projects: Project[];
  } | null {
    const norm = slugOrId.toLowerCase().replace(/\s+/g, '-');
    const category = this.categories.find(
      (c) => c.id.toLowerCase() === norm || c.slug.toLowerCase() === norm
    );
    if (!category) return null;

    const verified = this.projects.filter(
      (p) => p.verification_status === 'VERIFIED' && p.category_id === category.id
    );
    const regions = new Set(verified.map((p) => p.region_id)).size;

    return {
      category,
      stats: {
        total_projects: verified.length,
        ongoing_count: verified.filter((p) => p.project_status === 'ONGOING').length,
        completed_count: verified.filter((p) => p.project_status === 'COMPLETED').length,
        total_budget: verified.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        regions_represented: regions,
      },
      projects: verified.map((p) => this.hydrateRelations(p)),
    };
  }

  public getProjectByIdOrSlug(idOrSlug: string): Project | null {
    const project = this.projects.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (!project) return null;
    return this.hydrateRelations(project);
  }

  private hydrateRelations(project: Project): Project {
    return {
      ...project,
      category: this.categories.find((c) => c.id === project.category_id),
      region: this.regions.find((r) => r.id === project.region_id),
      district: this.districts.find((d) => d.id === project.district_id),
      community: this.communities.find((c) => c.id === project.community_id),
      contractor: this.contractors.find((c) => c.id === project.contractor_id),
    };
  }

  public createProject(
    input: Omit<Project, 'id' | 'slug' | 'created_at' | 'updated_at'>,
    author: Profile
  ): { project: Project } {
    const geoCheck = this.validateGeography(input.region_id, input.district_id, input.community_id);
    if (!geoCheck.valid) {
      throw new Error(`INVALID_LOCATION: ${geoCheck.error}`);
    }

    const id = `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const slug = this.generateSlug(input.title);
    const now = new Date().toISOString();

    const newProject: Project = {
      ...input,
      id,
      slug,
      created_by: author.id,
      created_at: now,
      updated_at: now,
    };

    this.projects.unshift(newProject);

    // Record Audit Log
    this.addAuditLog({
      user_id: author.id,
      user_email: author.email,
      action: 'PROJECT_CREATED',
      entity_type: 'PROJECT',
      entity_id: id,
      old_values: null,
      new_values: {
        title: newProject.title,
        budget: newProject.budget,
        currency: newProject.currency,
        region_id: newProject.region_id,
        district_id: newProject.district_id,
        status: newProject.project_status,
        verification_status: newProject.verification_status,
      },
      reason: 'Official project created via GhanaBuild Administration Portal',
    });

    return { project: this.hydrateRelations(newProject) };
  }

  public updateProject(
    id: string,
    updates: Partial<Project>,
    actor: Profile
  ): { project: Project; changedFields: string[] } {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const existing = this.projects[index];
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const changedFields: string[] = [];

    // Check geography if location fields changed
    const targetRegion = updates.region_id || existing.region_id;
    const targetDistrict = updates.district_id || existing.district_id;
    const targetCommunity = updates.community_id !== undefined ? updates.community_id : existing.community_id;

    if (updates.region_id || updates.district_id || updates.community_id !== undefined) {
      const geoCheck = this.validateGeography(targetRegion, targetDistrict, targetCommunity);
      if (!geoCheck.valid) {
        throw new Error(`INVALID_LOCATION: ${geoCheck.error}`);
      }
    }

    // Whitelisted fields to copy
    const allowedKeys: (keyof Project)[] = [
      'title',
      'description',
      'category_id',
      'community_id',
      'location_name',
      'latitude',
      'longitude',
      'contractor_id',
      'budget',
      'currency',
      'start_date',
      'expected_completion_date',
      'actual_completion_date',
      'progress_percentage',
      'project_status',
      'verification_status',
    ];

    allowedKeys.forEach((key) => {
      if (updates[key] !== undefined && updates[key] !== existing[key]) {
        oldValues[key] = existing[key];
        newValues[key] = updates[key];
        changedFields.push(key);
      }
    });

    if (changedFields.length === 0) {
      return { project: this.hydrateRelations(existing), changedFields: [] };
    }

    const updated: Project = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      slug: updates.title ? existing.slug : existing.slug, // Stable slug per requirement #18
      created_by: existing.created_by, // Immutable Creator
      created_at: existing.created_at, // Immutable Creation timestamp
      updated_at: new Date().toISOString(),
    };

    this.projects[index] = updated;

    // Generate targeted audit logs
    if (changedFields.includes('project_status')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'PROJECT_STATUS_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { project_status: existing.project_status },
        new_values: { project_status: updated.project_status },
        reason: `Status transition from ${existing.project_status} to ${updated.project_status}`,
      });
    }

    if (changedFields.includes('progress_percentage')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'PROJECT_PROGRESS_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { progress_percentage: existing.progress_percentage },
        new_values: { progress_percentage: updated.progress_percentage },
        reason: `Progress updated from ${existing.progress_percentage}% to ${updated.progress_percentage}%`,
      });
    }

    if (changedFields.includes('budget')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'BUDGET_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { budget: existing.budget, currency: existing.currency },
        new_values: { budget: updated.budget, currency: updated.currency },
        reason: 'Authorized budget revision',
      });
    }

    if (changedFields.includes('contractor_id')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'CONTRACTOR_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { contractor_id: existing.contractor_id },
        new_values: { contractor_id: updated.contractor_id },
        reason: 'Contractor reassignment',
      });
    }

    if (changedFields.includes('start_date') || changedFields.includes('expected_completion_date')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'DATES_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { start_date: existing.start_date, expected_completion_date: existing.expected_completion_date },
        new_values: { start_date: updated.start_date, expected_completion_date: updated.expected_completion_date },
        reason: 'Project delivery milestone revision',
      });
    }

    if (changedFields.includes('verification_status')) {
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'PROJECT_VERIFICATION_CHANGED',
        entity_type: 'PROJECT',
        entity_id: id,
        old_values: { verification_status: existing.verification_status },
        new_values: { verification_status: updated.verification_status },
        reason: 'Verification state update',
      });
    }

    // General update log
    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'PROJECT_UPDATED',
      entity_type: 'PROJECT',
      entity_id: id,
      old_values: oldValues,
      new_values: newValues,
      reason: `Updated fields: ${changedFields.join(', ')}`,
    });

    return { project: this.hydrateRelations(updated), changedFields };
  }

  public archiveProject(
    id: string,
    actor: Profile,
    reason?: string
  ): { project: Project } {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const existing = this.projects[index];
    const updated: Project = {
      ...existing,
      verification_status: 'ARCHIVED',
      updated_at: new Date().toISOString(),
    };

    this.projects[index] = updated;

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'PROJECT_ARCHIVED',
      entity_type: 'PROJECT',
      entity_id: id,
      old_values: { verification_status: existing.verification_status },
      new_values: { verification_status: 'ARCHIVED' },
      reason: reason || 'Project archived by authorized administrator',
    });

    return { project: this.hydrateRelations(updated) };
  }

  // --- Project Timeline Updates ---

  public listUpdates(projectId: string): ProjectUpdateRecord[] {
    return this.projectUpdates
      .filter((u) => u.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createUpdate(
    projectId: string,
    input: {
      title: string;
      description: string;
      progress_percentage: number;
      status: ProjectStatus;
    },
    author: Profile
  ): { update: ProjectUpdateRecord; project: Project } {
    const projectIndex = this.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const existingProject = this.projects[projectIndex];
    const updateId = `UPD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record: ProjectUpdateRecord = {
      id: updateId,
      project_id: projectId,
      title: input.title,
      description: input.description,
      progress_percentage: input.progress_percentage,
      status: input.status,
      created_by: author.id,
      created_by_name: `${author.full_name} (${author.role})`,
      created_at: now,
    };

    this.projectUpdates.unshift(record);

    // Update project's progress and status accordingly
    const oldProgress = existingProject.progress_percentage;
    const oldStatus = existingProject.project_status;

    // Requirement #6: When progress reaches 100%, do not automatically mark project as COMPLETED
    // unless explicitly specified in input.status
    const updatedProject: Project = {
      ...existingProject,
      progress_percentage: input.progress_percentage,
      project_status: input.status,
      updated_at: now,
    };
    this.projects[projectIndex] = updatedProject;

    // Record audit logs
    this.addAuditLog({
      user_id: author.id,
      user_email: author.email,
      action: 'PROJECT_UPDATE_CREATED',
      entity_type: 'PROJECT',
      entity_id: projectId,
      old_values: { progress_percentage: oldProgress, project_status: oldStatus },
      new_values: {
        update_id: updateId,
        update_title: input.title,
        progress_percentage: input.progress_percentage,
        project_status: input.status,
      },
      reason: `Timeline milestone update: ${input.title}`,
    });

    return { update: record, project: this.hydrateRelations(updatedProject) };
  }

  public listUpdatesPaginated(
    projectId: string,
    options?: { page?: number; limit?: number }
  ): {
    updates: ProjectUpdateRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 10));
    const all = this.projectUpdates
      .filter((u) => u.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const updates = all.slice(offset, offset + limit);

    return { updates, total, page, limit, totalPages };
  }

  // --- Phase 5: Project Evidence ---

  public listEvidence(
    projectId: string,
    options?: { isOfficer?: boolean; userId?: string; page?: number; limit?: number }
  ): {
    evidence: ProjectEvidenceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 12));

    const all = this.projectEvidence
      .filter((e) => {
        if (e.project_id !== projectId) return false;
        if (options?.isOfficer) return true;
        // Public citizen view: only VERIFIED evidence, or evidence uploaded by this authenticated user
        if (e.verification_status === 'VERIFIED') return true;
        if (options?.userId && e.uploaded_by === options.userId) return true;
        return false;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const evidence = all.slice(offset, offset + limit);

    return { evidence, total, page, limit, totalPages };
  }

  public getEvidenceById(evidenceId: string): ProjectEvidenceRecord | null {
    return this.projectEvidence.find((e) => e.id === evidenceId) || null;
  }

  public getEvidenceByClientId(clientEvidenceId: string): ProjectEvidenceRecord | null {
    return this.projectEvidence.find((e) => e.client_evidence_id === clientEvidenceId) || null;
  }

  public createEvidence(
    projectId: string,
    input: {
      file_url: string;
      thumbnail_url?: string;
      file_type: string;
      file_size: number;
      caption?: string | null;
      evidence_type: EvidenceType;
      captured_at?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      inspection_id?: string | null;
      client_evidence_id?: string | null;
      storage_path?: string | null;
      original_filename?: string | null;
      force_pending?: boolean;
      id?: string;
    },
    actor: Profile
  ): { evidence: ProjectEvidenceRecord } {
    if (input.client_evidence_id) {
      const existing = this.projectEvidence.find((e) => e.client_evidence_id === input.client_evidence_id);
      if (existing) return { evidence: existing };
    }
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    // Security & File Validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];
    if (!allowedMimeTypes.includes(input.file_type.toLowerCase())) {
      throw new Error('INVALID_FILE_TYPE: File must be JPEG, PNG, WebP, MP4, or WebM.');
    }

    const maxFileSize = input.file_type.startsWith('video/') ? 52428800 : 15728640; // 50MB video, 15MB photo
    if (input.file_size > maxFileSize) {
      throw new Error(`FILE_TOO_LARGE: File size exceeds ${Math.round(maxFileSize / 1048576)}MB limit.`);
    }

    // Determine initial verification status
    let initialStatus: VerificationStatus = 'PENDING';
    const isPrivilegedOfficer = ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(actor.role) ||
      (actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);

    if (isPrivilegedOfficer && !input.force_pending) {
      initialStatus = 'VERIFIED';
    }

    const id = input.id || `EVD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record: ProjectEvidenceRecord = {
      id,
      project_id: projectId,
      uploaded_by: actor.id,
      uploader_name: `${actor.full_name} (${actor.role})`,
      file_url: input.file_url,
      thumbnail_url: input.thumbnail_url || (input.file_type.startsWith('image/') ? input.file_url : undefined),
      file_type: input.file_type,
      file_size: input.file_size,
      caption: input.caption || null,
      evidence_type: input.evidence_type,
      captured_at: input.captured_at || now,
      latitude: input.latitude !== undefined ? input.latitude : project.latitude,
      longitude: input.longitude !== undefined ? input.longitude : project.longitude,
      verification_status: initialStatus,
      verified_by: initialStatus === 'VERIFIED' ? actor.id : null,
      verified_at: initialStatus === 'VERIFIED' ? now : null,
      created_at: now,
      inspection_id: input.inspection_id || null,
      client_evidence_id: input.client_evidence_id || null,
      storage_path: input.storage_path || null,
      original_filename: input.original_filename || null,
      upload_status: input.storage_path ? 'UPLOADED' : undefined,
    };

    this.projectEvidence.unshift(record);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'EVIDENCE_UPLOADED',
      entity_type: 'PROJECT_EVIDENCE',
      entity_id: id,
      old_values: null,
      new_values: {
        project_id: projectId,
        evidence_type: input.evidence_type,
        file_type: input.file_type,
        verification_status: initialStatus,
      },
      reason: `Uploaded project evidence: ${input.evidence_type}`,
    });

    return { evidence: record };
  }

  public verifyEvidence(
    evidenceId: string,
    decision: 'VERIFIED' | 'REJECTED',
    actor: Profile,
    reason?: string
  ): { evidence: ProjectEvidenceRecord } {
    const index = this.projectEvidence.findIndex((e) => e.id === evidenceId);
    if (index === -1) {
      throw new Error('EVIDENCE_NOT_FOUND');
    }

    const existing = this.projectEvidence[index];
    const project = this.projects.find((p) => p.id === existing.project_id);

    // Verify actor authorization
    const canModerate = ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(actor.role) ||
      (project && actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (project && actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);

    if (!canModerate) {
      throw new Error('FORBIDDEN: User not authorized to moderate evidence for this project.');
    }

    const now = new Date().toISOString();
    const updated: ProjectEvidenceRecord = {
      ...existing,
      verification_status: decision,
      verified_by: actor.id,
      verified_at: now,
    };

    this.projectEvidence[index] = updated;

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: decision === 'VERIFIED' ? 'EVIDENCE_VERIFIED' : 'EVIDENCE_REJECTED',
      entity_type: 'PROJECT_EVIDENCE',
      entity_id: evidenceId,
      old_values: { verification_status: existing.verification_status },
      new_values: { verification_status: decision },
      reason: reason || `Evidence decision marked as ${decision}`,
    });

    return { evidence: updated };
  }

  public deleteEvidence(evidenceId: string, actor: Profile): { success: boolean } {
    const index = this.projectEvidence.findIndex((e) => e.id === evidenceId);
    if (index === -1) {
      throw new Error('EVIDENCE_NOT_FOUND');
    }

    const existing = this.projectEvidence[index];
    const project = this.projects.find((p) => p.id === existing.project_id);

    const canDelete = actor.role === 'SUPER_ADMIN' ||
      (project && actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (project && actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id) ||
      existing.uploaded_by === actor.id;

    if (!canDelete) {
      throw new Error('FORBIDDEN: You do not have permission to delete this evidence.');
    }

    this.projectEvidence.splice(index, 1);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'EVIDENCE_DELETED',
      entity_type: 'PROJECT_EVIDENCE',
      entity_id: evidenceId,
      old_values: { project_id: existing.project_id, file_url: existing.file_url },
      new_values: null,
      reason: 'Evidence deleted by authorized user',
    });

    return { success: true };
  }

  // --- Phase 5: Project Documents ---

  public listDocuments(
    projectId: string,
    options?: { isOfficer?: boolean; page?: number; limit?: number }
  ): {
    documents: ProjectDocumentRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 10));

    const all = this.projectDocuments
      .filter((d) => {
        if (d.project_id !== projectId) return false;
        // Public citizen: only public documents
        if (!options?.isOfficer && !d.is_public) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const documents = all.slice(offset, offset + limit);

    return { documents, total, page, limit, totalPages };
  }

  public getDocumentById(documentId: string): ProjectDocumentRecord | null {
    return this.projectDocuments.find((d) => d.id === documentId) || null;
  }

  public createDocument(
    projectId: string,
    input: {
      name: string;
      description?: string | null;
      file_url: string;
      document_type: string;
      file_size: number;
      is_public?: boolean;
    },
    actor: Profile
  ): { document: ProjectDocumentRecord } {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    // Role & Jurisdiction Check
    const canUploadDoc = actor.role === 'SUPER_ADMIN' ||
      actor.role === 'NATIONAL_MONITOR' ||
      (actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);

    if (!canUploadDoc) {
      throw new Error('FORBIDDEN: Only officers with jurisdiction can upload official project documents.');
    }

    if (input.file_size > 26214400) {
      throw new Error('FILE_TOO_LARGE: Document exceeds 25MB limit.');
    }

    const id = `DOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record: ProjectDocumentRecord = {
      id,
      project_id: projectId,
      name: input.name,
      description: input.description || null,
      file_url: input.file_url,
      document_type: input.document_type,
      file_size: input.file_size,
      is_public: input.is_public !== undefined ? input.is_public : true,
      uploaded_by: actor.id,
      uploader_name: `${actor.full_name} (${actor.role})`,
      created_at: now,
    };

    this.projectDocuments.unshift(record);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'DOCUMENT_UPLOADED',
      entity_type: 'PROJECT_DOCUMENT',
      entity_id: id,
      old_values: null,
      new_values: {
        project_id: projectId,
        name: input.name,
        document_type: input.document_type,
        is_public: record.is_public,
      },
      reason: `Uploaded project document: ${input.name}`,
    });

    return { document: record };
  }

  public deleteDocument(documentId: string, actor: Profile): { success: boolean } {
    const index = this.projectDocuments.findIndex((d) => d.id === documentId);
    if (index === -1) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const existing = this.projectDocuments[index];
    const project = this.projects.find((p) => p.id === existing.project_id);

    const canDelete = actor.role === 'SUPER_ADMIN' ||
      (project && actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (project && actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);

    if (!canDelete) {
      throw new Error('FORBIDDEN: You do not have permission to delete this project document.');
    }

    this.projectDocuments.splice(index, 1);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'DOCUMENT_DELETED',
      entity_type: 'PROJECT_DOCUMENT',
      entity_id: documentId,
      old_values: { project_id: existing.project_id, name: existing.name },
      new_values: null,
      reason: 'Document removed by authorized officer',
    });

    return { success: true };
  }

  // --- Phase 5 & 7: Project Verifications & Transparency History ---

  public verifyProject(
    projectId: string,
    input: {
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
    },
    actor: Profile
  ): {
    project: Project;
    verification: ProjectVerificationRecord;
  } {
    const index = this.projects.findIndex((p) => p.id === projectId);
    if (index === -1) {
      throw new Error('PROJECT_NOT_FOUND: Project not found.');
    }

    const existing = this.projects[index];

    // 1. RBAC Authority Verification
    const unauthorizedRoles = ['CITIZEN', 'COMMUNITY_OBSERVER', 'MODERATOR'];
    if (unauthorizedRoles.includes(actor.role)) {
      throw new Error(
        `FORBIDDEN_AUTHORITY: Role '${actor.role}' is not authorized to execute project verification decisions.`
      );
    }

    // 2. Jurisdiction Boundary Enforcement
    if (actor.role === 'MMDCE_OFFICER') {
      if (!actor.district_id || actor.district_id !== existing.district_id) {
        throw new Error(
          `JURISDICTION_MISMATCH: MMDCE Officer '${actor.full_name}' is assigned to district '${actor.district_id}' and cannot verify project '${existing.id}' in district '${existing.district_id}'.`
        );
      }
    } else if (actor.role === 'REGIONAL_OFFICER') {
      if (!actor.region_id || actor.region_id !== existing.region_id) {
        throw new Error(
          `JURISDICTION_MISMATCH: Regional Officer '${actor.full_name}' is assigned to region '${actor.region_id}' and cannot verify project '${existing.id}' in region '${existing.region_id}'.`
        );
      }
    }
    // SUPER_ADMIN and NATIONAL_MONITOR have nationwide jurisdiction

    // 3. State Transition Validation
    const validTransitions: Record<VerificationStatus, VerificationStatus[]> = {
      PENDING: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REQUEST_CHANGES'],
      UNDER_REVIEW: ['VERIFIED', 'REJECTED', 'REQUEST_CHANGES', 'UNDER_REVIEW'],
      REQUEST_CHANGES: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REQUEST_CHANGES'],
      REJECTED: ['UNDER_REVIEW'], // Re-evaluation requires bringing back under review first
      VERIFIED: ['UNDER_REVIEW'], // Revocation / audit re-examination
      ARCHIVED: [],
    };

    const targetStatus = input.decision as VerificationStatus;
    const allowed = validTransitions[existing.verification_status] || [];
    if (!allowed.includes(targetStatus) && existing.verification_status !== targetStatus) {
      throw new Error(
        `INVALID_STATE_TRANSITION: Cannot transition project verification from '${existing.verification_status}' to '${targetStatus}'.`
      );
    }

    // 4. Mandatory Justification for Negative or Conditional Decisions
    if (targetStatus === 'REJECTED' || targetStatus === 'REQUEST_CHANGES') {
      const trimmedReason = (input.reason || '').trim();
      if (trimmedReason.length < 5) {
        throw new Error(
          `MANDATORY_JUSTIFICATION_REQUIRED: A detailed reason (minimum 5 characters) is required when rejecting a project or requesting changes.`
        );
      }
    }

    // 5. Optimistic Concurrency Protection
    if (input.expected_status && input.expected_status !== existing.verification_status) {
      throw new Error(
        `CONCURRENT_MODIFICATION_CONFLICT: Project verification status was modified by another reviewer (expected '${input.expected_status}', found '${existing.verification_status}'). Please reload before submitting.`
      );
    }

    const previousStatus = existing.verification_status;
    const now = new Date().toISOString();

    // 6. Record Append-Only Verification History
    const verificationId = `VER-${existing.id.replace('PRJ-', '')}-${Date.now().toString(36).toUpperCase()}`;
    const reviewerTitle =
      actor.role === 'SUPER_ADMIN'
        ? 'National System Administrator'
        : actor.role === 'NATIONAL_MONITOR'
        ? 'National Infrastructure Monitoring Authority'
        : actor.role === 'REGIONAL_OFFICER'
        ? `${actor.organization || 'Regional Coordinating Council'} (Regional Officer)`
        : `${actor.organization || 'District Assembly'} (MMDCE Officer)`;

    const verificationRecord: ProjectVerificationRecord = {
      id: verificationId,
      project_id: existing.id,
      reviewer_id: actor.id,
      reviewer_title: reviewerTitle,
      previous_status: previousStatus,
      new_status: targetStatus,
      decision: input.notes
        ? `${targetStatus}: ${input.notes}`
        : `Official verification decision: ${targetStatus}`,
      reason:
        input.reason ||
        (targetStatus === 'VERIFIED' ? 'All statutory, financial, and geographic checks validated.' : null),
      created_at: now,
    };

    this.projectVerifications.unshift(verificationRecord);

    // 7. Atomic Update to Project Status
    const updatedProject: Project = {
      ...existing,
      verification_status: targetStatus,
      verified_by: targetStatus === 'VERIFIED' ? actor.id : targetStatus === 'PENDING' ? null : existing.verified_by,
      updated_at: now,
    };

    this.projects[index] = updatedProject;

    // 8. Immutable Audit Log Entry
    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: `PROJECT_VERIFICATION_${targetStatus}`,
      entity_type: 'PROJECT',
      entity_id: existing.id,
      old_values: { verification_status: previousStatus },
      new_values: {
        verification_status: targetStatus,
        verification_id: verificationId,
        reviewer_title: reviewerTitle,
        reason: input.reason || null,
      },
      reason: input.reason || `Project verification status updated to ${targetStatus}`,
    });

    // 9. System Notification for Project Creator
    if (existing.created_by) {
      this.createNotification({
        user_id: existing.created_by,
        title: `Project ${existing.title} marked as ${targetStatus}`,
        message: input.reason
          ? `Review decision by ${reviewerTitle}: ${input.reason}`
          : `Your project dossier has been officially updated to ${targetStatus}.`,
        type: 'VERIFICATION',
        entity_id: existing.id,
        link: `/projects/${existing.slug}`,
      });
    }

    return {
      project: this.hydrateRelations(updatedProject),
      verification: verificationRecord,
    };
  }

  public listVerifications(projectId: string): ProjectVerificationRecord[] {
    return this.projectVerifications
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- Phase 5: Community Reports Summary (Privacy Safe) ---

  public getReportsSummary(projectId: string): {
    total_reports: number;
    open_reports: number;
    resolved_reports: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    recent_public_categories: string[];
  } {
    const projectReports = this.projectReports.filter((r) => r.project_id === projectId);
    const by_type: Record<string, number> = {};
    const by_severity: Record<string, number> = {};

    let open_reports = 0;
    let resolved_reports = 0;

    projectReports.forEach((r) => {
      by_type[r.report_type] = (by_type[r.report_type] || 0) + 1;
      by_severity[r.severity] = (by_severity[r.severity] || 0) + 1;
      if (r.status === 'RESOLVED') {
        resolved_reports += 1;
      } else {
        open_reports += 1;
      }
    });

    const recent_public_categories = Array.from(new Set(projectReports.map((r) => r.report_type)));

    return {
      total_reports: projectReports.length,
      open_reports,
      resolved_reports,
      by_type,
      by_severity,
      recent_public_categories,
    };
  }

  // --- Phase 6: Citizen Issue Reporting Lifecycle ---

  public listReports(
    projectId?: string,
    options?: {
      isOfficer?: boolean;
      officerProfile?: Profile;
      userId?: string;
      status?: string;
      severity?: string;
      page?: number;
      limit?: number;
    }
  ): {
    reports: (ProjectReportRecord & { project_title?: string; region_id?: string; district_id?: string })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 10));

    let filtered = this.projectReports.map((r) => {
      const p = this.projects.find((proj) => proj.id === r.project_id);
      return {
        ...r,
        project_title: p?.title || r.project_title || 'Community Infrastructure Project',
        region_id: p?.region_id,
        district_id: p?.district_id,
      };
    });

    if (projectId) {
      filtered = filtered.filter((r) => r.project_id === projectId);
    }

    // Access control & jurisdiction filtering
    if (!options?.isOfficer) {
      // Ordinary citizen: can only see their own submitted reports
      if (options?.userId) {
        filtered = filtered.filter((r) => r.submitted_by === options.userId);
      } else {
        // Unauthenticated public: return empty list of private reports (public summary is in getReportsSummary)
        filtered = [];
      }
    } else if (options?.officerProfile) {
      const officer = options.officerProfile;
      // Officers view reports in their jurisdiction
      if (['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(officer.role)) {
        // Unrestricted view
      } else if (officer.role === 'REGIONAL_OFFICER' && officer.region_id) {
        filtered = filtered.filter((r) => r.region_id === officer.region_id);
      } else if (officer.role === 'MMDCE_OFFICER' && officer.district_id) {
        filtered = filtered.filter((r) => r.district_id === officer.district_id);
      }
    }

    if (options?.status) {
      filtered = filtered.filter((r) => r.status === options.status);
    }
    if (options?.severity) {
      filtered = filtered.filter((r) => r.severity === options.severity);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const reports = filtered.slice(offset, offset + limit);

    return { reports, total, page, limit, totalPages };
  }

  public getReportById(reportId: string): (ProjectReportRecord & { project_title?: string }) | null {
    const report = this.projectReports.find((r) => r.id === reportId);
    if (!report) return null;
    const p = this.projects.find((proj) => proj.id === report.project_id);
    return {
      ...report,
      project_title: p?.title || report.project_title,
    };
  }

  public createReport(
    projectId: string,
    input: {
      report_type: ReportType;
      severity?: ReportSeverity;
      description: string;
      location_notes?: string | null;
      evidence_url?: string | null;
      contact_phone?: string | null;
      community?: string | null;
      project_title?: string | null;
    },
    actor: Profile
  ): { report: ProjectReportRecord } {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND: Referenced project does not exist');
    }

    if (!input.description || input.description.trim().length < 10) {
      throw new Error('VALIDATION_ERROR: Description must be at least 10 characters.');
    }

    const id = `REP-${project.id.replace('PRJ-', '')}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: ProjectReportRecord = {
      id,
      project_id: projectId,
      project_title: project.title,
      submitted_by: actor.id,
      submitter_name: actor.full_name || 'Citizen Monitor',
      report_type: input.report_type,
      description: input.description.trim(),
      severity: input.severity || 'MEDIUM',
      status: 'OPEN',
      location_notes: input.location_notes || null,
      evidence_url: input.evidence_url || null,
      contact_phone: input.contact_phone || null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      resolved_by: null,
      resolver_name: null,
      resolution_notes: null,
    };

    this.projectReports.unshift(record);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'REPORT_SUBMITTED',
      entity_type: 'PROJECT_REPORT',
      entity_id: id,
      old_values: null,
      new_values: {
        project_id: projectId,
        report_type: input.report_type,
        severity: record.severity,
      },
      reason: `Citizen logged community observation: ${input.report_type}`,
    });

    return { report: record };
  }

  public resolveReport(
    reportId: string,
    input: {
      status: 'UNDER_REVIEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'REJECTED';
      resolution_notes: string;
    },
    actor: Profile
  ): { report: ProjectReportRecord } {
    const index = this.projectReports.findIndex((r) => r.id === reportId);
    if (index === -1) {
      throw new Error('REPORT_NOT_FOUND: Issue report not found');
    }

    const existing = this.projectReports[index];
    const project = this.projects.find((p) => p.id === existing.project_id);

    // Authorization & Jurisdiction checks
    if (actor.role === 'CITIZEN' || actor.role === 'COMMUNITY_OBSERVER') {
      throw new Error('FORBIDDEN: Citizens cannot resolve official community reports.');
    }

    if (actor.role === 'MMDCE_OFFICER') {
      if (!project || project.district_id !== actor.district_id) {
        throw new Error(
          `JURISDICTION_MISMATCH: MMDCE Officer assigned to district '${actor.district_id}' cannot resolve reports for district '${project?.district_id}'.`
        );
      }
    }

    if (actor.role === 'REGIONAL_OFFICER') {
      if (!project || project.region_id !== actor.region_id) {
        throw new Error(
          `JURISDICTION_MISMATCH: Regional Officer assigned to region '${actor.region_id}' cannot resolve reports for region '${project?.region_id}'.`
        );
      }
    }

    if (!input.resolution_notes || input.resolution_notes.trim().length < 5) {
      throw new Error('VALIDATION_ERROR: Resolution note must be at least 5 characters.');
    }

    const now = new Date().toISOString();
    const isCompleted = input.status === 'RESOLVED' || input.status === 'REJECTED';

    const updated: ProjectReportRecord = {
      ...existing,
      status: input.status,
      resolution_notes: input.resolution_notes.trim(),
      resolved_at: isCompleted ? now : existing.resolved_at,
      resolved_by: isCompleted ? actor.id : existing.resolved_by,
      resolver_name: `${actor.full_name} (${actor.role})`,
      updated_at: now,
    };

    this.projectReports[index] = updated;

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: isCompleted ? 'REPORT_RESOLVED' : 'REPORT_STATUS_UPDATED',
      entity_type: 'PROJECT_REPORT',
      entity_id: reportId,
      old_values: { status: existing.status },
      new_values: { status: input.status, resolution_notes: input.resolution_notes },
      reason: `Officer updated report status to ${input.status}: ${input.resolution_notes}`,
    });

    return { report: updated };
  }

  // --- Phase 6: Comments & Civic Discussion ---

  public listComments(
    projectId: string,
    options?: { page?: number; limit?: number; isModerator?: boolean }
  ): {
    comments: ProjectCommentRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 10));

    const all = this.projectComments
      .filter((c) => {
        if (c.project_id !== projectId) return false;
        if (options?.isModerator) return true;
        // Public sees only PUBLISHED comments
        return c.status === 'PUBLISHED';
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const comments = all.slice(offset, offset + limit);

    return { comments, total, page, limit, totalPages };
  }

  public createComment(
    projectId: string,
    content: string,
    actor: Profile
  ): { comment: ProjectCommentRecord } {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND: Project not found');
    }

    const trimmed = content.trim();
    if (trimmed.length < 3) {
      throw new Error('VALIDATION_ERROR: Comment must be at least 3 characters.');
    }
    if (trimmed.length > 1000) {
      throw new Error('VALIDATION_ERROR: Comment cannot exceed 1000 characters.');
    }

    // Automated Civic Decency Moderation Filter
    const abusivePatterns = ['fraudulent scam', 'criminal syndicate', 'corrupt bastard', 'steal our money'];
    const isFlagged = abusivePatterns.some((pattern) => trimmed.toLowerCase().includes(pattern));

    const id = `CMT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record: ProjectCommentRecord = {
      id,
      project_id: projectId,
      user_id: actor.id,
      user_name: actor.full_name || 'Anonymous Citizen',
      user_role: actor.role,
      content: trimmed,
      status: isFlagged ? 'FLAGGED' : 'PUBLISHED',
      flag_reason: isFlagged ? 'Automated civic decency filter: pending moderator review' : null,
      created_at: now,
      updated_at: now,
    };

    this.projectComments.unshift(record);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'COMMENT_POSTED',
      entity_type: 'PROJECT_COMMENT',
      entity_id: id,
      old_values: null,
      new_values: { project_id: projectId, status: record.status },
      reason: `User posted project comment with status ${record.status}`,
    });

    return { comment: record };
  }

  public moderateComment(
    commentId: string,
    action: 'PUBLISH' | 'FLAG' | 'REMOVE',
    actor: Profile,
    reason?: string
  ): { comment: ProjectCommentRecord } {
    const index = this.projectComments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      throw new Error('COMMENT_NOT_FOUND: Comment not found');
    }

    const existing = this.projectComments[index];
    const project = this.projects.find((p) => p.id === existing.project_id);

    const isAuthorized = ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(actor.role) ||
      (project && actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (project && actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);

    if (!isAuthorized) {
      throw new Error('FORBIDDEN: You do not have permission to moderate comments on this project.');
    }

    const newStatus = action === 'PUBLISH' ? 'PUBLISHED' : action === 'FLAG' ? 'FLAGGED' : 'REMOVED';
    const updated: ProjectCommentRecord = {
      ...existing,
      status: newStatus,
      flag_reason: reason || (action === 'PUBLISH' ? null : 'Moderated by authority'),
      updated_at: new Date().toISOString(),
    };

    this.projectComments[index] = updated;

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'COMMENT_MODERATED',
      entity_type: 'PROJECT_COMMENT',
      entity_id: commentId,
      old_values: { status: existing.status },
      new_values: { status: newStatus },
      reason: reason || `Comment status updated to ${newStatus}`,
    });

    return { comment: updated };
  }

  public deleteComment(commentId: string, actor: Profile): { success: boolean } {
    const index = this.projectComments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      throw new Error('COMMENT_NOT_FOUND: Comment not found');
    }

    const existing = this.projectComments[index];
    const canDelete = actor.role === 'SUPER_ADMIN' ||
      actor.role === 'MODERATOR' ||
      existing.user_id === actor.id;

    if (!canDelete) {
      throw new Error('FORBIDDEN: You can only delete your own comments.');
    }

    this.projectComments.splice(index, 1);

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'COMMENT_DELETED',
      entity_type: 'PROJECT_COMMENT',
      entity_id: commentId,
      old_values: { content: existing.content, user_id: existing.user_id },
      new_values: null,
      reason: 'Comment removed by user or moderator',
    });

    return { success: true };
  }

  // --- Phase 6: Civic Priority Voting & Public Urgency ---

  public getVotesSummary(projectId: string, userId?: string): {
    project_id: string;
    upvotes: number;
    downvotes: number;
    total_votes: number;
    priority_score: number;
    user_vote: 'UPVOTE' | 'DOWNVOTE' | null;
  } {
    const votes = this.projectVotes.filter((v) => v.project_id === projectId);
    const upvotes = votes.filter((v) => v.vote_type === 'UPVOTE').length;
    const downvotes = votes.filter((v) => v.vote_type === 'DOWNVOTE').length;
    const total_votes = votes.length;

    // Civic priority score: baseline 50 + upvotes * 10 - downvotes * 5
    const priority_score = Math.max(0, Math.min(100, 50 + upvotes * 10 - downvotes * 5));

    let user_vote: 'UPVOTE' | 'DOWNVOTE' | null = null;
    if (userId) {
      const userRecord = votes.find((v) => v.user_id === userId);
      if (userRecord) {
        user_vote = userRecord.vote_type;
      }
    }

    return {
      project_id: projectId,
      upvotes,
      downvotes,
      total_votes,
      priority_score,
      user_vote,
    };
  }

  public castVote(
    projectId: string,
    voteType: 'UPVOTE' | 'DOWNVOTE',
    actor: Profile
  ): {
    summary: {
      project_id: string;
      upvotes: number;
      downvotes: number;
      total_votes: number;
      priority_score: number;
      user_vote: 'UPVOTE' | 'DOWNVOTE' | null;
    };
    actionTaken: 'INSERTED' | 'UPDATED' | 'REMOVED';
  } {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND: Project not found');
    }

    const existingIndex = this.projectVotes.findIndex(
      (v) => v.project_id === projectId && v.user_id === actor.id
    );

    let actionTaken: 'INSERTED' | 'UPDATED' | 'REMOVED' = 'INSERTED';

    if (existingIndex !== -1) {
      const existing = this.projectVotes[existingIndex];
      if (existing.vote_type === voteType) {
        // Toggle off
        this.projectVotes.splice(existingIndex, 1);
        actionTaken = 'REMOVED';
      } else {
        // Change vote
        this.projectVotes[existingIndex] = {
          ...existing,
          vote_type: voteType,
        };
        actionTaken = 'UPDATED';
      }
    } else {
      const id = `VOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      this.projectVotes.push({
        id,
        project_id: projectId,
        user_id: actor.id,
        vote_type: voteType,
        created_at: new Date().toISOString(),
      });
    }

    this.addAuditLog({
      user_id: actor.id,
      user_email: actor.email,
      action: 'VOTE_CAST',
      entity_type: 'PROJECT_VOTE',
      entity_id: `${projectId}:${actor.id}`,
      old_values: null,
      new_values: { project_id: projectId, vote_type: voteType, action: actionTaken },
      reason: `User ${actionTaken} civic priority vote: ${voteType}`,
    });

    const summary = this.getVotesSummary(projectId, actor.id);
    return { summary, actionTaken };
  }

  public removeVote(
    projectId: string,
    actor: Profile
  ): {
    summary: {
      project_id: string;
      upvotes: number;
      downvotes: number;
      total_votes: number;
      priority_score: number;
      user_vote: 'UPVOTE' | 'DOWNVOTE' | null;
    };
  } {
    const existingIndex = this.projectVotes.findIndex(
      (v) => v.project_id === projectId && v.user_id === actor.id
    );

    if (existingIndex !== -1) {
      this.projectVotes.splice(existingIndex, 1);
      this.addAuditLog({
        user_id: actor.id,
        user_email: actor.email,
        action: 'VOTE_REMOVED',
        entity_type: 'PROJECT_VOTE',
        entity_id: `${projectId}:${actor.id}`,
        old_values: null,
        new_values: null,
        reason: 'User removed civic priority vote',
      });
    }

    const summary = this.getVotesSummary(projectId, actor.id);
    return { summary };
  }

  // --- Phase 5: Related Projects ---

  public getRelatedProjects(projectId: string, limit = 3): Project[] {
    const current = this.projects.find((p) => p.id === projectId);
    if (!current) return [];

    const candidates = this.projects.filter(
      (p) => p.id !== projectId && p.verification_status === 'VERIFIED'
    );

    // Score based on same district (3 pts), same category (2 pts), same region (1 pt)
    const scored = candidates.map((p) => {
      let score = 0;
      if (p.district_id === current.district_id) score += 3;
      if (p.category_id === current.category_id) score += 2;
      if (p.region_id === current.region_id) score += 1;
      return { project: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => this.hydrateRelations(s.project));
  }

  // --- Contractors ---

  public listContractors(search?: string): Contractor[] {
    if (!search) return this.contractors;
    const q = search.toLowerCase().trim();
    return this.contractors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.registration_number && c.registration_number.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q))
    );
  }

  public getContractorAccountability(id: string, options: { actor?: Profile; publicOnly?: boolean } = {}) {
    const contractor = this.getContractorById(id);
    if (!contractor) return null;

    const actor = options.actor;
    const publicOnly = options.publicOnly !== false;
    let projects = this.projects.filter((project) => project.contractor_id === id);
    if (publicOnly) {
      projects = projects.filter((project) => project.verification_status === 'VERIFIED');
    }
    if (actor?.role === 'MMDCE_OFFICER' && actor.district_id) {
      projects = projects.filter((project) => project.district_id === actor.district_id);
    } else if (actor?.role === 'REGIONAL_OFFICER' && actor.region_id) {
      projects = projects.filter((project) => project.region_id === actor.region_id);
    }

    const completed = projects.filter((project) => project.project_status === 'COMPLETED');
    const active = projects.filter((project) => ['ONGOING', 'PLANNED'].includes(project.project_status));
    const delayed = projects.filter((project) => this.isProjectDelayed(project));
    const onHold = projects.filter((project) => project.project_status === 'ON_HOLD');
    const abandoned = projects.filter((project) => project.project_status === 'ABANDONED');
    const reports = this.projectReports.filter((report) => projects.some((project) => project.id === report.project_id));
    const completedWithDates = completed.filter((project) => project.expected_completion_date && project.actual_completion_date);
    const onTime = completedWithDates.filter(
      (project) => new Date(project.actual_completion_date as string) <= new Date(project.expected_completion_date as string)
    );
    const totalBudget = projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0);
    const deliveredBudget = completed.reduce((sum, project) => sum + (Number(project.budget) || 0), 0);
    const averageActiveProgress = active.length
      ? Math.round(active.reduce((sum, project) => sum + (Number(project.progress_percentage) || 0), 0) / active.length)
      : 0;
    const resolutionRate = reports.length
      ? Math.round((reports.filter((report) => report.status === 'RESOLVED').length / reports.length) * 100)
      : null;
    const completionRate = projects.length ? Math.round((completed.length / projects.length) * 100) : 0;
    const onTimeRate = completedWithDates.length ? Math.round((onTime.length / completedWithDates.length) * 100) : null;
    const reliabilityRate = projects.length ? Math.max(0, Math.round(100 - ((abandoned.length + onHold.length * 0.5) / projects.length) * 100)) : 0;
    const regionIds = [...new Set(projects.map((project) => project.region_id))];
    const regions = regionIds.map((regionId) => ({
      id: regionId,
      name: this.regions.find((region) => region.id === regionId)?.name || regionId,
    }));
    const pillar = (key: ScorecardPillar['key'], name: string, score: number, weight: number, rationale: string, metrics: Record<string, string | number>): ScorecardPillar => ({
      key,
      name,
      score: Math.round(score),
      weight,
      weighted_score: 0,
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F',
      rationale,
      metrics,
    });
    const deliveryScore = onTimeRate === null ? completionRate : Math.round(completionRate * 0.6 + onTimeRate * 0.4);
    const pillars = {
      delivery: pillar('delivery', 'Delivery', deliveryScore, 0.4, `${completed.length} of ${projects.length} associated projects are recorded as completed${onTimeRate === null ? '' : `; ${onTimeRate}% of completed projects with both dates were on time`}.`, { completion_rate: completionRate, on_time_rate: onTimeRate ?? 'insufficient data' }),
      velocity: pillar('velocity', 'Progress', averageActiveProgress, 0.25, active.length ? `Average recorded progress across ${active.length} active projects.` : 'No active projects have progress data.', { average_active_progress: averageActiveProgress, active_projects: active.length }),
      community: pillar('community', 'Community response', resolutionRate ?? 0, 0.2, reports.length ? `${reports.filter((report) => report.status === 'RESOLVED').length} of ${reports.length} community reports are resolved.` : 'No community reports are available; this pillar is excluded from the composite indicator.', { total_reports: reports.length, resolved_reports: reports.filter((report) => report.status === 'RESOLVED').length }),
      reliability: pillar('reliability', 'Reliability', reliabilityRate, 0.15, `${abandoned.length} abandoned and ${onHold.length} on-hold projects are recorded.`, { abandoned_projects: abandoned.length, on_hold_projects: onHold.length }),
    };
    const weightedInputs = [
      { score: pillars.delivery.score, weight: 0.4 },
      { score: pillars.velocity.score, weight: 0.25 },
      { score: pillars.reliability.score, weight: 0.15 },
      ...(reports.length ? [{ score: pillars.community.score, weight: 0.2 }] : []),
    ];
    const normalizedWeight = weightedInputs.reduce((sum, item) => sum + item.weight, 0);
    for (const item of weightedInputs) {
      const target = pillars[item === weightedInputs[0] ? 'delivery' : item === weightedInputs[1] ? 'velocity' : item === weightedInputs[2] ? 'reliability' : 'community'];
      target.weighted_score = Math.round((item.score * item.weight / normalizedWeight) * 100) / 100;
    }
    const overallScore = projects.length ? Math.round(weightedInputs.reduce((sum, item) => sum + item.score * item.weight, 0) / normalizedWeight) : null;
    const dataSufficiency: DataSufficiencyLevel = projects.length === 0 ? 'INSUFFICIENT' : projects.length === 1 ? 'LOW' : projects.length <= 3 ? 'MODERATE' : 'HIGH';
    const tier: PerformanceTier = overallScore === null ? 'UNRATED' : overallScore >= 90 ? 'EXCEPTIONAL' : overallScore >= 75 ? 'RELIABLE' : overallScore >= 60 ? 'MODERATE' : overallScore >= 45 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL_ATTENTION';
    const letterGrade: ContractorScorecard['letter_grade'] = overallScore === null ? 'N/A' : overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 45 ? 'D' : 'F';
    return {
      contractor,
      projects: projects.map((project) => this.hydrateRelations(project)),
      scorecard: {
        contractor_id: id,
        contractor_name: contractor.name,
        overall_score: overallScore,
        letter_grade: letterGrade,
        tier,
        data_sufficiency: dataSufficiency,
        confidence_label: dataSufficiency === 'HIGH' ? 'High confidence' : dataSufficiency === 'MODERATE' ? 'Moderate confidence' : dataSufficiency === 'LOW' ? 'Preliminary indicator' : 'Insufficient data',
        confidence_description: `Based on ${projects.length} publicly visible project${projects.length === 1 ? '' : 's'}. Missing dates and reports are excluded rather than treated as zero.`,
        pillars,
        metrics: {
          total_projects: projects.length,
          completed_projects: completed.length,
          ongoing_projects: projects.filter((project) => project.project_status === 'ONGOING').length,
          delayed_projects: delayed.length,
          on_hold_projects: onHold.length,
          abandoned_projects: abandoned.length,
          total_capital_managed: totalBudget,
          total_capital_delivered: deliveredBudget,
          currency: projects[0]?.currency || 'GHS',
          on_time_delivery_rate: onTimeRate ?? 0,
          completion_rate: completionRate,
          average_progress_active: averageActiveProgress,
          total_community_reports: reports.length,
          resolved_community_reports: reports.filter((report) => report.status === 'RESOLVED').length,
          resolution_rate: resolutionRate ?? 0,
          critical_defects_count: reports.filter((report) => report.severity === 'CRITICAL' && report.report_type === 'POOR_WORKMANSHIP').length,
          active_regions_count: regions.length,
          active_districts_count: new Set(projects.map((project) => project.district_id)).size,
          regions_served: regions,
        },
        methodology: {
          title: 'GhanaBuild Performance Indicator',
          disclaimer: 'This is an analytical indicator, not an official government rating or procurement finding.',
          notice: 'Community reports are observations and are not treated as verified findings. Missing data is excluded from applicable metrics.',
          weights: { delivery_weight: 0.4, velocity_weight: 0.25, community_weight: 0.2, reliability_weight: 0.15 },
        },
        evaluated_at: new Date().toISOString(),
      } as ContractorScorecard,
    };
  }

  public isProjectDelayed(project: Project, now = new Date()): boolean {
    if (!project.expected_completion_date || project.project_status === 'COMPLETED' || project.project_status === 'CANCELLED') return false;
    return new Date(project.expected_completion_date) < now;
  }

  public listContractorAccountability(actor?: Profile) {
    const visible = this.contractors.filter((contractor) => contractor.status !== 'ARCHIVED');
    return visible.map((contractor) => this.getContractorAccountability(contractor.id, { actor, publicOnly: !actor })!).map((item) => ({
      ...item.contractor,
      scorecard: item.scorecard,
      projects: undefined,
      total_projects_count: item.scorecard.metrics.total_projects,
      completed_projects_count: item.scorecard.metrics.completed_projects,
      ongoing_projects_count: item.scorecard.metrics.ongoing_projects,
      delayed_projects_count: item.scorecard.metrics.delayed_projects,
      total_budget_managed: item.scorecard.metrics.total_capital_managed,
      currency: item.scorecard.metrics.currency,
    }));
  }

  public getContractorById(id: string): Contractor | null {
    return this.contractors.find((c) => c.id === id) || null;
  }

  public createContractor(
    input: Omit<Contractor, 'id' | 'created_at' | 'updated_at'>,
    author: Profile
  ): Contractor {
    const id = `CONTR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const slugBase = input.slug || input.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    let slug = slugBase || 'contractor';
    let suffix = 2;
    while (this.contractors.some((existing) => existing.slug === slug)) slug = `${slugBase}-${suffix++}`;
    if (this.contractors.some((existing) => existing.registration_number && input.registration_number && existing.registration_number.toLowerCase() === input.registration_number.toLowerCase())) {
      throw new Error('DUPLICATE_CONTRACTOR_REGISTRATION');
    }
    const contractor: Contractor = {
      ...input,
      slug,
      id,
      created_at: now,
      updated_at: now,
    };

    this.contractors.unshift(contractor);

    this.addAuditLog({
      user_id: author.id,
      user_email: author.email,
      action: 'CONTRACTOR_CREATED',
      entity_type: 'CONTRACTOR',
      entity_id: id,
      old_values: null,
      new_values: { name: contractor.name, registration_number: contractor.registration_number },
      reason: 'New contractor registration in GhanaBuild Registry',
    });

    return contractor;
  }

  public updateContractor(
    id: string,
    updates: Partial<Contractor>,
    author: Profile
  ): Contractor {
    const index = this.contractors.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('CONTRACTOR_NOT_FOUND');
    }

    const existing = this.contractors[index];
    const updated: Contractor = {
      ...existing,
      ...updates,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };

    this.contractors[index] = updated;

    this.addAuditLog({
      user_id: author.id,
      user_email: author.email,
      action: 'CONTRACTOR_UPDATED',
      entity_type: 'CONTRACTOR',
      entity_id: id,
      old_values: existing as any,
      new_values: updated as any,
      reason: 'Contractor details revised',
    });

    return updated;
  }

  // --- Phase 11: Fiscal Transparency ---

  private fiscalProject(projectId: string): Project {
    const project = this.projects.find((item) => item.id === projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    return project;
  }

  private assertFiscalScope(projectId: string, actor: Profile, mutate = false): Project {
    const project = this.fiscalProject(projectId);
    const canManage = ['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'].includes(actor.role);
    const inScope = actor.role === 'SUPER_ADMIN' || actor.role === 'NATIONAL_MONITOR' ||
      (actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id);
    if (!inScope || (mutate && !canManage)) throw new Error('FISCAL_JURISDICTION_FORBIDDEN');
    return project;
  }

  private fiscalId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  }

  private fiscalAudit(actor: Profile, action: string, entityType: string, entityId: string, values: Record<string, unknown>) {
    this.addAuditLog({ user_id: actor.id, user_email: actor.email, user_role: actor.role, action, entity_type: entityType, entity_id: entityId, old_values: null, new_values: values, reason: 'Phase 11 fiscal record lifecycle event' });
  }

  public getProjectFiscalRecords(projectId: string, actor?: Profile): ProjectFiscalRecords {
    const project = this.fiscalProject(projectId);
    if (actor) this.assertFiscalScope(projectId, actor);
    const publicView = !actor;
    if (publicView && project.verification_status !== 'VERIFIED') throw new Error('PROJECT_NOT_PUBLIC');
    const funding = this.projectFunding.filter((item) => item.project_id === projectId && (!publicView || ['APPROVED', 'ACTIVE', 'CLOSED'].includes(item.funding_status)));
    const commitments = this.projectCommitments.filter((item) => item.project_id === projectId && (!publicView || ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(item.status)));
    const tranches = this.projectTranches.filter((item) => item.project_id === projectId && (!publicView || ['APPROVED', 'PARTIALLY_DISBURSED', 'DISBURSED'].includes(item.status)));
    const disbursements = this.projectDisbursements.filter((item) => item.project_id === projectId && (!publicView || item.payment_status === 'DISBURSED'));
    const expenditures = this.projectExpenditures.filter((item) => item.project_id === projectId && (!publicView || item.verification_status === 'VERIFIED'));
    const currency = project.currency || 'GHS';
    const sameCurrency = <T extends { currency: string }>(records: T[]) => records.filter((record) => record.currency === currency);
    const allocated = sameCurrency(funding).filter((item) => item.funding_status !== 'CANCELLED').reduce((sum, item) => sum + item.allocated_amount, 0);
    const committed = sameCurrency(commitments).filter((item) => item.status !== 'CANCELLED').reduce((sum, item) => sum + item.committed_amount, 0);
    const trancheValue = sameCurrency(tranches).filter((item) => item.status !== 'CANCELLED').reduce((sum, item) => sum + item.approved_amount, 0);
    const disbursed = sameCurrency(disbursements).filter((item) => item.payment_status === 'DISBURSED').reduce((sum, item) => sum + item.amount, 0);
    const reported = sameCurrency(expenditures).reduce((sum, item) => sum + item.amount, 0);
    const verified = sameCurrency(expenditures).filter((item) => item.verification_status === 'VERIFIED').reduce((sum, item) => sum + item.amount, 0);
    const disbursementProgress = committed > 0 ? Math.min(100, Math.round((disbursed / committed) * 100)) : 0;
    const variance = allocated > 0 ? disbursementProgress - project.progress_percentage : null;
    const flags: ProjectFiscalSummary['flags'] = [];
    if (variance !== null && variance >= 20) flags.push({ code: 'HIGH_DISBURSEMENT_LOW_PROGRESS', severity: 'ATTENTION', message: `Disbursement is ${variance} percentage points above physical progress.`, threshold: 'At least 20 percentage points' });
    if (reported > verified) flags.push({ code: 'UNVERIFIED_EXPENDITURE', severity: 'ATTENTION', message: `${(reported - verified).toLocaleString()} ${currency} remains reported but unverified.`, threshold: 'Any positive unverified balance' });
    if (committed > 0 && committed - disbursed <= committed * 0.1) flags.push({ code: 'COMMITMENT_NEAR_LIMIT', severity: 'INFO', message: 'Remaining commitment is 10% or less.', threshold: 'Remaining commitment <= 10%' });
    if (disbursed > 0 && project.progress_percentage < 25) flags.push({ code: 'STALLED_PROJECT_WITH_DISBURSEMENT', severity: 'ATTENTION', message: 'Disbursement exists while physical progress remains below 25%.', threshold: 'Progress below 25%' });
    if (allocated > 0 && committed === 0) flags.push({ code: 'FUNDING_WITHOUT_COMMITMENT', severity: 'INFO', message: 'Funding is recorded without a corresponding commitment.', threshold: 'Allocation exists and commitment is zero' });
    if (committed > 0 && disbursed === 0) flags.push({ code: 'COMMITMENT_WITHOUT_DISBURSEMENT', severity: 'INFO', message: 'A commitment is recorded but no disbursement has been recorded.', threshold: 'Commitment exists and disbursement is zero' });
    const overdueTranche = tranches.some((tranche) => tranche.scheduled_disbursement_date && new Date(tranche.scheduled_disbursement_date) < new Date() && !disbursements.some((item) => item.tranche_id === tranche.id && item.payment_status === 'DISBURSED'));
    if (overdueTranche) flags.push({ code: 'OVERDUE_DISBURSEMENT', severity: 'ATTENTION', message: 'A scheduled disbursement date has passed without a recorded disbursement.', threshold: 'Scheduled date is before today and tranche is not disbursed' });
    const summary: ProjectFiscalSummary = { project_id: projectId, currency, total_allocated: allocated, total_committed: committed, total_tranche_value: trancheValue, total_disbursed: disbursed, total_reported_expenditure: reported, verified_expenditure: verified, remaining_allocation: allocated - disbursed, remaining_commitment: committed - disbursed, physical_progress: project.progress_percentage, disbursement_progress: disbursementProgress, financial_physical_variance: variance, flags };
    return { summary, funding, commitments, tranches, disbursements, expenditures };
  }

  public getFiscalAnalytics(actor?: Profile, filters: { region?: string; district?: string; community?: string; category?: string; contractor?: string; status?: ProjectStatus; fiscal_year?: number; funding_source?: string; search?: string } = {}) {
    const visibleProjects = this.projects.filter((project) => project.verification_status === 'VERIFIED').filter((project) => {
      if (!actor || actor.role === 'SUPER_ADMIN' || actor.role === 'NATIONAL_MONITOR') return true;
      if (actor.role === 'REGIONAL_OFFICER') return actor.region_id === project.region_id;
      if (actor.role === 'MMDCE_OFFICER') return actor.district_id === project.district_id;
      return false;
    }).filter((project) => !filters.region || project.region_id === filters.region)
      .filter((project) => !filters.district || project.district_id === filters.district)
      .filter((project) => !filters.community || project.community_id === filters.community)
      .filter((project) => !filters.category || project.category_id === filters.category)
      .filter((project) => !filters.contractor || project.contractor_id === filters.contractor)
      .filter((project) => !filters.status || project.project_status === filters.status)
      .filter((project) => !filters.search || project.title.toLowerCase().includes(filters.search.toLowerCase()));
    const summaries = visibleProjects.map((project) => this.getProjectFiscalRecords(project.id, actor));
    const fiscalMatches = (index: number) => filters.fiscal_year === undefined || summaries[index].funding.some((record) => record.fiscal_year === filters.fiscal_year);
    const sourceMatches = (index: number) => !filters.funding_source || summaries[index].funding.some((record) => record.funding_source === filters.funding_source);
    const scopedProjects = visibleProjects.filter((_project, index) => fiscalMatches(index) && sourceMatches(index));
    const scopedSummaries = summaries.filter((_summary, index) => fiscalMatches(index) && sourceMatches(index));
    const total = (key: keyof ProjectFiscalSummary) => scopedSummaries.reduce((sum, record) => sum + (typeof record.summary[key] === 'number' ? record.summary[key] as number : 0), 0);
    const byRegion = scopedProjects.reduce<Record<string, { region_id: string; region_name: string; allocated: number; committed: number; disbursed: number; verified_expenditure: number; project_count: number }>>((result, project, index) => {
      const region = result[project.region_id] ||= { region_id: project.region_id, region_name: this.regions.find((item) => item.id === project.region_id)?.name || project.region_id, allocated: 0, committed: 0, disbursed: 0, verified_expenditure: 0, project_count: 0 };
      region.allocated += scopedSummaries[index].summary.total_allocated; region.committed += scopedSummaries[index].summary.total_committed; region.disbursed += scopedSummaries[index].summary.total_disbursed; region.verified_expenditure += scopedSummaries[index].summary.verified_expenditure; region.project_count += 1; return result;
    }, {});
    const byDistrict = scopedProjects.reduce<Record<string, { district_id: string; district_name: string; allocated: number; committed: number; disbursed: number; verified_expenditure: number; project_count: number }>>((result, project, index) => {
      const district = result[project.district_id] ||= { district_id: project.district_id, district_name: this.districts.find((item) => item.id === project.district_id)?.name || project.district_id, allocated: 0, committed: 0, disbursed: 0, verified_expenditure: 0, project_count: 0 };
      district.allocated += scopedSummaries[index].summary.total_allocated; district.committed += scopedSummaries[index].summary.total_committed; district.disbursed += scopedSummaries[index].summary.total_disbursed; district.verified_expenditure += scopedSummaries[index].summary.verified_expenditure; district.project_count += 1; return result;
    }, {});
    const byCategory = scopedProjects.reduce<Record<string, { category_id: string; category_name: string; allocated: number; committed: number; disbursed: number; verified_expenditure: number }>>((result, project, index) => {
      const category = result[project.category_id] ||= { category_id: project.category_id, category_name: this.categories.find((item) => item.id === project.category_id)?.name || project.category_id, allocated: 0, committed: 0, disbursed: 0, verified_expenditure: 0 };
      category.allocated += scopedSummaries[index].summary.total_allocated; category.committed += scopedSummaries[index].summary.total_committed; category.disbursed += scopedSummaries[index].summary.total_disbursed; category.verified_expenditure += scopedSummaries[index].summary.verified_expenditure; return result;
    }, {});
    const byFiscalYear = scopedSummaries.reduce<Record<string, { fiscal_year: number; allocated: number; committed: number; disbursed: number; verified_expenditure: number }>>((result, record) => {
      record.funding.forEach((funding) => {
        if (funding.currency !== record.summary.currency || funding.funding_status === 'CANCELLED') return;
        const year = result[String(funding.fiscal_year)] ||= { fiscal_year: funding.fiscal_year, allocated: 0, committed: 0, disbursed: 0, verified_expenditure: 0 };
        year.allocated += funding.allocated_amount;
      });
      return result;
    }, {});
    scopedSummaries.forEach((record) => {
      const years = record.funding.map((funding) => funding.fiscal_year);
      years.forEach((fiscalYear) => {
        const year = byFiscalYear[String(fiscalYear)];
        if (year) { year.committed += record.summary.total_committed; year.disbursed += record.summary.total_disbursed; year.verified_expenditure += record.summary.verified_expenditure; }
      });
    });
    const projectRows = scopedProjects.map((project, index) => ({ project_id: project.id, title: project.title, slug: project.slug, region_name: this.regions.find((item) => item.id === project.region_id)?.name || project.region_id, district_name: this.districts.find((item) => item.id === project.district_id)?.name || project.district_id, category_name: this.categories.find((item) => item.id === project.category_id)?.name || project.category_id, project_status: project.project_status, physical_progress: project.progress_percentage, financial_progress: scopedSummaries[index].summary.disbursement_progress, financial_physical_variance: scopedSummaries[index].summary.financial_physical_variance, ...scopedSummaries[index].summary, attention_status: scopedSummaries[index].summary.flags.length ? 'ATTENTION' : 'CLEAR' }));
    const projectsWithRecords = scopedSummaries.filter((record) => record.funding.length || record.commitments.length || record.disbursements.length).length;
    return { currency: 'GHS', jurisdiction: actor ? (actor.role === 'MMDCE_OFFICER' ? actor.district_name || actor.district_id : actor.role === 'REGIONAL_OFFICER' ? actor.region_name || actor.region_id : 'Nationwide authorized scope') : 'Public verified project scope', filters, summary: { total_allocated: total('total_allocated'), total_committed: total('total_committed'), total_disbursed: total('total_disbursed'), verified_expenditure: total('verified_expenditure'), outstanding_commitment: total('remaining_commitment'), projects_with_fiscal_records: projectsWithRecords, projects_without_fiscal_records: scopedProjects.length - projectsWithRecords }, by_region: Object.values(byRegion), by_district: Object.values(byDistrict), by_category: Object.values(byCategory), by_fiscal_year: Object.values(byFiscalYear), projects: projectRows, attention_flags: scopedSummaries.flatMap((record) => record.summary.flags.map((flag) => ({ ...flag, project_id: record.summary.project_id }))) };
  }

  public createFunding(projectId: string, input: Omit<ProjectFunding, 'id' | 'project_id' | 'created_by' | 'created_at' | 'updated_at'>, actor: Profile): ProjectFunding {
    const project = this.assertFiscalScope(projectId, actor, true);
    if (input.currency !== project.currency) throw new Error('FISCAL_CURRENCY_MISMATCH');
    const record: ProjectFunding = { ...input, id: this.fiscalId('FUND'), project_id: projectId, created_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectFunding.push(record); this.fiscalAudit(actor, 'FUNDING_CREATED', 'PROJECT_FUNDING', record.id, record as unknown as Record<string, unknown>); return record;
  }

  public createCommitment(projectId: string, input: Omit<ProjectCommitment, 'id' | 'project_id' | 'created_by' | 'created_at' | 'updated_at'>, actor: Profile): ProjectCommitment {
    const project = this.assertFiscalScope(projectId, actor, true);
    if (input.currency !== project.currency) throw new Error('FISCAL_CURRENCY_MISMATCH');
    if (this.projectCommitments.some((item) => item.commitment_reference === input.commitment_reference)) throw new Error('DUPLICATE_FISCAL_REFERENCE');
    if (input.contractor_id && (!project.contractor_id || project.contractor_id !== input.contractor_id)) throw new Error('CONTRACTOR_NOT_ASSOCIATED');
    const allocated = this.getProjectFiscalRecords(projectId, actor).summary.total_allocated;
    const existing = this.getProjectFiscalRecords(projectId, actor).summary.total_committed;
    if (allocated > 0 && existing + input.committed_amount > allocated) throw new Error('COMMITMENT_EXCEEDS_ALLOCATION');
    const record: ProjectCommitment = { ...input, id: this.fiscalId('COMM'), project_id: projectId, created_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectCommitments.push(record); this.fiscalAudit(actor, 'COMMITMENT_CREATED', 'PROJECT_COMMITMENT', record.id, record as unknown as Record<string, unknown>); return record;
  }

  public createTranche(projectId: string, input: Omit<ProjectTranche, 'id' | 'project_id' | 'created_by' | 'created_at' | 'updated_at'>, actor: Profile): ProjectTranche {
    const project = this.assertFiscalScope(projectId, actor, true); const commitment = this.projectCommitments.find((item) => item.id === input.commitment_id && item.project_id === projectId);
    if (!commitment) throw new Error('COMMITMENT_NOT_FOUND');
    if (input.currency !== commitment.currency) throw new Error('FISCAL_CURRENCY_MISMATCH');
    if (this.projectTranches.some((item) => item.project_id === projectId && item.tranche_number === input.tranche_number)) throw new Error('DUPLICATE_TRANCHE_NUMBER');
    const existing = this.projectTranches.filter((item) => item.commitment_id === commitment.id && item.status !== 'CANCELLED').reduce((sum, item) => sum + item.approved_amount, 0);
    if (existing + input.approved_amount > commitment.committed_amount) throw new Error('TRANCHE_EXCEEDS_COMMITMENT');
    const record: ProjectTranche = { ...input, id: this.fiscalId('TRAN'), project_id: projectId, created_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectTranches.push(record); this.fiscalAudit(actor, 'TRANCHE_CREATED', 'PROJECT_TRANCHE', record.id, record as unknown as Record<string, unknown>); return record;
  }

  public createDisbursement(projectId: string, input: Omit<ProjectDisbursement, 'id' | 'project_id' | 'created_by' | 'created_at' | 'updated_at'>, actor: Profile): ProjectDisbursement {
    const project = this.assertFiscalScope(projectId, actor, true); const tranche = this.projectTranches.find((item) => item.id === input.tranche_id && item.project_id === projectId);
    if (!tranche) throw new Error('TRANCHE_NOT_FOUND');
    if (input.currency !== tranche.currency || input.currency !== project.currency) throw new Error('FISCAL_CURRENCY_MISMATCH');
    if (this.projectDisbursements.some((item) => item.disbursement_reference === input.disbursement_reference)) throw new Error('DUPLICATE_FISCAL_REFERENCE');
    const used = this.projectDisbursements.filter((item) => item.tranche_id === tranche.id && ['DISBURSED', 'APPROVED'].includes(item.payment_status)).reduce((sum, item) => sum + item.amount, 0);
    if (used + input.amount > tranche.approved_amount) throw new Error('DISBURSEMENT_EXCEEDS_TRANCHE');
    const record: ProjectDisbursement = { ...input, id: this.fiscalId('DISB'), project_id: projectId, created_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectDisbursements.push(record); this.fiscalAudit(actor, 'DISBURSEMENT_CREATED', 'PROJECT_DISBURSEMENT', record.id, record as unknown as Record<string, unknown>); return record;
  }

  public createExpenditure(projectId: string, input: Omit<ProjectExpenditure, 'id' | 'project_id' | 'created_by' | 'created_at' | 'updated_at' | 'verification_status'>, actor: Profile): ProjectExpenditure {
    const project = this.assertFiscalScope(projectId, actor, true); if (input.currency !== project.currency) throw new Error('FISCAL_CURRENCY_MISMATCH');
    if (this.projectExpenditures.some((item) => item.expenditure_reference === input.expenditure_reference)) throw new Error('DUPLICATE_FISCAL_REFERENCE');
    if (input.disbursement_id) {
      const disbursement = this.projectDisbursements.find((item) => item.id === input.disbursement_id && item.project_id === projectId && item.payment_status === 'DISBURSED');
      if (!disbursement || disbursement.currency !== input.currency) throw new Error('DISBURSEMENT_NOT_FOUND');
      const used = this.projectExpenditures.filter((item) => item.disbursement_id === disbursement.id && item.verification_status !== 'REJECTED').reduce((sum, item) => sum + item.amount, 0);
      if (used + input.amount > disbursement.amount) throw new Error('EXPENDITURE_EXCEEDS_DISBURSEMENT');
    }
    const record: ProjectExpenditure = { ...input, id: this.fiscalId('EXP'), project_id: projectId, verification_status: 'PENDING', created_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectExpenditures.push(record); this.fiscalAudit(actor, 'EXPENDITURE_SUBMITTED', 'PROJECT_EXPENDITURE', record.id, record as unknown as Record<string, unknown>); return record;
  }

  public verifyExpenditure(id: string, status: 'VERIFIED' | 'REJECTED', actor: Profile): ProjectExpenditure {
    const record = this.projectExpenditures.find((item) => item.id === id); if (!record) throw new Error('EXPENDITURE_NOT_FOUND'); this.assertFiscalScope(record.project_id, actor, true);
    const updated = { ...record, verification_status: status, verified_by: actor.id, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.projectExpenditures[this.projectExpenditures.indexOf(record)] = updated; this.fiscalAudit(actor, status === 'VERIFIED' ? 'EXPENDITURE_VERIFIED' : 'EXPENDITURE_REJECTED', 'PROJECT_EXPENDITURE', id, updated as unknown as Record<string, unknown>); return updated;
  }

  public reverseDisbursement(id: string, actor: Profile): ProjectDisbursement {
    const record = this.projectDisbursements.find((item) => item.id === id); if (!record) throw new Error('DISBURSEMENT_NOT_FOUND'); this.assertFiscalScope(record.project_id, actor, true);
    if (record.payment_status === 'REVERSED' || record.payment_status === 'CANCELLED') throw new Error('DISBURSEMENT_ALREADY_CLOSED');
    const updated = { ...record, payment_status: 'REVERSED' as FiscalPaymentStatus, updated_at: new Date().toISOString() }; this.projectDisbursements[this.projectDisbursements.indexOf(record)] = updated; this.fiscalAudit(actor, 'DISBURSEMENT_REVERSED', 'PROJECT_DISBURSEMENT', id, { previous_status: record.payment_status, new_status: 'REVERSED', amount: record.amount }); return updated;
  }

  // --- Phase 12: Offline Field Inspections ---

  private inspectionRoles = ['COMMUNITY_OBSERVER', 'MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];

  private inspectionScope(projectId: string, actor: Profile): Project {
    const project = this.fiscalProject(projectId);
    const allowed = actor.role === 'SUPER_ADMIN' || actor.role === 'NATIONAL_MONITOR' ||
      (actor.role === 'REGIONAL_OFFICER' && actor.region_id === project.region_id) ||
      (actor.role === 'MMDCE_OFFICER' && actor.district_id === project.district_id) ||
      actor.role === 'COMMUNITY_OBSERVER' && actor.district_id === project.district_id;
    if (!this.inspectionRoles.includes(actor.role) || !allowed) throw new Error('INSPECTION_JURISDICTION_FORBIDDEN');
    return project;
  }

  private distanceMeters(latitude: number, longitude: number, project: Project): number {
    const earthRadius = 6371000;
    const lat1 = latitude * Math.PI / 180;
    const lat2 = project.latitude * Math.PI / 180;
    const deltaLat = (project.latitude - latitude) * Math.PI / 180;
    const deltaLon = (project.longitude - longitude) * Math.PI / 180;
    const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
  }

  public createFieldInspection(projectId: string, input: Omit<FieldInspection, 'id' | 'project_id' | 'inspector_id' | 'sync_status' | 'verification_status' | 'server_received_at' | 'reviewed_by' | 'reviewed_at' | 'review_notes' | 'distance_from_project_meters' | 'created_at' | 'updated_at'>, actor: Profile): { inspection: FieldInspection; duplicate: boolean } {
    const project = this.inspectionScope(projectId, actor);
    const duplicate = this.fieldInspections.find((inspection) => inspection.inspector_id === actor.id && inspection.client_id === input.client_id);
    if (duplicate) return { inspection: duplicate, duplicate: true };
    const deviceTime = new Date(input.device_timestamp).getTime();
    if (deviceTime > Date.now() + 86400000) throw new Error('INSPECTION_TIMESTAMP_INVALID');
    const distance = input.latitude !== null && input.longitude !== null && input.latitude !== undefined && input.longitude !== undefined ? this.distanceMeters(input.latitude, input.longitude, project) : null;
    const now = new Date().toISOString();
    const inspection: FieldInspection = { ...input, id: this.fiscalId('INSP'), project_id: projectId, inspector_id: actor.id, sync_status: 'SYNCED', verification_status: 'PENDING', server_received_at: now, distance_from_project_meters: distance, created_at: now, updated_at: now };
    this.fieldInspections.push(inspection);
    this.addAuditLog({ user_id: actor.id, user_email: actor.email, user_role: actor.role, action: 'FIELD_INSPECTION_SYNCED', entity_type: 'FIELD_INSPECTION', entity_id: inspection.id, old_values: null, new_values: { project_id: projectId, client_id: input.client_id, inspection_type: input.inspection_type }, reason: 'Offline field inspection synchronized' });
    return { inspection, duplicate: false };
  }

  public listFieldInspections(options: { projectId?: string; actor?: Profile; publicOnly?: boolean; verificationStatus?: string } = {}): FieldInspection[] {
    let records = [...this.fieldInspections];
    if (options.projectId) records = records.filter((record) => record.project_id === options.projectId);
    if (options.actor) records = records.filter((record) => {
      try { this.inspectionScope(record.project_id, options.actor!); return true; } catch { return false; }
    });
    if (options.publicOnly) records = records.filter((record) => record.verification_status === 'VERIFIED' && this.fiscalProject(record.project_id).verification_status === 'VERIFIED');
    if (options.verificationStatus) records = records.filter((record) => record.verification_status === options.verificationStatus);
    return records.sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
  }

  public getPublicInspectionSummaries(projectId: string): InspectionPublicSummary[] {
    return this.listFieldInspections({ projectId, publicOnly: true }).map((inspection) => ({ id: inspection.id, project_id: inspection.project_id, inspection_date: inspection.inspection_date, inspection_type: inspection.inspection_type, observed_status: inspection.observed_status, observed_progress_percentage: inspection.observed_progress_percentage, observations: inspection.observations, verification_status: 'VERIFIED', captured_at: inspection.captured_at, evidence_count: this.projectEvidence.filter((evidence) => evidence.inspection_id === inspection.id).length }));
  }

  public reviewFieldInspection(id: string, status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW', notes: string | null, actor: Profile): FieldInspection {
    const inspection = this.fieldInspections.find((record) => record.id === id);
    if (!inspection) throw new Error('INSPECTION_NOT_FOUND');
    this.inspectionScope(inspection.project_id, actor);
    if (!['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'].includes(actor.role)) throw new Error('INSPECTION_REVIEW_FORBIDDEN');
    const updated = { ...inspection, verification_status: status, reviewed_by: actor.id, reviewed_at: new Date().toISOString(), review_notes: notes, updated_at: new Date().toISOString() };
    this.fieldInspections[this.fieldInspections.indexOf(inspection)] = updated;
    this.addAuditLog({ user_id: actor.id, user_email: actor.email, user_role: actor.role, action: status === 'VERIFIED' ? 'FIELD_INSPECTION_VERIFIED' : status === 'REJECTED' ? 'FIELD_INSPECTION_REJECTED' : 'FIELD_INSPECTION_REVIEWED', entity_type: 'FIELD_INSPECTION', entity_id: id, old_values: { verification_status: inspection.verification_status }, new_values: { verification_status: status }, reason: notes || 'Field inspection review' });
    return updated;
  }

  // --- Audit Logs (Immutable) ---

  public addAuditLog(log: Omit<AuditLogRecord, 'id' | 'created_at'>): AuditLogRecord {
    const id = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const record: AuditLogRecord = {
      ...log,
      id,
      created_at: new Date().toISOString(),
    };

    // Append to immutable log
    this.auditLogs.unshift(record);
    return record;
  }

  public getAuditLogs(options?: { entityId?: string; entityType?: string; limit?: number }): AuditLogRecord[] {
    let logs = [...this.auditLogs];
    if (options?.entityId) {
      logs = logs.filter((l) => l.entity_id === options.entityId);
    }
    if (options?.entityType) {
      logs = logs.filter((l) => l.entity_type === options.entityType);
    }
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }
    return logs;
  }

  public listAllAuditLogs(options?: {
    entity_type?: string;
    action?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): {
    logs: AuditLogRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));

    let filtered = [...this.auditLogs];

    if (options?.entity_type) {
      filtered = filtered.filter((l) => l.entity_type === options.entity_type);
    }

    if (options?.action) {
      filtered = filtered.filter((l) => l.action.includes(options.action!));
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity_id.toLowerCase().includes(q) ||
          (l.user_email && l.user_email.toLowerCase().includes(q)) ||
          (l.reason && l.reason.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const logs = filtered.slice(start, start + limit);

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // --- Phase 7: Evidence Moderation Queue ---

  public listAllEvidence(options?: {
    status?: string;
    evidence_type?: string;
    search?: string;
    region_id?: string;
    district_id?: string;
    page?: number;
    limit?: number;
    actor?: Profile;
  }): {
    evidence: (ProjectEvidenceRecord & { project_title?: string; region_id?: string; district_id?: string })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 12));

    let enriched = this.projectEvidence.map((ev) => {
      const p = this.projects.find((proj) => proj.id === ev.project_id);
      return {
        ...ev,
        project_title: p?.title || 'Unknown Project',
        region_id: p?.region_id,
        district_id: p?.district_id,
      };
    });

    // Jurisdiction filtering for officers
    if (options?.actor) {
      const actor = options.actor;
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        enriched = enriched.filter((ev) => ev.district_id === actor.district_id);
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        enriched = enriched.filter((ev) => ev.region_id === actor.region_id);
      }
    }

    if (options?.region_id) {
      enriched = enriched.filter((ev) => ev.region_id === options.region_id);
    }
    if (options?.district_id) {
      enriched = enriched.filter((ev) => ev.district_id === options.district_id);
    }

    if (options?.status) {
      enriched = enriched.filter((ev) => ev.verification_status === options.status);
    }

    if (options?.evidence_type) {
      enriched = enriched.filter((ev) => ev.evidence_type === options.evidence_type);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      enriched = enriched.filter(
        (ev) =>
          (ev.caption && ev.caption.toLowerCase().includes(q)) ||
          (ev.uploader_name && ev.uploader_name.toLowerCase().includes(q)) ||
          (ev.project_title && ev.project_title.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = enriched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const evidence = enriched.slice(start, start + limit);

    return {
      evidence,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // --- Phase 7: Comment Moderation Queue ---

  public listAllComments(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    actor?: Profile;
  }): {
    comments: (ProjectCommentRecord & { project_title?: string; region_id?: string; district_id?: string })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 15));

    let enriched = this.projectComments.map((c) => {
      const p = this.projects.find((proj) => proj.id === c.project_id);
      return {
        ...c,
        project_title: p?.title || 'Unknown Project',
        region_id: p?.region_id,
        district_id: p?.district_id,
      };
    });

    if (options?.actor) {
      const actor = options.actor;
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        enriched = enriched.filter((c) => c.district_id === actor.district_id);
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        enriched = enriched.filter((c) => c.region_id === actor.region_id);
      }
    }

    if (options?.status) {
      enriched = enriched.filter((c) => c.status === options.status);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      enriched = enriched.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.user_name.toLowerCase().includes(q) ||
          (c.project_title && c.project_title.toLowerCase().includes(q))
      );
    }

    enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = enriched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const comments = enriched.slice(start, start + limit);

    return {
      comments,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // --- Phase 7: Real-time Admin Metrics Dashboard ---

  public getAdminMetrics(actor?: Profile): AdminMetricsData {
    let scopedProjects = [...this.projects];
    let jurisdictionLabel = 'Nationwide Scope (National Oversight)';

    if (actor) {
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        scopedProjects = scopedProjects.filter((p) => p.district_id === actor.district_id);
        jurisdictionLabel = `District Authority: ${actor.district_id}`;
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        scopedProjects = scopedProjects.filter((p) => p.region_id === actor.region_id);
        jurisdictionLabel = `Regional Authority: ${actor.region_id}`;
      } else if (actor.role === 'SUPER_ADMIN') {
        jurisdictionLabel = 'Universal Administrator (Full Access)';
      }
    }

    const scopedProjectIds = new Set(scopedProjects.map((p) => p.id));

    // Project breakdown
    const projects = {
      total: scopedProjects.length,
      verified: scopedProjects.filter((p) => p.verification_status === 'VERIFIED').length,
      pending: scopedProjects.filter((p) => p.verification_status === 'PENDING').length,
      under_review: scopedProjects.filter((p) => p.verification_status === 'UNDER_REVIEW').length,
      rejected: scopedProjects.filter((p) => p.verification_status === 'REJECTED').length,
      request_changes: scopedProjects.filter((p) => p.verification_status === 'REQUEST_CHANGES').length,
    };

    // Reports breakdown
    const scopedReports = this.projectReports.filter((r) => scopedProjectIds.has(r.project_id));
    const reports = {
      total: scopedReports.length,
      open: scopedReports.filter((r) => r.status === 'OPEN').length,
      under_review: scopedReports.filter((r) => r.status === 'UNDER_REVIEW').length,
      acknowledged: scopedReports.filter((r) => r.status === 'ACKNOWLEDGED').length,
      resolved: scopedReports.filter((r) => r.status === 'RESOLVED').length,
      rejected: scopedReports.filter((r) => r.status === 'REJECTED').length,
      critical_or_high: scopedReports.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH').length,
    };

    // Evidence breakdown
    const scopedEvidence = this.projectEvidence.filter((e) => scopedProjectIds.has(e.project_id));
    const evidence = {
      total: scopedEvidence.length,
      verified: scopedEvidence.filter((e) => e.verification_status === 'VERIFIED').length,
      pending: scopedEvidence.filter((e) => e.verification_status === 'PENDING').length,
      rejected: scopedEvidence.filter((e) => e.verification_status === 'REJECTED').length,
    };

    // Comments breakdown
    const scopedComments = this.projectComments.filter((c) => scopedProjectIds.has(c.project_id));
    const comments = {
      total: scopedComments.length,
      published: scopedComments.filter((c) => c.status === 'PUBLISHED').length,
      flagged: scopedComments.filter((c) => c.status === 'FLAGGED').length,
      removed: scopedComments.filter((c) => c.status === 'REMOVED').length,
    };

    // Civic votes total
    const civic_votes_total = this.projectVotes.filter((v) => scopedProjectIds.has(v.project_id)).length;

    // Recent audits
    const recent_audits = this.auditLogs.slice(0, 10).map((l) => ({
      id: l.id,
      action: l.action,
      user_email: l.user_email,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      created_at: l.created_at,
      reason: l.reason,
    }));

    return {
      projects,
      reports,
      evidence,
      comments,
      civic_votes_total,
      recent_audits,
      jurisdiction_scope: {
        role: actor?.role || 'OFFICER',
        region_id: actor?.region_id || null,
        district_id: actor?.district_id || null,
        label: jurisdictionLabel,
      },
    };
  }

  // --- Phase 7: System Notifications ---

  public createNotification(input: {
    user_id: string;
    title: string;
    message: string;
    type: 'VERIFICATION' | 'REPORT' | 'COMMENT' | 'EVIDENCE' | 'SYSTEM';
    entity_id?: string | null;
    link?: string | null;
  }): SystemNotification {
    const record: SystemNotification = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type,
      entity_id: input.entity_id || null,
      link: input.link || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    this.notifications.unshift(record);
    return record;
  }

  public listNotifications(userId: string): SystemNotification[] {
    return this.notifications.filter((n) => n.user_id === userId || n.user_id === 'all');
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.notifications.find((n) => n.id === id && (n.user_id === userId || n.user_id === 'all'));
    if (!notif) return false;
    notif.is_read = true;
    return true;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    this.notifications
      .filter((n) => n.user_id === userId || n.user_id === 'all')
      .forEach((n) => (n.is_read = true));
    return true;
  }

  // --- Phase 8: User Management, Operational Analytics, System Settings & Data Export ---

  private enrichUserProfile(user: Profile): Profile {
    const region = this.regions.find((r) => r.id === user.region_id);
    const district = this.districts.find((d) => d.id === user.district_id);
    return {
      ...user,
      region_name: region ? region.name : null,
      district_name: district ? district.name : null,
    };
  }

  public listUsers(filters: {
    search?: string;
    role?: UserRole;
    region_id?: string;
    district_id?: string;
    status?: string;
    page?: number;
    limit?: number;
    actor?: Profile;
  } = {}): { users: Profile[]; total: number; page: number; limit: number; totalPages: number } {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));

    let filtered = [...this.users];

    // Search query across name, email, role, organization
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter((u) => {
        const nameMatch = u.full_name.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const roleMatch = u.role.toLowerCase().includes(q);
        const orgMatch = u.organization ? u.organization.toLowerCase().includes(q) : false;
        return nameMatch || emailMatch || roleMatch || orgMatch;
      });
    }

    if (filters.role) {
      filtered = filtered.filter((u) => u.role === filters.role);
    }

    if (filters.region_id) {
      filtered = filtered.filter((u) => u.region_id === filters.region_id);
    }

    if (filters.district_id) {
      filtered = filtered.filter((u) => u.district_id === filters.district_id);
    }

    if (filters.status) {
      if (filters.status === 'ACTIVE') {
        filtered = filtered.filter((u) => u.account_status === 'ACTIVE');
      } else if (filters.status === 'SUSPENDED') {
        filtered = filtered.filter((u) => u.account_status === 'SUSPENDED');
      } else if (filters.status === 'DISABLED') {
        filtered = filtered.filter((u) => u.account_status === 'DISABLED');
      }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      users: paginated.map((u) => this.enrichUserProfile(u)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getUserById(id: string): Profile | null {
    const user = this.users.find((u) => u.id === id || u.auth_user_id === id);
    return user ? this.enrichUserProfile(user) : null;
  }

  public getUserByEmail(email: string): Profile | null {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? this.enrichUserProfile(user) : null;
  }

  public getUserByRole(role: UserRole): Profile | null {
    const user = this.users.find((u) => u.role === role);
    return user ? this.enrichUserProfile(user) : null;
  }

  public getUserBySimulatedToken(token: string): Profile | null {
    if (!token.startsWith('simulated-')) return null;
    const roleKey = token.replace('simulated-', '').replace('-token', '').toUpperCase();
    const matching = this.users.find((u) => u.role.toUpperCase() === roleKey);
    return matching ? this.enrichUserProfile(matching) : null;
  }

  public assignUserRole(
    targetUserId: string,
    updates: {
      role: UserRole;
      region_id?: string | null;
      district_id?: string | null;
      organization?: string | null;
      reason: string;
    },
    actor: Profile
  ): Profile {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_REQUIRED: Only Super Administrators can assign roles or jurisdictions.');
    }

    if (actor.id === targetUserId || actor.auth_user_id === targetUserId) {
      throw new Error('SELF_ESCALATION_BLOCKED: Users cannot modify their own role or jurisdiction. Contact another Super Administrator.');
    }

    const user = this.users.find((u) => u.id === targetUserId);
    if (!user) {
      throw new Error('USER_NOT_FOUND: Target user does not exist.');
    }

    // Enforce jurisdiction rules on role
    if (updates.role === 'MMDCE_OFFICER' && !updates.district_id) {
      throw new Error('MISSING_JURISDICTION: MMDCE Officers must be assigned to a specific District Assembly (MMDA).');
    }

    if (updates.role === 'REGIONAL_OFFICER' && !updates.region_id) {
      throw new Error('MISSING_JURISDICTION: Regional Officers must be assigned to an Administrative Region.');
    }

    const oldValues = {
      role: user.role,
      region_id: user.region_id,
      district_id: user.district_id,
      organization: user.organization,
    };

    user.role = updates.role;
    user.region_id = updates.region_id || null;
    user.district_id = updates.district_id || null;
    user.organization = updates.organization !== undefined ? updates.organization : user.organization;
    user.updated_at = new Date().toISOString();

    // Record immutable audit log
    this.auditLogs.unshift({
      id: `AUD-ROLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'ROLE_ASSIGNED',
      entity_type: 'USER',
      entity_id: targetUserId,
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      old_values: oldValues,
      new_values: {
        role: updates.role,
        region_id: updates.region_id || null,
        district_id: updates.district_id || null,
        organization: updates.organization || null,
      },
      reason: updates.reason,
      created_at: new Date().toISOString(),
    });

    // Notify target user
    this.createNotification({
      user_id: targetUserId,
      title: 'Administrative Role Assigned',
      message: `Your account role has been updated to ${updates.role}. Assigned jurisdiction: ${updates.district_id || updates.region_id || 'National'}.`,
      type: 'SYSTEM',
      entity_id: targetUserId,
    });

    return this.enrichUserProfile(user);
  }

  public updateUserStatus(
    targetUserId: string,
    status: AccountStatus,
    reason: string,
    actor: Profile
  ): Profile {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_REQUIRED: Only Super Administrators can modify account status.');
    }

    if (actor.id === targetUserId || actor.auth_user_id === targetUserId) {
      throw new Error('SELF_STATUS_MODIFICATION_BLOCKED: Super Administrators cannot suspend or deactivate their own account.');
    }

    const user = this.users.find((u) => u.id === targetUserId);
    if (!user) {
      throw new Error('USER_NOT_FOUND: Target user does not exist.');
    }

    const oldStatus = user.account_status || (user.is_active ? 'ACTIVE' : 'DISABLED');
    const oldActive = user.is_active;

    user.account_status = status;
    user.is_active = status === 'ACTIVE';
    user.updated_at = new Date().toISOString();

    // Record immutable audit log
    this.auditLogs.unshift({
      id: `AUD-STATUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'USER_STATUS_UPDATED',
      entity_type: 'USER',
      entity_id: targetUserId,
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      old_values: { account_status: oldStatus, is_active: oldActive },
      new_values: { account_status: status, is_active: user.is_active },
      reason,
      created_at: new Date().toISOString(),
    });

    // Notify user
    this.createNotification({
      user_id: targetUserId,
      title: `Account Status Updated: ${status}`,
      message: `Your account status was changed to ${status}. Reason: ${reason}`,
      type: 'SYSTEM',
      entity_id: targetUserId,
    });

    return this.enrichUserProfile(user);
  }

  public createUser(
    input: {
      full_name: string;
      email: string;
      phone?: string;
      role: UserRole;
      region_id?: string | null;
      district_id?: string | null;
      organization?: string | null;
      reason: string;
    },
    actor: Profile
  ): Profile {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_REQUIRED: Only Super Administrators can provision user accounts.');
    }

    if (this.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('USER_ALREADY_EXISTS: An account with this email address already exists.');
    }

    const newId = `usr-gen-${Date.now().toString(36)}`;
    const newUser: Profile = {
      id: newId,
      auth_user_id: `auth-${newId}`,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      region_id: input.region_id || null,
      district_id: input.district_id || null,
      organization: input.organization || null,
      is_active: true,
      account_status: 'ACTIVE',
      last_active_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.push(newUser);

    // Record immutable audit log
    this.auditLogs.unshift({
      id: `AUD-NEWUSER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: newId,
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      old_values: null,
      new_values: {
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        region_id: newUser.region_id,
        district_id: newUser.district_id,
      },
      reason: input.reason,
      created_at: new Date().toISOString(),
    });

    return this.enrichUserProfile(newUser);
  }

  // --- System Settings Management ---

  public getSystemSettings(_actor?: Profile): SystemSettings {
    return { ...this.systemSettings };
  }

  public updateSystemSettings(
    updates: Partial<SystemSettings>,
    reason: string,
    actor: Profile
  ): SystemSettings {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_REQUIRED: Only Super Administrators can modify system configuration.');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('VALIDATION_ERROR: A valid justification reason (at least 5 characters) is required for system configuration changes.');
    }

    const oldValues = { ...this.systemSettings };

    // Bounds checking
    if (updates.default_page_size !== undefined) {
      if (updates.default_page_size < 5 || updates.default_page_size > 100) {
        throw new Error('VALIDATION_ERROR: Default page size must be between 5 and 100.');
      }
      this.systemSettings.default_page_size = updates.default_page_size;
    }

    if (updates.evidence_upload_max_mb !== undefined) {
      if (updates.evidence_upload_max_mb < 1 || updates.evidence_upload_max_mb > 100) {
        throw new Error('VALIDATION_ERROR: Upload max limit must be between 1 MB and 100 MB.');
      }
      this.systemSettings.evidence_upload_max_mb = updates.evidence_upload_max_mb;
    }

    if (updates.platform_name !== undefined && updates.platform_name.trim()) {
      this.systemSettings.platform_name = updates.platform_name.trim();
    }

    if (updates.public_submissions_enabled !== undefined) {
      this.systemSettings.public_submissions_enabled = Boolean(updates.public_submissions_enabled);
    }

    if (updates.community_reporting_enabled !== undefined) {
      this.systemSettings.community_reporting_enabled = Boolean(updates.community_reporting_enabled);
    }

    if (updates.civic_comments_enabled !== undefined) {
      this.systemSettings.civic_comments_enabled = Boolean(updates.civic_comments_enabled);
    }

    if (updates.maintenance_mode !== undefined) {
      this.systemSettings.maintenance_mode = Boolean(updates.maintenance_mode);
    }

    if (updates.require_report_phone !== undefined) {
      this.systemSettings.require_report_phone = Boolean(updates.require_report_phone);
    }

    if (updates.audit_retention_years !== undefined) {
      this.systemSettings.audit_retention_years = Math.max(1, updates.audit_retention_years);
    }

    this.systemSettings.updated_at = new Date().toISOString();
    this.systemSettings.updated_by = actor.id;

    // Record immutable audit log
    this.auditLogs.unshift({
      id: `AUD-SETTINGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entity_type: 'SYSTEM',
      entity_id: 'SYSTEM_CONFIG',
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      old_values: oldValues,
      new_values: { ...this.systemSettings },
      reason,
      created_at: new Date().toISOString(),
    });

    return { ...this.systemSettings };
  }

  // --- Operational Analytics Engine ---

  public getOperationalAnalytics(options: {
    range?: '7d' | '30d' | '90d' | 'year' | 'all';
    actor?: Profile;
  } = {}): OperationalAnalyticsData {
    const timeRange = options.range || 'all';
    const actor = options.actor;

    // 1. Jurisdiction Scoping
    let scopedProjects = [...this.projects];
    let scopedReports = [...this.projectReports];
    let scopedEvidence = [...this.projectEvidence];
    let jurisdictionLabel = 'National Oversight (All 16 Regions)';

    if (actor) {
      if (actor.role === 'MMDCE_OFFICER') {
        const district = this.districts.find((d) => d.id === actor.district_id);
        jurisdictionLabel = `MMDA Jurisdiction: ${district ? district.name : actor.district_id || 'Assigned District'}`;
        scopedProjects = scopedProjects.filter((p) => p.district_id === actor.district_id);
        const projectIds = new Set(scopedProjects.map((p) => p.id));
        scopedReports = scopedReports.filter((r) => projectIds.has(r.project_id));
        scopedEvidence = scopedEvidence.filter((e) => projectIds.has(e.project_id));
      } else if (actor.role === 'REGIONAL_OFFICER') {
        const region = this.regions.find((r) => r.id === actor.region_id);
        jurisdictionLabel = `Regional Oversight: ${region ? region.name : actor.region_id || 'Assigned Region'}`;
        scopedProjects = scopedProjects.filter((p) => p.region_id === actor.region_id);
        const projectIds = new Set(scopedProjects.map((p) => p.id));
        scopedReports = scopedReports.filter((r) => projectIds.has(r.project_id));
        scopedEvidence = scopedEvidence.filter((e) => projectIds.has(e.project_id));
      }
    }

    // 2. Time Range Filtering
    if (timeRange !== 'all') {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        '7d': now - 7 * 86400000,
        '30d': now - 30 * 86400000,
        '90d': now - 90 * 86400000,
        year: now - 365 * 86400000,
      };
      const cutoff = cutoffMap[timeRange] || 0;
      scopedProjects = scopedProjects.filter((p) => new Date(p.created_at).getTime() >= cutoff);
      scopedReports = scopedReports.filter((r) => new Date(r.created_at).getTime() >= cutoff);
      scopedEvidence = scopedEvidence.filter((e) => new Date(e.created_at).getTime() >= cutoff);
    }

    // 3. Summaries & Aggregations
    const totalProjects = scopedProjects.length;
    const totalBudget = scopedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgProgress = totalProjects > 0
      ? Math.round(scopedProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalProjects)
      : 0;

    const normalizeStatus = (p: any): string => {
      const st = (p.project_status || p.status || '').toUpperCase();
      if (st === 'IN_PROGRESS') return 'ONGOING';
      if (st === 'ON_HOLD') return 'SUSPENDED';
      return st || 'ONGOING';
    };

    const completedCount = scopedProjects.filter((p) => normalizeStatus(p) === 'COMPLETED').length;
    const ongoingCount = scopedProjects.filter((p) => normalizeStatus(p) === 'ONGOING').length;
    const abandonedOrSuspended = scopedProjects.filter(
      (p) => ['ABANDONED', 'SUSPENDED', 'ON_HOLD'].includes(normalizeStatus(p))
    ).length;
    const criticalReportsCount = scopedReports.filter(
      (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
    ).length;

    const verifiedEvidenceCount = scopedEvidence.filter((e) => e.verification_status === 'VERIFIED').length;
    const evidenceRate = scopedEvidence.length > 0
      ? Math.round((verifiedEvidenceCount / scopedEvidence.length) * 100)
      : 100;

    // Projects by Region
    const regionStatsMap: Record<string, { count: number; budget: number; progressSum: number }> = {};
    for (const p of scopedProjects) {
      if (!regionStatsMap[p.region_id]) {
        regionStatsMap[p.region_id] = { count: 0, budget: 0, progressSum: 0 };
      }
      regionStatsMap[p.region_id].count++;
      regionStatsMap[p.region_id].budget += p.budget || 0;
      regionStatsMap[p.region_id].progressSum += p.progress_percentage || 0;
    }

    const projectsByRegion = this.regions
      .map((r) => {
        const stats = regionStatsMap[r.id] || { count: 0, budget: 0, progressSum: 0 };
        return {
          region_id: r.id,
          region_name: r.name,
          count: stats.count,
          total_budget: stats.budget,
          average_progress: stats.count > 0 ? Math.round(stats.progressSum / stats.count) : 0,
        };
      })
      .filter((r) => (actor?.role === 'MMDCE_OFFICER' || actor?.role === 'REGIONAL_OFFICER' ? r.count > 0 : true));

    // Projects by Category
    const catStatsMap: Record<string, { count: number; budget: number }> = {};
    for (const p of scopedProjects) {
      if (!catStatsMap[p.category_id]) {
        catStatsMap[p.category_id] = { count: 0, budget: 0 };
      }
      catStatsMap[p.category_id].count++;
      catStatsMap[p.category_id].budget += p.budget || 0;
    }

    const projectsByCategory = this.categories.map((c) => {
      const stats = catStatsMap[c.id] || { count: 0, budget: 0 };
      return {
        category_id: c.id,
        category_name: c.name,
        count: stats.count,
        total_budget: stats.budget,
      };
    }).filter((c) => c.count > 0);

    // Projects by Status
    const statusKeys: ProjectStatus[] = ['PLANNED', 'ONGOING', 'COMPLETED', 'ON_HOLD', 'ABANDONED'];
    const projectsByStatus = statusKeys.map((st) => {
      const cnt = scopedProjects.filter((p) => normalizeStatus(p) === st).length;
      return {
        status: st,
        count: cnt,
        percentage: totalProjects > 0 ? Math.round((cnt / totalProjects) * 100) : 0,
      };
    });

    // Projects by Verification Status
    const verifKeys: VerificationStatus[] = ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REQUEST_CHANGES', 'REJECTED'];
    const projectsByVerificationStatus = verifKeys.map((st) => {
      const cnt = scopedProjects.filter((p) => p.verification_status === st).length;
      return {
        status: st,
        count: cnt,
        percentage: totalProjects > 0 ? Math.round((cnt / totalProjects) * 100) : 0,
      };
    });

    // Reports by Severity
    const severityKeys: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const reportsBySeverity = severityKeys.map((sev) => ({
      severity: sev,
      count: scopedReports.filter((r) => r.severity === sev).length,
    }));

    // Reports by Status
    const reportStatusKeys: ReportStatus[] = ['OPEN', 'UNDER_REVIEW', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED'];
    const reportsByStatus = reportStatusKeys.map((st) => ({
      status: st,
      count: scopedReports.filter((r) => r.status === st).length,
    }));

    // Evidence by Status
    const evidenceStatusKeys: ('PENDING' | 'VERIFIED' | 'REJECTED')[] = ['PENDING', 'VERIFIED', 'REJECTED'];
    const evidenceByStatus = evidenceStatusKeys.map((st) => ({
      status: st,
      count: scopedEvidence.filter((e) => e.verification_status === st).length,
    }));

    // Timeline Trends (last 6 monthly buckets)
    const timeline = [
      { period: '2024-01', submissions: 3, verifications: 2 },
      { period: '2024-02', submissions: 4, verifications: 3 },
      { period: '2024-03', submissions: 2, verifications: 2 },
      { period: '2024-04', submissions: 5, verifications: 4 },
      { period: '2024-05', submissions: 3, verifications: 3 },
      { period: '2024-06', submissions: scopedProjects.length, verifications: scopedProjects.filter((p) => p.verification_status === 'VERIFIED').length },
    ];

    // Progress distribution (0-25%, 26-50%, 51-75%, 76-99%, 100%)
    const progressRanges = [
      { range: '0-25%' as const, min: 0, max: 25 },
      { range: '26-50%' as const, min: 26, max: 50 },
      { range: '51-75%' as const, min: 51, max: 75 },
      { range: '76-99%' as const, min: 76, max: 99 },
      { range: '100%' as const, min: 100, max: 100 },
    ];
    const progressDistribution = progressRanges.map((pr) => {
      const count = scopedProjects.filter((p) => {
        const prog = p.progress_percentage || 0;
        return prog >= pr.min && prog <= pr.max;
      }).length;
      return {
        range: pr.range,
        count,
        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
      };
    });

    // Budget Metrics
    const avgBudget = totalProjects > 0 ? Math.round(totalBudget / totalProjects) : 0;
    const budgetByStatus = statusKeys.map((st) => ({
      status: st,
      total_budget: scopedProjects
        .filter((p) => normalizeStatus(p) === st)
        .reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    }));

    // Projects Requiring Operational Attention
    const projectsRequiringAttention: Array<{
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
    }> = [];

    for (const p of scopedProjects) {
      const reg = this.regions.find((r) => r.id === p.region_id);
      const dist = this.districts.find((d) => d.id === p.district_id);
      const pReports = scopedReports.filter((r) => r.project_id === p.id);
      const critReports = pReports.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH');
      const normSt = normalizeStatus(p);

      if (critReports.length > 0) {
        projectsRequiringAttention.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          region_name: reg?.name || 'Ghana',
          district_name: dist?.name || 'District',
          status: p.project_status,
          progress: p.progress_percentage || 0,
          reason: `${critReports.length} urgent citizen complaint(s) regarding structural defects or site hazards`,
          severity: 'CRITICAL',
          flag_type: 'CRITICAL_REPORTS',
          reports_count: pReports.length,
          updated_at: p.updated_at || p.created_at,
        });
      } else if (normSt === 'ABANDONED' || normSt === 'SUSPENDED') {
        projectsRequiringAttention.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          region_name: reg?.name || 'Ghana',
          district_name: dist?.name || 'District',
          status: p.project_status,
          progress: p.progress_percentage || 0,
          reason: `Site flagged as ${p.project_status} - work halted indefinitely`,
          severity: 'HIGH',
          flag_type: 'ABANDONED_STATUS',
          reports_count: pReports.length,
          updated_at: p.updated_at || p.created_at,
        });
      } else if (normSt === 'ONGOING' && (p.progress_percentage || 0) === 0) {
        projectsRequiringAttention.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          region_name: reg?.name || 'Ghana',
          district_name: dist?.name || 'District',
          status: p.project_status,
          progress: 0,
          reason: `Active ongoing project with 0% recorded physical progress`,
          severity: 'WARNING',
          flag_type: 'ZERO_PROGRESS',
          reports_count: pReports.length,
          updated_at: p.updated_at || p.created_at,
        });
      } else if (p.project_status === 'COMPLETED' && (p.progress_percentage || 0) < 100) {
        projectsRequiringAttention.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          region_name: reg?.name || 'Ghana',
          district_name: dist?.name || 'District',
          status: p.project_status,
          progress: p.progress_percentage || 0,
          reason: `Marked COMPLETED in registry but recorded progress is ${p.progress_percentage}%`,
          severity: 'WARNING',
          flag_type: 'PROGRESS_MISMATCH',
          reports_count: pReports.length,
          updated_at: p.updated_at || p.created_at,
        });
      }
    }

    // Data Quality Analytics & Metadata Completeness
    const missingCoords = scopedProjects.filter(
      (p) => !p.latitude || !p.longitude || isNaN(p.latitude) || isNaN(p.longitude) || p.latitude < -90 || p.latitude > 90 || p.longitude < -180 || p.longitude > 180
    );
    const missingContractor = scopedProjects.filter((p) => !p.contractor_id);
    const zeroProgOngoing = scopedProjects.filter(
      (p) => p.project_status === 'ONGOING' && (p.progress_percentage || 0) === 0
    );
    const pastDue = scopedProjects.filter(
      (p) => p.expected_completion_date && new Date(p.expected_completion_date).getTime() < Date.now() && p.project_status !== 'COMPLETED'
    );
    const completedUnder100 = scopedProjects.filter(
      (p) => p.project_status === 'COMPLETED' && (p.progress_percentage || 0) < 100
    );

    const flagDetails: Array<{
      project_id: string;
      project_title: string;
      issue: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      category: string;
    }> = [];

    missingCoords.forEach((p) => {
      flagDetails.push({
        project_id: p.id,
        project_title: p.title,
        issue: 'Missing or out-of-bounds GPS geospatial coordinates',
        severity: 'MEDIUM',
        category: 'GEOSPATIAL',
      });
    });

    missingContractor.forEach((p) => {
      flagDetails.push({
        project_id: p.id,
        project_title: p.title,
        issue: 'Contractor entity unassigned in registry',
        severity: 'LOW',
        category: 'METADATA',
      });
    });

    zeroProgOngoing.forEach((p) => {
      flagDetails.push({
        project_id: p.id,
        project_title: p.title,
        issue: 'Active ongoing work with 0% progress recorded',
        severity: 'HIGH',
        category: 'EXECUTION',
      });
    });

    completedUnder100.forEach((p) => {
      flagDetails.push({
        project_id: p.id,
        project_title: p.title,
        issue: `Status marked COMPLETED but progress is ${p.progress_percentage}%`,
        severity: 'MEDIUM',
        category: 'AUDIT',
      });
    });

    // Verification Metrics
    const verifiedProjectsCount = scopedProjects.filter((p) => p.verification_status === 'VERIFIED').length;
    const pendingProjectsCount = scopedProjects.filter((p) => p.verification_status === 'PENDING' || p.verification_status === 'UNDER_REVIEW').length;
    const rejectedProjectsCount = scopedProjects.filter((p) => p.verification_status === 'REJECTED').length;
    const changesRequestedCount = scopedProjects.filter((p) => p.verification_status === 'REQUEST_CHANGES').length;
    const verifRate = scopedProjects.length > 0
      ? Math.round((verifiedProjectsCount / scopedProjects.length) * 100)
      : 100;

    return {
      time_range: timeRange,
      jurisdiction_label: jurisdictionLabel,
      summary: {
        total_projects: totalProjects,
        total_budget: totalBudget,
        average_progress: avgProgress,
        completed_projects: completedCount,
        ongoing_projects: ongoingCount,
        abandoned_or_suspended: abandonedOrSuspended,
        critical_reports_count: criticalReportsCount,
        evidence_verified_rate: evidenceRate,
      },
      projects_by_region: projectsByRegion,
      projects_by_category: projectsByCategory,
      projects_by_status: projectsByStatus,
      projects_by_verification_status: projectsByVerificationStatus,
      reports_by_severity: reportsBySeverity,
      reports_by_status: reportsByStatus,
      evidence_by_status: evidenceByStatus,
      submissions_timeline: timeline,
      progress_distribution: progressDistribution,
      budget_metrics: {
        total_budget: totalBudget,
        average_budget: avgBudget,
        currency: 'GHS',
        budget_by_status: budgetByStatus,
      },
      projects_requiring_attention: projectsRequiringAttention,
      data_quality_metrics: {
        total_flagged: flagDetails.length,
        missing_coordinates: missingCoords.length,
        missing_contractor: missingContractor.length,
        zero_progress_ongoing: zeroProgOngoing.length,
        past_expected_completion: pastDue.length,
        completed_under_100: completedUnder100.length,
        flag_details: flagDetails,
      },
      verification_metrics: {
        total_decisions: verifiedProjectsCount + rejectedProjectsCount + changesRequestedCount,
        verified_count: verifiedProjectsCount,
        pending_count: pendingProjectsCount,
        rejected_count: rejectedProjectsCount,
        changes_requested: changesRequestedCount,
        verification_rate: verifRate,
      },
    };
  }

  // --- Safe Data Export Foundation (CSV) ---

  private formatCsvField(val: unknown): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  public exportDataToCSV(
    resource: 'projects' | 'reports' | 'evidence' | 'audit_logs' | 'users',
    filters: Record<string, any> = {},
    actor: Profile
  ): { filename: string; csv: string } {
    // Permission Enforcement
    if (resource === 'audit_logs' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'NATIONAL_MONITOR') {
      throw new Error('FORBIDDEN_OPERATION: Audit logs can only be exported by Super Administrators and National Monitors.');
    }

    if (resource === 'users' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'NATIONAL_MONITOR') {
      throw new Error('FORBIDDEN_OPERATION: User directory export requires Super Administrator or National Monitor credentials.');
    }

    let csvContent = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ghanabuild_${resource}_${timestamp}.csv`;

    if (resource === 'projects') {
      let list = [...this.projects];
      // Jurisdiction filter
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        list = list.filter((p) => p.district_id === actor.district_id);
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        list = list.filter((p) => p.region_id === actor.region_id);
      }

      if (filters.status) list = list.filter((p) => (p.project_status === filters.status || (p as any).status === filters.status));
      if (filters.verification_status) list = list.filter((p) => p.verification_status === filters.verification_status);

      const headers = [
        'Project ID',
        'Title',
        'Slug',
        'Category',
        'Region',
        'District',
        'Community',
        'Budget (GHS)',
        'Progress (%)',
        'Execution Status',
        'Verification Status',
        'Contractor',
        'Start Date',
        'Expected Completion',
        'Created Date',
      ];

      const rows = list.map((p) => {
        const cat = this.categories.find((c) => c.id === p.category_id)?.name || p.category_id;
        const reg = this.regions.find((r) => r.id === p.region_id)?.name || p.region_id;
        const dist = this.districts.find((d) => d.id === p.district_id)?.name || p.district_id;
        const comm = this.communities.find((c) => c.id === p.community_id)?.name || p.community_id || '';
        const contr = this.contractors.find((c) => c.id === p.contractor_id)?.name || p.contractor_id || '';

        return [
          this.formatCsvField(p.id),
          this.formatCsvField(p.title),
          this.formatCsvField(p.slug),
          this.formatCsvField(cat),
          this.formatCsvField(reg),
          this.formatCsvField(dist),
          this.formatCsvField(comm),
          this.formatCsvField(p.budget),
          this.formatCsvField(p.progress_percentage),
          this.formatCsvField(p.project_status || (p as any).status || 'ONGOING'),
          this.formatCsvField(p.verification_status),
          this.formatCsvField(contr),
          this.formatCsvField(p.start_date),
          this.formatCsvField(p.expected_completion_date),
          this.formatCsvField(p.created_at),
        ].join(',');
      });

      csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    } else if (resource === 'reports') {
      let list = [...this.projectReports];
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        const allowedPrjIds = new Set(this.projects.filter((p) => p.district_id === actor.district_id).map((p) => p.id));
        list = list.filter((r) => allowedPrjIds.has(r.project_id));
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        const allowedPrjIds = new Set(this.projects.filter((p) => p.region_id === actor.region_id).map((p) => p.id));
        list = list.filter((r) => allowedPrjIds.has(r.project_id));
      }

      const headers = [
        'Report ID',
        'Project ID',
        'Project Title',
        'Report Type',
        'Severity',
        'Status',
        'Description',
        'Location Description',
        'Reporter Name',
        'Created Date',
        'Resolved Date',
      ];

      const rows = list.map((r) => {
        const prj = this.projects.find((p) => p.id === r.project_id);
        return [
          this.formatCsvField(r.id),
          this.formatCsvField(r.project_id),
          this.formatCsvField(prj?.title || ''),
          this.formatCsvField(r.report_type),
          this.formatCsvField(r.severity),
          this.formatCsvField(r.status),
          this.formatCsvField(r.description),
          this.formatCsvField(r.location_notes),
          this.formatCsvField(r.submitter_name || r.submitted_by),
          this.formatCsvField(r.created_at),
          this.formatCsvField(r.resolved_at),
        ].join(',');
      });

      csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    } else if (resource === 'evidence') {
      let list = [...this.projectEvidence];
      if (actor.role === 'MMDCE_OFFICER' && actor.district_id) {
        const allowedPrjIds = new Set(this.projects.filter((p) => p.district_id === actor.district_id).map((p) => p.id));
        list = list.filter((e) => allowedPrjIds.has(e.project_id));
      } else if (actor.role === 'REGIONAL_OFFICER' && actor.region_id) {
        const allowedPrjIds = new Set(this.projects.filter((p) => p.region_id === actor.region_id).map((p) => p.id));
        list = list.filter((e) => allowedPrjIds.has(e.project_id));
      }

      const headers = [
        'Evidence ID',
        'Project ID',
        'Project Title',
        'Evidence Type',
        'File URL',
        'File Size (KB)',
        'Caption',
        'Verification Status',
        'Verified By',
        'Created Date',
      ];

      const rows = list.map((e) => {
        const prj = this.projects.find((p) => p.id === e.project_id);
        return [
          this.formatCsvField(e.id),
          this.formatCsvField(e.project_id),
          this.formatCsvField(prj?.title || ''),
          this.formatCsvField(e.evidence_type),
          this.formatCsvField(e.file_url),
          this.formatCsvField(Math.round(e.file_size / 1024)),
          this.formatCsvField(e.caption),
          this.formatCsvField(e.verification_status),
          this.formatCsvField(e.verified_by),
          this.formatCsvField(e.created_at),
        ].join(',');
      });

      csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    } else if (resource === 'audit_logs') {
      const headers = [
        'Audit ID',
        'Timestamp',
        'Action',
        'Actor Email',
        'Actor Role',
        'Entity Type',
        'Entity ID',
        'Reason',
      ];

      const rows = this.auditLogs.map((a) => [
        this.formatCsvField(a.id),
        this.formatCsvField(a.created_at),
        this.formatCsvField(a.action),
        this.formatCsvField(a.user_email),
        this.formatCsvField(a.user_role),
        this.formatCsvField(a.entity_type),
        this.formatCsvField(a.entity_id),
        this.formatCsvField(a.reason),
      ].join(','));

      csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    } else if (resource === 'users') {
      // Safe user directory export (Zero passwords or security keys)
      const headers = [
        'User ID',
        'Full Name',
        'Official Email',
        'Phone',
        'Role',
        'Region',
        'District',
        'Organization',
        'Account Status',
        'Active',
        'Created Date',
        'Last Active',
      ];

      const rows = this.users.map((u) => {
        const reg = this.regions.find((r) => r.id === u.region_id)?.name || u.region_id || 'National';
        const dist = this.districts.find((d) => d.id === u.district_id)?.name || u.district_id || 'All Districts';
        return [
          this.formatCsvField(u.id),
          this.formatCsvField(u.full_name),
          this.formatCsvField(u.email),
          this.formatCsvField(u.phone),
          this.formatCsvField(u.role),
          this.formatCsvField(reg),
          this.formatCsvField(dist),
          this.formatCsvField(u.organization),
          this.formatCsvField(u.account_status || 'ACTIVE'),
          this.formatCsvField(u.is_active ? 'Yes' : 'No'),
          this.formatCsvField(u.created_at),
          this.formatCsvField(u.last_active_at),
        ].join(',');
      });

      csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    }

    // Record immutable audit log of the export
    this.auditLogs.unshift({
      id: `AUD-EXPORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'DATA_EXPORTED',
      entity_type: 'EXPORT',
      entity_id: resource.toUpperCase(),
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      old_values: null,
      new_values: { resource, filename, row_count: csvContent.split('\n').length - 1 },
      reason: `Authorized CSV export of ${resource} by ${actor.role}`,
      created_at: new Date().toISOString(),
    });

    return { filename, csv: csvContent };
  }

  public rejectAuditModification(): never {
    throw new Error('AUDIT_IMMUTABILITY_VIOLATION: Audit logs are append-only and cannot be modified or deleted.');
  }
}

export const projectStore = new ProjectStore();
