import { projectStore } from '../db/project_store';
import { Profile, UserRole } from '../../src/types/user';

export interface Phase7TestResult {
  id: string;
  name: string;
  category: 'JURISDICTION' | 'RBAC' | 'WORKFLOW' | 'IMMUTABILITY' | 'CONCURRENCY';
  description: string;
  passed: boolean;
  expectedStatus: number | string;
  actualStatus: number | string;
  message: string;
  details?: any;
}

// Personas for security simulation
const MMDCE_ACCRA_OFFICER: Profile = {
  id: 'test-mmdce-accra',
  auth_user_id: 'auth-mmdce-accra',
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

const CITIZEN_USER: Profile = {
  id: 'test-citizen-01',
  auth_user_id: 'auth-cit-01',
  full_name: 'Kwame Citizen',
  email: 'kwame@citizen.gh',
  role: 'CITIZEN',
  region_id: 'REG-GAR-01',
  district_id: 'DIST-ACCRA-METRO',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const REGIONAL_ASHANTI_OFFICER: Profile = {
  id: 'test-reg-ashanti',
  auth_user_id: 'auth-reg-ashanti',
  full_name: 'Ing. Y. Boateng (Ashanti RCC)',
  email: 'boateng@ashanti-rcc.gov.gh',
  role: 'REGIONAL_OFFICER',
  region_id: 'REG-ASHANTI-01',
  district_id: null,
  organization: 'Ashanti Regional Coordinating Council',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const NATIONAL_MONITOR: Profile = {
  id: 'test-nat-monitor',
  auth_user_id: 'auth-nat-monitor',
  full_name: 'Dr. Afia Osei (National Monitor)',
  email: 'afia.osei@presidency.gov.gh',
  role: 'NATIONAL_MONITOR',
  region_id: null,
  district_id: null,
  organization: 'National Development Planning Commission',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SUPER_ADMIN: Profile = {
  id: 'test-super-admin',
  auth_user_id: 'auth-super-admin',
  full_name: 'GhanaBuild Administrator',
  email: 'admin@ghanabuild.gov.gh',
  role: 'SUPER_ADMIN',
  region_id: null,
  district_id: null,
  organization: 'GhanaBuild Central Governance',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function runPhase7SecurityTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Phase7TestResult[];
}> {
  const results: Phase7TestResult[] = [];

  // Helper to get or create a test project
  const testProjectAccra = projectStore.getProjectByIdOrSlug('PRJ-GAR-001')!;
  const testProjectAshanti = projectStore.getProjectByIdOrSlug('PRJ-ASH-002')!;

  // -------------------------------------------------------------
  // Test 1: Jurisdiction Enforcement (MMDCE Officer Cross-District Rejection)
  // -------------------------------------------------------------
  try {
    // Accra MMDCE Officer attempts to verify an Ashanti project (PRJ-ASH-002)
    projectStore.verifyProject(
      testProjectAshanti.id,
      {
        decision: 'VERIFIED',
        notes: 'Attempting cross-jurisdiction verification',
      },
      MMDCE_ACCRA_OFFICER
    );

    results.push({
      id: 'SEC-P7-001',
      name: 'Jurisdiction Isolation: Cross-District Verification Rejected',
      category: 'JURISDICTION',
      description: 'Accra MMDCE Officer attempting to verify an Ashanti project must be blocked.',
      passed: false,
      expectedStatus: 'JURISDICTION_MISMATCH',
      actualStatus: 'ALLOWED',
      message: 'FAIL: Officer was able to verify a project outside their assigned district jurisdiction.',
    });
  } catch (err: any) {
    const isJurisdictionError = err.message && err.message.includes('JURISDICTION_MISMATCH');
    results.push({
      id: 'SEC-P7-001',
      name: 'Jurisdiction Isolation: Cross-District Verification Rejected',
      category: 'JURISDICTION',
      description: 'Accra MMDCE Officer attempting to verify an Ashanti project must be blocked.',
      passed: isJurisdictionError,
      expectedStatus: 'JURISDICTION_MISMATCH',
      actualStatus: isJurisdictionError ? 'JURISDICTION_MISMATCH' : err.message,
      message: isJurisdictionError
        ? 'PASS: Cross-district verification successfully intercepted with JURISDICTION_MISMATCH.'
        : `FAIL: Unexpected error type: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 2: RBAC Privilege Escalation Prevention (Citizen Role)
  // -------------------------------------------------------------
  try {
    projectStore.verifyProject(
      testProjectAccra.id,
      {
        decision: 'VERIFIED',
        notes: 'Citizen attempting unauthorized verification',
      },
      CITIZEN_USER
    );

    results.push({
      id: 'SEC-P7-002',
      name: 'RBAC Enforcement: Citizen Verification Blocked',
      category: 'RBAC',
      description: 'Citizens and community observers must have no authority to verify projects.',
      passed: false,
      expectedStatus: 'FORBIDDEN_AUTHORITY',
      actualStatus: 'ALLOWED',
      message: 'FAIL: Citizen was able to execute project verification.',
    });
  } catch (err: any) {
    const isForbidden = err.message && err.message.includes('FORBIDDEN_AUTHORITY');
    results.push({
      id: 'SEC-P7-002',
      name: 'RBAC Enforcement: Citizen Verification Blocked',
      category: 'RBAC',
      description: 'Citizens and community observers must have no authority to verify projects.',
      passed: isForbidden,
      expectedStatus: 'FORBIDDEN_AUTHORITY',
      actualStatus: isForbidden ? 'FORBIDDEN_AUTHORITY' : err.message,
      message: isForbidden
        ? 'PASS: Unauthorized role verification intercepted with FORBIDDEN_AUTHORITY.'
        : `FAIL: Unexpected error type: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 3: Mandatory Justification on Rejection or Change Request
  // -------------------------------------------------------------
  try {
    // Create a fresh pending project fixture to isolate workflow validation
    const { project: pendingProjectForTest3 } = projectStore.createProject(
      {
        title: 'Test Mandatory Justification Security Project',
        description: 'Testing requirement for justification reason on rejection.',
        category_id: testProjectAccra.category_id,
        region_id: testProjectAccra.region_id,
        district_id: testProjectAccra.district_id,
        location_name: testProjectAccra.location_name,
        latitude: testProjectAccra.latitude,
        longitude: testProjectAccra.longitude,
        budget: 100000,
        currency: 'GHS',
        progress_percentage: 0,
        project_status: 'PLANNED',
        verification_status: 'PENDING',
      },
      SUPER_ADMIN
    );

    // Attempt rejection without providing reason
    projectStore.verifyProject(
      pendingProjectForTest3.id,
      {
        decision: 'REJECTED',
        reason: '', // Empty reason
      },
      SUPER_ADMIN
    );

    results.push({
      id: 'SEC-P7-003',
      name: 'Mandatory Justification: Rejection Requires Detailed Reason',
      category: 'WORKFLOW',
      description: 'Rejection or change requests without a detailed reason must be blocked.',
      passed: false,
      expectedStatus: 'MANDATORY_JUSTIFICATION_REQUIRED',
      actualStatus: 'ALLOWED',
      message: 'FAIL: System allowed rejection without a justification reason.',
    });
  } catch (err: any) {
    const isJustificationError = err.message && err.message.includes('MANDATORY_JUSTIFICATION_REQUIRED');
    results.push({
      id: 'SEC-P7-003',
      name: 'Mandatory Justification: Rejection Requires Detailed Reason',
      category: 'WORKFLOW',
      description: 'Rejection or change requests without a detailed reason must be blocked.',
      passed: isJustificationError,
      expectedStatus: 'MANDATORY_JUSTIFICATION_REQUIRED',
      actualStatus: isJustificationError ? 'MANDATORY_JUSTIFICATION_REQUIRED' : err.message,
      message: isJustificationError
        ? 'PASS: Rejection rejected without justification with MANDATORY_JUSTIFICATION_REQUIRED.'
        : `FAIL: Unexpected error type: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 4: Optimistic Concurrency Conflict Detection
  // -------------------------------------------------------------
  try {
    // Submit with expected status mismatch
    projectStore.verifyProject(
      testProjectAccra.id,
      {
        decision: 'UNDER_REVIEW',
        expected_status: 'ARCHIVED', // Deliberate mismatch
      },
      SUPER_ADMIN
    );

    results.push({
      id: 'SEC-P7-004',
      name: 'Optimistic Concurrency Protection',
      category: 'CONCURRENCY',
      description: 'Submitting verification with stale expected status must throw conflict.',
      passed: false,
      expectedStatus: 'CONCURRENT_MODIFICATION_CONFLICT',
      actualStatus: 'ALLOWED',
      message: 'FAIL: Conflict check failed to detect stale expected status.',
    });
  } catch (err: any) {
    const isConflict = err.message && err.message.includes('CONCURRENT_MODIFICATION_CONFLICT');
    results.push({
      id: 'SEC-P7-004',
      name: 'Optimistic Concurrency Protection',
      category: 'CONCURRENCY',
      description: 'Submitting verification with stale expected status must throw conflict.',
      passed: isConflict,
      expectedStatus: 'CONCURRENT_MODIFICATION_CONFLICT',
      actualStatus: isConflict ? 'CONCURRENT_MODIFICATION_CONFLICT' : err.message,
      message: isConflict
        ? 'PASS: Stale concurrent modification intercepted with CONCURRENT_MODIFICATION_CONFLICT.'
        : `FAIL: Unexpected error type: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 5: Authorized Verification & Atomic Record Creation
  // -------------------------------------------------------------
  try {
    const priorVerificationsCount = projectStore.listVerifications(testProjectAccra.id).length;

    // National Monitor verifies Accra project
    const outcome = projectStore.verifyProject(
      testProjectAccra.id,
      {
        decision: 'VERIFIED',
        notes: 'Full statutory PPA contract, BoQ, and physical site coordinates verified.',
      },
      NATIONAL_MONITOR
    );

    const postVerifications = projectStore.listVerifications(testProjectAccra.id);
    const passed =
      outcome.project.verification_status === 'VERIFIED' &&
      postVerifications.length === priorVerificationsCount + 1 &&
      postVerifications[0].decision.includes('VERIFIED');

    results.push({
      id: 'SEC-P7-005',
      name: 'Authorized Verification & Append-Only History',
      category: 'WORKFLOW',
      description: 'Authorized National Monitor verifies project and records immutable verification history.',
      passed,
      expectedStatus: 'VERIFIED',
      actualStatus: outcome.project.verification_status,
      message: passed
        ? 'PASS: Project verification status updated and history record immutably appended.'
        : 'FAIL: Verification status or history count mismatch.',
    });
  } catch (err: any) {
    results.push({
      id: 'SEC-P7-005',
      name: 'Authorized Verification & Append-Only History',
      category: 'WORKFLOW',
      description: 'Authorized National Monitor verifies project and records immutable verification history.',
      passed: false,
      expectedStatus: 'VERIFIED',
      actualStatus: 'ERROR',
      message: `FAIL: Exception during verification: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 6: Regional Officer Valid Jurisdiction Verification
  // -------------------------------------------------------------
  try {
    // Ashanti Regional Officer verifies an Ashanti project
    const outcome = projectStore.verifyProject(
      testProjectAshanti.id,
      {
        decision: 'UNDER_REVIEW',
        notes: 'Regional engineering team conducting physical core sample tests.',
      },
      REGIONAL_ASHANTI_OFFICER
    );

    const passed = outcome.project.verification_status === 'UNDER_REVIEW';
    results.push({
      id: 'SEC-P7-006',
      name: 'Regional Jurisdiction Authority Allowed',
      category: 'JURISDICTION',
      description: 'Ashanti Regional Officer has authority to review Ashanti projects.',
      passed,
      expectedStatus: 'UNDER_REVIEW',
      actualStatus: outcome.project.verification_status,
      message: passed
        ? 'PASS: Regional officer successfully verified project within their assigned region.'
        : 'FAIL: Regional verification outcome mismatch.',
    });
  } catch (err: any) {
    results.push({
      id: 'SEC-P7-006',
      name: 'Regional Jurisdiction Authority Allowed',
      category: 'JURISDICTION',
      description: 'Ashanti Regional Officer has authority to review Ashanti projects.',
      passed: false,
      expectedStatus: 'UNDER_REVIEW',
      actualStatus: 'ERROR',
      message: `FAIL: Regional officer review failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 7: Audit Log Immutability Protection
  // -------------------------------------------------------------
  try {
    projectStore.rejectAuditModification();
    results.push({
      id: 'SEC-P7-007',
      name: 'Audit Log Immutability Protection',
      category: 'IMMUTABILITY',
      description: 'Audit logs must be strictly append-only and refuse modification or deletion.',
      passed: false,
      expectedStatus: 'AUDIT_IMMUTABILITY_VIOLATION',
      actualStatus: 'ALLOWED',
      message: 'FAIL: Modification not rejected.',
    });
  } catch (err: any) {
    const isImmutabilityError = err.message && err.message.includes('AUDIT_IMMUTABILITY_VIOLATION');
    results.push({
      id: 'SEC-P7-007',
      name: 'Audit Log Immutability Protection',
      category: 'IMMUTABILITY',
      description: 'Audit logs must be strictly append-only and refuse modification or deletion.',
      passed: isImmutabilityError,
      expectedStatus: 'AUDIT_IMMUTABILITY_VIOLATION',
      actualStatus: isImmutabilityError ? 'AUDIT_IMMUTABILITY_VIOLATION' : err.message,
      message: isImmutabilityError
        ? 'PASS: Audit log immutability verified with AUDIT_IMMUTABILITY_VIOLATION.'
        : `FAIL: Unexpected error: ${err.message}`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}
