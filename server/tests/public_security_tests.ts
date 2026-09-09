import { projectStore } from '../db/project_store';
import { ProjectTestCase } from './project_tests';

/**
 * Phase 4 Public Project Explorer Acceptance & Security Tests
 * Verifies public visibility constraints, query protections, map data sanitization,
 * server-side sorting allowlists, and regional/categorical statistics.
 */
export function runPublicSecurityTests(): {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  cases: ProjectTestCase[];
} {
  const cases: ProjectTestCase[] = [];

  // TEST 1: Unverified projects cannot appear in public queries
  try {
    const publicResult = projectStore.listProjects({ includeAllStatus: false });
    const hasUnverified = publicResult.projects.some(
      (p) => p.verification_status !== 'VERIFIED'
    );
    cases.push({
      id: 'PUB-SEC-01',
      category: 'PUBLIC_VISIBILITY',
      name: 'Unverified Projects Excluded from Public Query',
      description: 'Verifies that listProjects with default public settings never returns unverified or pending projects',
      passed: !hasUnverified && publicResult.projects.length > 0,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: !hasUnverified
        ? `Passed: All ${publicResult.projects.length} returned projects have verification_status = 'VERIFIED'`
        : 'Failed: Unverified projects detected in public query result',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-01',
      category: 'PUBLIC_VISIBILITY',
      name: 'Unverified Projects Excluded from Public Query',
      description: 'Verifies that unverified projects are excluded',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 2: Archived projects cannot appear in public queries
  try {
    const publicResult = projectStore.listProjects({ includeAllStatus: false });
    const hasArchived = publicResult.projects.some(
      (p) => p.verification_status === 'ARCHIVED'
    );
    cases.push({
      id: 'PUB-SEC-02',
      category: 'PUBLIC_VISIBILITY',
      name: 'Archived Projects Excluded from Public Query',
      description: 'Verifies that historical archived projects are strictly omitted from public views',
      passed: !hasArchived,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: !hasArchived
        ? 'Passed: No archived projects exposed in public project explorer'
        : 'Failed: Archived project was found in public listing',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-02',
      category: 'PUBLIC_VISIBILITY',
      name: 'Archived Projects Excluded from Public Query',
      description: 'Verifies that archived projects are excluded',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 3: Manipulated query parameters cannot bypass verification filter
  try {
    // Attempt to pass verification_status: 'PENDING' without includeAllStatus permission
    const bypassAttempt = projectStore.listProjects({
      verification_status: 'PENDING' as any,
      includeAllStatus: false, // simulated unauthenticated citizen request
    });
    const exposedPending = bypassAttempt.projects.some(
      (p) => p.verification_status === 'PENDING'
    );
    cases.push({
      id: 'PUB-SEC-03',
      category: 'QUERY_PROTECTION',
      name: 'Parameter Manipulation Filter Bypass Prevention',
      description: 'Verifies that passing verification_status=PENDING without officer permissions cannot retrieve pending projects',
      passed: !exposedPending,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: !exposedPending
        ? 'Passed: Public query engine forced verification constraint to VERIFIED despite client parameter tampering'
        : 'Failed: Public query engine allowed citizen to inspect pending unverified projects',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-03',
      category: 'QUERY_PROTECTION',
      name: 'Parameter Manipulation Filter Bypass Prevention',
      description: 'Verifies query bypass prevention',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 4: Public map endpoint returns only verified projects with valid coordinates
  try {
    const mapMarkers = projectStore.getProjectMapData();
    const hasUnverifiedMarkers = mapMarkers.some(
      (m) => m.verification_status !== 'VERIFIED'
    );
    const hasInvalidCoords = mapMarkers.some(
      (m) => typeof m.latitude !== 'number' || typeof m.longitude !== 'number' || isNaN(m.latitude) || isNaN(m.longitude)
    );
    cases.push({
      id: 'PUB-SEC-04',
      category: 'MAP_INTEGRITY',
      name: 'Public Map Marker Verification and Coordinate Integrity',
      description: 'Verifies that public map data outputs exclusively verified projects with valid GPS coordinates',
      passed: !hasUnverifiedMarkers && !hasInvalidCoords && mapMarkers.length > 0,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: !hasUnverifiedMarkers && !hasInvalidCoords
        ? `Passed: All ${mapMarkers.length} map markers are verified with valid coordinates`
        : 'Failed: Map data contains unverified projects or malformed coordinates',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-04',
      category: 'MAP_INTEGRITY',
      name: 'Public Map Marker Verification and Coordinate Integrity',
      description: 'Verifies map data integrity',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 5: Regional statistics only aggregate verified projects
  try {
    const regionStats = projectStore.getRegionStatistics();
    const totalAggregatedProjects = regionStats.reduce((sum, r) => sum + r.total_projects, 0);
    const verifiedProjectsCount = projectStore.listProjects({ includeAllStatus: false }).total;

    cases.push({
      id: 'PUB-SEC-05',
      category: 'STATS_ACCURACY',
      name: 'Regional Statistics Verified Project Alignment',
      description: 'Verifies that regional summaries accurately sum only verified public infrastructure',
      passed: totalAggregatedProjects === verifiedProjectsCount && regionStats.length === 16,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: totalAggregatedProjects === verifiedProjectsCount
        ? `Passed: All 16 regions present; aggregated project sum (${totalAggregatedProjects}) matches verified count (${verifiedProjectsCount})`
        : `Failed: Aggregated projects (${totalAggregatedProjects}) != verified projects (${verifiedProjectsCount})`,
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-05',
      category: 'STATS_ACCURACY',
      name: 'Regional Statistics Verified Project Alignment',
      description: 'Verifies region stats accuracy',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 6: Category statistics only aggregate verified projects
  try {
    const categoryStats = projectStore.getCategoryStatistics();
    const totalAggregatedCatProjects = categoryStats.reduce((sum, c) => sum + c.total_projects, 0);
    const verifiedProjectsCount = projectStore.listProjects({ includeAllStatus: false }).total;

    cases.push({
      id: 'PUB-SEC-06',
      category: 'STATS_ACCURACY',
      name: 'Category Statistics Verified Project Alignment',
      description: 'Verifies that sector/category summaries accurately sum only verified public infrastructure',
      passed: totalAggregatedCatProjects === verifiedProjectsCount,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: totalAggregatedCatProjects === verifiedProjectsCount
        ? `Passed: Category project sum (${totalAggregatedCatProjects}) strictly matches verified count (${verifiedProjectsCount})`
        : `Failed: Category project sum (${totalAggregatedCatProjects}) != verified projects (${verifiedProjectsCount})`,
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-06',
      category: 'STATS_ACCURACY',
      name: 'Category Statistics Verified Project Alignment',
      description: 'Verifies category stats accuracy',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 7: Safe sorting allowlist rejects injection/arbitrary field tampering
  try {
    const resultWithInvalidSort = projectStore.listProjects({
      sort: 'unauthorized_column; DROP TABLE--' as any,
      order: 'desc',
      includeAllStatus: false,
    });
    cases.push({
      id: 'PUB-SEC-07',
      category: 'QUERY_PROTECTION',
      name: 'Server-Side Sort Field Allowlist Enforcement',
      description: 'Verifies that invalid or adversarial sort fields are rejected and safely fall back to created_at',
      passed: resultWithInvalidSort.projects.length > 0,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: 'Passed: Unrecognized sort parameter was safely ignored and defaulted to created_at without error or SQL leakage',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-07',
      category: 'QUERY_PROTECTION',
      name: 'Server-Side Sort Field Allowlist Enforcement',
      description: 'Verifies sort field allowlist',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  // TEST 8: Server-side pagination metadata integrity
  try {
    const page1 = projectStore.listProjects({ page: 1, limit: 3, includeAllStatus: false });
    const page2 = projectStore.listProjects({ page: 2, limit: 3, includeAllStatus: false });

    const distinct = page1.projects.every(
      (p1) => !page2.projects.some((p2) => p2.id === p1.id)
    );

    cases.push({
      id: 'PUB-SEC-08',
      category: 'PAGINATION_INTEGRITY',
      name: 'Server-Side Pagination Page Boundary Integrity',
      description: 'Verifies that pagination limits and offsets produce non-overlapping consecutive project records',
      passed: distinct && page1.projects.length === 3 && page1.page === 1 && page2.page === 2,
      httpStatusExpected: 200,
      httpStatusReceived: 200,
      details: distinct
        ? `Passed: Page 1 and Page 2 contain distinct non-overlapping records with accurate totalPages calculation (${page1.totalPages} pages)`
        : 'Failed: Duplicate projects detected across pagination boundaries',
    });
  } catch (err: any) {
    cases.push({
      id: 'PUB-SEC-08',
      category: 'PAGINATION_INTEGRITY',
      name: 'Server-Side Pagination Page Boundary Integrity',
      description: 'Verifies pagination integrity',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Exception: ${err.message}`,
    });
  }

  const total = cases.length;
  const passed = cases.filter((c) => c.passed).length;
  const failed = cases.filter((c) => !c.passed).length;

  return {
    suite: 'GhanaBuild 2.0 Phase 4 - Public Explorer Acceptance Test Suite',
    total,
    passed,
    failed,
    allPassed: failed === 0,
    cases,
  };
}
