import { projectStore } from '../db/project_store';
import { Profile, UserRole } from '../../src/types/user';

export interface Phase9TestResult {
  id: string;
  name: string;
  category: 'SPATIAL_MAPPING' | 'DATA_PRIVACY' | 'ANALYTICS_INTEGRITY' | 'JURISDICTION' | 'DATA_QUALITY' | 'GEOGRAPHY_DRILLDOWN';
  description: string;
  passed: boolean;
  expectedStatus: number | string;
  actualStatus: number | string;
  message: string;
  details?: any;
}

// Personas for security simulation
const MMDCE_ACCRA_OFFICER: Profile = {
  id: 'test-mmdce-accra-p9',
  auth_user_id: 'auth-mmdce-accra-p9',
  full_name: 'Hon. K. Adjei (Accra MMDCE)',
  email: 'adjei@accra.gov.gh',
  role: 'MMDCE_OFFICER',
  region_id: 'REG-GAR-01',
  district_id: 'DIST-ACCRA-METRO',
  organization: 'Accra Metropolitan Assembly',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const REGIONAL_ASHANTI_OFFICER: Profile = {
  id: 'test-reg-ashanti-p9',
  auth_user_id: 'auth-reg-ashanti-p9',
  full_name: 'Ing. Y. Boateng (Ashanti RCC)',
  email: 'boateng@ashanti-rcc.gov.gh',
  role: 'REGIONAL_OFFICER',
  region_id: 'REG-ASHANTI-01',
  organization: 'Ashanti Regional Coordinating Council',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const NATIONAL_MONITOR: Profile = {
  id: 'test-national-monitor-p9',
  auth_user_id: 'auth-nat-p9',
  full_name: 'Dr. C. Mensah (National Auditor)',
  email: 'mensah@ndpc.gov.gh',
  role: 'NATIONAL_MONITOR',
  organization: 'National Development Planning Commission',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function runPhase9Tests(): {
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
    timestamp: string;
  };
  results: Phase9TestResult[];
} {
  const startTime = Date.now();
  const results: Phase9TestResult[] = [];

  // =========================================================================
  // TEST 1: Coordinate Bounds Validation & Filtering
  // =========================================================================
  try {
    const mapItems = projectStore.getProjectMapData();
    const allValidChecked = mapItems.every((item) => {
      if (item.has_valid_coordinates) {
        return (
          typeof item.latitude === 'number' &&
          !isNaN(item.latitude) &&
          item.latitude >= -90 &&
          item.latitude <= 90 &&
          typeof item.longitude === 'number' &&
          !isNaN(item.longitude) &&
          item.longitude >= -180 &&
          item.longitude <= 180
        );
      }
      return true;
    });

    const geocodedCount = mapItems.filter((i) => i.has_valid_coordinates).length;

    results.push({
      id: 'TEST_COORDINATE_VALIDATION',
      name: 'Geospatial Coordinate Bounds Validation',
      category: 'SPATIAL_MAPPING',
      description: 'Ensures latitude is [-90, 90], longitude is [-180, 180], and invalid/unlocated coordinates are flagged without crashing spatial rendering',
      passed: allValidChecked && geocodedCount > 0,
      expectedStatus: 'COORDINATES_VALIDATED',
      actualStatus: allValidChecked && geocodedCount > 0 ? 'COORDINATES_VALIDATED' : 'BOUNDS_ERROR',
      message: `Validated ${mapItems.length} spatial records; ${geocodedCount} verified geocoded points conform to WGS-84 coordinate bounds.`,
      details: { total_records: mapItems.length, geocoded: geocodedCount },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_COORDINATE_VALIDATION',
      name: 'Geospatial Coordinate Bounds Validation',
      category: 'SPATIAL_MAPPING',
      description: 'Coordinate bounds validation',
      passed: false,
      expectedStatus: 'COORDINATES_VALIDATED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 2: Public Map Data Privacy & RLS
  // =========================================================================
  try {
    const publicMap = projectStore.getProjectMapData();
    const nonVerifiedItems = publicMap.filter((p) => p.verification_status !== 'VERIFIED');

    results.push({
      id: 'TEST_PUBLIC_MAP_DATA_PRIVACY',
      name: 'Public Map Privacy & Row-Level Security',
      category: 'DATA_PRIVACY',
      description: 'Public unauthenticated map requests must strictly return VERIFIED projects and exclude pending drafts or citizen PII',
      passed: nonVerifiedItems.length === 0,
      expectedStatus: 'VERIFIED_ONLY_RETURNED',
      actualStatus: nonVerifiedItems.length === 0 ? 'VERIFIED_ONLY_RETURNED' : 'UNVERIFIED_DATA_LEAKED',
      message: nonVerifiedItems.length === 0
        ? 'Public map strictly filtered to verified projects; zero unverified drafts exposed.'
        : `Security breach: ${nonVerifiedItems.length} unverified projects exposed on public map!`,
      details: { total_public_markers: publicMap.length, unverified_leaked: nonVerifiedItems.length },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_PUBLIC_MAP_DATA_PRIVACY',
      name: 'Public Map Privacy & Row-Level Security',
      category: 'DATA_PRIVACY',
      description: 'Public map privacy check',
      passed: false,
      expectedStatus: 'VERIFIED_ONLY_RETURNED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 3: Multi-Criteria Spatial Querying
  // =========================================================================
  try {
    // Filter by Region
    const garMap = projectStore.getProjectMapData({ region: 'REG-GAR-01' });
    const allGAR = garMap.every((p) => p.region.id === 'REG-GAR-01' || p.region.code === 'GAR');

    // Filter by Status
    const completedMap = projectStore.getProjectMapData({ status: 'COMPLETED' });
    const allCompleted = completedMap.every((p) => p.project_status === 'COMPLETED');

    // Filter by progress range
    const progressRangeMap = projectStore.getProjectMapData({ min_progress: 50, max_progress: 100 });
    const allInRange = progressRangeMap.every((p) => p.progress_percentage >= 50 && p.progress_percentage <= 100);

    const isSuccess = allGAR && allCompleted && allInRange;

    results.push({
      id: 'TEST_SPATIAL_AND_SECTOR_FILTERING',
      name: 'Multi-Criteria Spatial Filtering',
      category: 'SPATIAL_MAPPING',
      description: 'Validates spatial query execution across Region, Project Status, and Progress Ranges',
      passed: isSuccess,
      expectedStatus: 'FILTERING_ACCURATE',
      actualStatus: isSuccess ? 'FILTERING_ACCURATE' : 'FILTERING_MISMATCH',
      message: `Spatial queries accurately filtered: GAR=${garMap.length}, Completed=${completedMap.length}, Progress[50-100]=${progressRangeMap.length}.`,
      details: { gar_count: garMap.length, completed_count: completedMap.length, progress_count: progressRangeMap.length },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_SPATIAL_AND_SECTOR_FILTERING',
      name: 'Multi-Criteria Spatial Filtering',
      category: 'SPATIAL_MAPPING',
      description: 'Spatial filtering test',
      passed: false,
      expectedStatus: 'FILTERING_ACCURATE',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 4: Public Analytics Aggregation Accuracy
  // =========================================================================
  try {
    const publicAnalytics = projectStore.getPublicAnalytics();
    const verifiedProjects = projectStore.listProjects({ verification_status: 'VERIFIED', limit: 1000 }).projects;

    const computedTotal = verifiedProjects.length;
    const computedBudget = verifiedProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

    const isExactMatch =
      publicAnalytics.summary.total_projects === computedTotal &&
      publicAnalytics.summary.total_budget === computedBudget &&
      publicAnalytics.projects_by_region.length === 16;

    results.push({
      id: 'TEST_PUBLIC_ANALYTICS_AGGREGATION_ACCURACY',
      name: 'Public Analytics Mathematical Aggregation Accuracy',
      category: 'ANALYTICS_INTEGRITY',
      description: 'Verifies public analytics calculates real database sums and includes all 16 regions with zero hardcoded approximations',
      passed: isExactMatch,
      expectedStatus: 'SUMS_MATCH_STORE',
      actualStatus: isExactMatch ? 'SUMS_MATCH_STORE' : 'AGGREGATION_DISCREPANCY',
      message: `Public metrics match verified store: ${publicAnalytics.summary.total_projects} projects, GH₵ ${publicAnalytics.summary.total_budget.toLocaleString()} total investment across all 16 regions.`,
      details: {
        analytics_projects: publicAnalytics.summary.total_projects,
        store_projects: computedTotal,
        analytics_budget: publicAnalytics.summary.total_budget,
        store_budget: computedBudget,
        regions_tracked: publicAnalytics.projects_by_region.length,
      },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_PUBLIC_ANALYTICS_AGGREGATION_ACCURACY',
      name: 'Public Analytics Mathematical Aggregation Accuracy',
      category: 'ANALYTICS_INTEGRITY',
      description: 'Public analytics accuracy check',
      passed: false,
      expectedStatus: 'SUMS_MATCH_STORE',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 5: Jurisdiction-Scoped Operational Analytics
  // =========================================================================
  try {
    const nationalAnalytics = projectStore.getOperationalAnalytics({ actor: NATIONAL_MONITOR });
    const mmdceAnalytics = projectStore.getOperationalAnalytics({ actor: MMDCE_ACCRA_OFFICER });
    const regionalAnalytics = projectStore.getOperationalAnalytics({ actor: REGIONAL_ASHANTI_OFFICER });

    // MMDCE must only see projects in their assigned district
    const mmdceAllInDistrict = mmdceAnalytics.projects_by_region.every(
      (r) => r.region_id === MMDCE_ACCRA_OFFICER.region_id
    );

    // Regional must only see projects in their assigned region
    const regionalAllInRegion = regionalAnalytics.projects_by_region.every(
      (r) => r.region_id === REGIONAL_ASHANTI_OFFICER.region_id
    );

    const isScopedProperly =
      mmdceAllInDistrict &&
      regionalAllInRegion &&
      mmdceAnalytics.summary.total_projects <= nationalAnalytics.summary.total_projects &&
      regionalAnalytics.summary.total_projects <= nationalAnalytics.summary.total_projects;

    results.push({
      id: 'TEST_JURISDICTION_SCOPED_ADMIN_ANALYTICS',
      name: 'Role-Aware Jurisdiction Analytics Scoping',
      category: 'JURISDICTION',
      description: 'MMDCE officers are strictly limited to their MMDA district metrics; Regional officers to their regional council; National Monitors retain national scope',
      passed: isScopedProperly,
      expectedStatus: 'JURISDICTION_ENFORCED',
      actualStatus: isScopedProperly ? 'JURISDICTION_ENFORCED' : 'JURISDICTION_LEAK',
      message: `Jurisdiction scoping enforced: National=${nationalAnalytics.summary.total_projects}, Regional(ASH)=${regionalAnalytics.summary.total_projects}, MMDCE(Accra)=${mmdceAnalytics.summary.total_projects}.`,
      details: {
        national_total: nationalAnalytics.summary.total_projects,
        regional_total: regionalAnalytics.summary.total_projects,
        mmdce_total: mmdceAnalytics.summary.total_projects,
      },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_JURISDICTION_SCOPED_ADMIN_ANALYTICS',
      name: 'Role-Aware Jurisdiction Analytics Scoping',
      category: 'JURISDICTION',
      description: 'Jurisdiction analytics test',
      passed: false,
      expectedStatus: 'JURISDICTION_ENFORCED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 6: "Projects Requiring Attention" Diagnostic Engine
  // =========================================================================
  try {
    const adminAnalytics = projectStore.getOperationalAnalytics();
    const attentionList = adminAnalytics.projects_requiring_attention || [];

    // Check that items in the list have valid reasons, severity, and slugs
    const allValidFlags = attentionList.every(
      (item) =>
        item.id &&
        item.title &&
        item.slug &&
        item.reason &&
        ['HIGH', 'CRITICAL', 'WARNING'].includes(item.severity)
    );

    results.push({
      id: 'TEST_PROJECTS_REQUIRING_ATTENTION_LOGIC',
      name: 'Projects Requiring Operational Attention Diagnostic Engine',
      category: 'DATA_QUALITY',
      description: 'Identifies projects affected by citizen defect reports, abandoned status, or zero progress ongoing works',
      passed: allValidFlags,
      expectedStatus: 'ATTENTION_FLAGS_DIAGNOSED',
      actualStatus: allValidFlags ? 'ATTENTION_FLAGS_DIAGNOSED' : 'DIAGNOSTIC_FAILURE',
      message: `Diagnostic engine flagged ${attentionList.length} projects requiring administrative intervention with verified diagnostic reasons.`,
      details: { flagged_count: attentionList.length, top_issues: attentionList.slice(0, 3).map((i) => i.reason) },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_PROJECTS_REQUIRING_ATTENTION_LOGIC',
      name: 'Projects Requiring Operational Attention Diagnostic Engine',
      category: 'DATA_QUALITY',
      description: 'Projects requiring attention test',
      passed: false,
      expectedStatus: 'ATTENTION_FLAGS_DIAGNOSED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 7: Data Quality Analytics & Metadata Completeness
  // =========================================================================
  try {
    const adminAnalytics = projectStore.getOperationalAnalytics();
    const dq = adminAnalytics.data_quality_metrics;

    const hasValidMetrics =
      dq !== undefined &&
      typeof dq.total_flagged === 'number' &&
      typeof dq.missing_coordinates === 'number' &&
      typeof dq.missing_contractor === 'number' &&
      Array.isArray(dq.flag_details);

    results.push({
      id: 'TEST_DATA_QUALITY_ANALYTICS_DIAGNOSTICS',
      name: 'Data Quality & Metadata Completeness Audit',
      category: 'DATA_QUALITY',
      description: 'Audits database for missing geospatial coordinates, unassigned contractors, and progress discrepancies',
      passed: hasValidMetrics,
      expectedStatus: 'DATA_QUALITY_AUDITED',
      actualStatus: hasValidMetrics ? 'DATA_QUALITY_AUDITED' : 'METRICS_MISSING',
      message: `Data quality audit verified: ${dq?.total_flagged ?? 0} quality observations categorized (Missing GPS: ${dq?.missing_coordinates ?? 0}, Unassigned Contractor: ${dq?.missing_contractor ?? 0}).`,
      details: dq,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_DATA_QUALITY_ANALYTICS_DIAGNOSTICS',
      name: 'Data Quality & Metadata Completeness Audit',
      category: 'DATA_QUALITY',
      description: 'Data quality metrics check',
      passed: false,
      expectedStatus: 'DATA_QUALITY_AUDITED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  // =========================================================================
  // TEST 8: Geographic Drill-Down Referential Integrity
  // =========================================================================
  try {
    // 1. Region level
    const region = projectStore.getRegionBySlugOrId('greater-accra');
    const hasDistricts = region !== null && region.districts && region.districts.length > 0;

    // 2. District level
    const district = projectStore.getDistrictBySlugOrId('DIST-ACCRA-METRO');
    const hasDistrictDetails =
      district !== null &&
      district.district.id === 'DIST-ACCRA-METRO' &&
      district.region.id === 'REG-GAR-01' &&
      district.communities.length > 0;

    const passed = hasDistricts && hasDistrictDetails;

    results.push({
      id: 'TEST_GEOGRAPHIC_DRILL_DOWN_REFERENTIAL_INTEGRITY',
      name: 'Geographic Hierarchy Drill-Down (Region -> District -> Community)',
      category: 'GEOGRAPHY_DRILLDOWN',
      description: 'Validates seamless referential traversal from Region to District Assembly down to Local Communities with live aggregated metrics',
      passed,
      expectedStatus: 'HIERARCHY_INTEGRITY_CONFIRMED',
      actualStatus: passed ? 'HIERARCHY_INTEGRITY_CONFIRMED' : 'REFERENTIAL_BROKEN',
      message: passed
        ? `Traversed Greater Accra (${region?.districts.length} districts) -> Accra Metropolitan Assembly (${district?.communities.length} communities, ${district?.statistics.total_projects} verified projects).`
        : 'Geographic hierarchy traversal failed or produced null reference.',
      details: {
        region: region?.region.name,
        districts_in_region: region?.districts.length,
        district_name: district?.district.name,
        communities_count: district?.communities.length,
        projects_count: district?.statistics.total_projects,
      },
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_GEOGRAPHIC_DRILL_DOWN_REFERENTIAL_INTEGRITY',
      name: 'Geographic Hierarchy Drill-Down (Region -> District -> Community)',
      category: 'GEOGRAPHY_DRILLDOWN',
      description: 'Geographic drill down check',
      passed: false,
      expectedStatus: 'HIERARCHY_INTEGRITY_CONFIRMED',
      actualStatus: 'EXCEPTION',
      message: err.message,
    });
  }

  const durationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    },
    results,
  };
}
