import { projectStore } from '../db/project_store';
import { ProjectTestCase } from './project_tests';
import { Profile } from '../../src/types/user';

/**
 * Phase 6 Citizen Feedback, Community Reporting, Comments, Voting & Moderation Acceptance Test Suite
 */
export function runPhase6SecurityTests(): {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  cases: ProjectTestCase[];
} {
  const cases: ProjectTestCase[] = [];

  // Mock User Profiles for testing Phase 6
  const mockCitizenA: Profile = {
    id: 'usr-cit-p6-a',
    auth_user_id: 'auth-usr-cit-p6-a',
    email: 'citizen.kofi@ghanabuild.gov.gh',
    full_name: 'Kofi Mensah (Citizen)',
    role: 'CITIZEN',
    region_id: null,
    district_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCitizenB: Profile = {
    id: 'usr-cit-p6-b',
    auth_user_id: 'auth-usr-cit-p6-b',
    email: 'citizen.ama@ghanabuild.gov.gh',
    full_name: 'Ama Serwaa (Citizen)',
    role: 'CITIZEN',
    region_id: null,
    district_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockAccraOfficer: Profile = {
    id: 'usr-mmdce-accra-p6',
    auth_user_id: 'auth-usr-mmdce-accra-p6',
    email: 'kofi.officer@accrametro.gov.gh',
    full_name: 'Hon. Accra MMDCE Officer',
    role: 'MMDCE_OFFICER',
    region_id: 'REG-GAR-01',
    district_id: 'DIST-ACCRA-METRO',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockKumasiOfficer: Profile = {
    id: 'usr-mmdce-kumasi-p6',
    auth_user_id: 'auth-usr-mmdce-kumasi-p6',
    email: 'yaw.officer@kumasimetro.gov.gh',
    full_name: 'Hon. Kumasi MMDCE Officer',
    role: 'MMDCE_OFFICER',
    region_id: 'REG-ASHANTI-01',
    district_id: 'DIST-KUMASI-METRO',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockModerator: Profile = {
    id: 'usr-mod-p6',
    auth_user_id: 'auth-usr-mod-p6',
    email: 'moderator@ghanabuild.gov.gh',
    full_name: 'Civic Moderation Officer',
    role: 'MODERATOR',
    region_id: null,
    district_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let createdReportId = '';
  let createdCommentId = '';

  // TEST 1: Citizen Report Creation (Status OPEN)
  try {
    const result = projectStore.createReport(
      'PRJ-GAR-001',
      {
        report_type: 'SAFETY_CONCERN',
        severity: 'HIGH',
        description: 'Pedestrian guardrails are missing along the deep excavation trench near Pokuase interchange.',
        location_notes: 'Northbound carriageway KM 2+300',
        contact_phone: '+233 24 123 4567',
      },
      mockCitizenA
    );

    createdReportId = result.report.id;
    const isValid =
      result.report !== null &&
      result.report.status === 'OPEN' &&
      result.report.submitted_by === mockCitizenA.id &&
      result.report.project_id === 'PRJ-GAR-001';

    cases.push({
      id: 'P6-TEST-01',
      category: 'CITIZEN_REPORTING',
      name: 'Citizen Submits Community Issue Report (Status OPEN)',
      description: 'Verifies that authenticated citizens can submit issue reports that start in OPEN status',
      passed: isValid,
      httpStatusExpected: 201,
      httpStatusReceived: isValid ? 201 : 500,
      details: isValid
        ? `Passed: Report '${result.report.id}' created with status OPEN for project 'PRJ-GAR-001'`
        : 'Failed: Report not created or invalid status',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-01',
      category: 'CITIZEN_REPORTING',
      name: 'Citizen Submits Community Issue Report (Status OPEN)',
      description: 'Verifies that authenticated citizens can submit issue reports that start in OPEN status',
      passed: false,
      httpStatusExpected: 201,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 2: Report Input Validation (Short Description Rejection)
  try {
    let failedAsExpected = false;
    try {
      projectStore.createReport(
        'PRJ-GAR-001',
        {
          report_type: 'DELAYED',
          description: 'Too short',
        },
        mockCitizenA
      );
    } catch {
      failedAsExpected = true;
    }

    cases.push({
      id: 'P6-TEST-02',
      category: 'VALIDATION',
      name: 'Report Description Minimum Length Enforcement',
      description: 'Verifies reports with descriptions under 10 characters are rejected with validation error',
      passed: failedAsExpected,
      httpStatusExpected: 400,
      httpStatusReceived: failedAsExpected ? 400 : 200,
      details: failedAsExpected
        ? 'Passed: Under-length description rejected with validation error as required'
        : 'Failed: Invalid short description was erroneously accepted',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-02',
      category: 'VALIDATION',
      name: 'Report Description Minimum Length Enforcement',
      description: 'Verifies reports with descriptions under 10 characters are rejected with validation error',
      passed: false,
      httpStatusExpected: 400,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 3: Citizen Privacy Boundary (Access to Own Reports Only)
  try {
    const citizenAReports = projectStore.listReports('PRJ-GAR-001', {
      isOfficer: false,
      userId: mockCitizenA.id,
    });
    const citizenBReports = projectStore.listReports('PRJ-GAR-001', {
      isOfficer: false,
      userId: mockCitizenB.id,
    });

    const citizenASeesOwn = citizenAReports.reports.some((r) => r.id === createdReportId);
    const citizenBBlocked = !citizenBReports.reports.some((r) => r.id === createdReportId);
    const passed = citizenASeesOwn && citizenBBlocked;

    cases.push({
      id: 'P6-TEST-03',
      category: 'PRIVACY_RLS',
      name: 'Citizen Report Privacy Boundary (Submitter Isolation)',
      description: 'Verifies that citizens can only inspect their own submitted reports, blocking cross-citizen leak',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 403,
      details: passed
        ? `Passed: Citizen A saw own report '${createdReportId}', while Citizen B was isolated`
        : 'Failed: Submitter isolation failed; cross-citizen access permitted',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-03',
      category: 'PRIVACY_RLS',
      name: 'Citizen Report Privacy Boundary (Submitter Isolation)',
      description: 'Verifies that citizens can only inspect their own submitted reports, blocking cross-citizen leak',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 4: Citizen Forbidden from Resolving Reports
  try {
    let forbiddenCaught = false;
    try {
      projectStore.resolveReport(
        createdReportId,
        {
          status: 'RESOLVED',
          resolution_notes: 'Citizen attempting to resolve report unauthorized',
        },
        mockCitizenA
      );
    } catch (err: any) {
      if (err.message.includes('FORBIDDEN') || err.message.includes('Citizens cannot resolve')) {
        forbiddenCaught = true;
      }
    }

    cases.push({
      id: 'P6-TEST-04',
      category: 'RBAC_SECURITY',
      name: 'Citizen Forbidden from Resolving Community Reports',
      description: 'Ensures ordinary citizens cannot resolve or modify the status of community reports',
      passed: forbiddenCaught,
      httpStatusExpected: 403,
      httpStatusReceived: forbiddenCaught ? 403 : 200,
      details: forbiddenCaught
        ? 'Passed: Unauthorized resolution attempt by citizen was correctly denied with 403 FORBIDDEN'
        : 'Failed: Citizen was permitted to resolve an official report',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-04',
      category: 'RBAC_SECURITY',
      name: 'Citizen Forbidden from Resolving Community Reports',
      description: 'Ensures ordinary citizens cannot resolve or modify the status of community reports',
      passed: false,
      httpStatusExpected: 403,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 5: MMDCE Officer Jurisdiction Boundary Enforcement (JBAC)
  try {
    let mismatchCaught = false;
    try {
      // PRJ-GAR-001 is in Accra Metro (DIST-ACCRA-METRO). Kumasi officer should be rejected!
      projectStore.resolveReport(
        createdReportId,
        {
          status: 'RESOLVED',
          resolution_notes: 'Kumasi officer attempting cross-district resolution in Accra',
        },
        mockKumasiOfficer
      );
    } catch (err: any) {
      if (err.message.includes('JURISDICTION_MISMATCH')) {
        mismatchCaught = true;
      }
    }

    cases.push({
      id: 'P6-TEST-05',
      category: 'JBAC_SECURITY',
      name: 'MMDCE Cross-District Report Resolution Blocked',
      description: 'Verifies that MMDCE officers cannot resolve reports outside their assigned municipal district',
      passed: mismatchCaught,
      httpStatusExpected: 403,
      httpStatusReceived: mismatchCaught ? 403 : 200,
      details: mismatchCaught
        ? 'Passed: Kumasi MMDCE officer blocked from resolving Accra project report with JURISDICTION_MISMATCH'
        : 'Failed: Cross-jurisdiction resolution was erroneously permitted',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-05',
      category: 'JBAC_SECURITY',
      name: 'MMDCE Cross-District Report Resolution Blocked',
      description: 'Verifies that MMDCE officers cannot resolve reports outside their assigned municipal district',
      passed: false,
      httpStatusExpected: 403,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 6: Authorized MMDCE Officer In Jurisdiction Resolves Report
  try {
    const resolveResult = projectStore.resolveReport(
      createdReportId,
      {
        status: 'RESOLVED',
        resolution_notes: 'MMDA field engineering team dispatched to site. 150m temporary orange safety barriers erected immediately.',
      },
      mockAccraOfficer
    );

    const isResolved =
      resolveResult.report.status === 'RESOLVED' &&
      resolveResult.report.resolved_by === mockAccraOfficer.id &&
      Boolean(resolveResult.report.resolution_notes);

    cases.push({
      id: 'P6-TEST-06',
      category: 'JBAC_RESOLUTION',
      name: 'Authorized MMDCE Officer Resolves Report In Jurisdiction',
      description: 'Verifies that MMDCE officer in jurisdiction successfully resolves report and stores resolution notes',
      passed: isResolved,
      httpStatusExpected: 200,
      httpStatusReceived: isResolved ? 200 : 500,
      details: isResolved
        ? `Passed: Accra officer resolved report '${createdReportId}' with note: '${resolveResult.report.resolution_notes?.slice(0, 45)}...'`
        : 'Failed: Report resolution failed or status was not updated',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-06',
      category: 'JBAC_RESOLUTION',
      name: 'Authorized MMDCE Officer Resolves Report In Jurisdiction',
      description: 'Verifies that MMDCE officer in jurisdiction successfully resolves report and stores resolution notes',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 7: Public Privacy Summary Anonymization
  try {
    const summary = projectStore.getReportsSummary('PRJ-GAR-001');
    const isValidSummary =
      summary.total_reports > 0 &&
      summary.resolved_reports > 0 &&
      typeof summary.by_type === 'object' &&
      !('submitted_by' in summary) &&
      !('contact_phone' in summary);

    cases.push({
      id: 'P6-TEST-07',
      category: 'PRIVACY_SAFE_PUBLIC',
      name: 'Public Reports Summary Aggregates Anonymously',
      description: 'Verifies that public summary aggregates metrics without exposing citizen PII or contact info',
      passed: isValidSummary,
      httpStatusExpected: 200,
      httpStatusReceived: isValidSummary ? 200 : 500,
      details: isValidSummary
        ? `Passed: Summary contains ${summary.total_reports} total reports (${summary.resolved_reports} resolved) with zero PII exposure`
        : 'Failed: Summary aggregation missing or contaminated with private PII',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-07',
      category: 'PRIVACY_SAFE_PUBLIC',
      name: 'Public Reports Summary Aggregates Anonymously',
      description: 'Verifies that public summary aggregates metrics without exposing citizen PII or contact info',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 8: Civic Comment Creation with Validation
  try {
    const commentResult = projectStore.createComment(
      'PRJ-GAR-001',
      'The new road shoulders have significantly improved vehicular turnaround time.',
      mockCitizenA
    );
    createdCommentId = commentResult.comment.id;
    const isValidComment =
      commentResult.comment.status === 'PUBLISHED' &&
      commentResult.comment.user_id === mockCitizenA.id &&
      commentResult.comment.project_id === 'PRJ-GAR-001';

    cases.push({
      id: 'P6-TEST-08',
      category: 'COMMUNITY_DISCUSSION',
      name: 'Citizen Posts Valid Project Comment',
      description: 'Verifies authenticated citizen can post comments and default status is PUBLISHED',
      passed: isValidComment,
      httpStatusExpected: 201,
      httpStatusReceived: isValidComment ? 201 : 500,
      details: isValidComment
        ? `Passed: Comment '${createdCommentId}' created with status PUBLISHED`
        : 'Failed: Comment creation failed',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-08',
      category: 'COMMUNITY_DISCUSSION',
      name: 'Citizen Posts Valid Project Comment',
      description: 'Verifies authenticated citizen can post comments and default status is PUBLISHED',
      passed: false,
      httpStatusExpected: 201,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 9: Automated Civic Decency Moderation Filter
  try {
    const abusiveComment = projectStore.createComment(
      'PRJ-GAR-001',
      'This entire project is a fraudulent scam by politicians to steal our money.',
      mockCitizenB
    );

    const isFlagged = abusiveComment.comment.status === 'FLAGGED';

    cases.push({
      id: 'P6-TEST-09',
      category: 'CIVIC_MODERATION',
      name: 'Automated Civic Decency Moderation Filter',
      description: 'Verifies comments containing abusive or defamatory phrases are automatically marked FLAGGED',
      passed: isFlagged,
      httpStatusExpected: 201,
      httpStatusReceived: isFlagged ? 201 : 500,
      details: isFlagged
        ? `Passed: Abusive comment '${abusiveComment.comment.id}' flagged automatically (${abusiveComment.comment.flag_reason})`
        : 'Failed: Abusive comment bypassed moderation filter',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-09',
      category: 'CIVIC_MODERATION',
      name: 'Automated Civic Decency Moderation Filter',
      description: 'Verifies comments containing abusive or defamatory phrases are automatically marked FLAGGED',
      passed: false,
      httpStatusExpected: 201,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 10: Public Comment Visibility (Only PUBLISHED Comments Visible)
  try {
    const publicComments = projectStore.listComments('PRJ-GAR-001', { isModerator: false });
    const allPublished = publicComments.comments.every((c) => c.status === 'PUBLISHED');
    const flaggedHidden = !publicComments.comments.some((c) => c.status === 'FLAGGED');
    const passed = allPublished && flaggedHidden;

    cases.push({
      id: 'P6-TEST-10',
      category: 'CONTENT_VISIBILITY',
      name: 'Public Comment Query Filters Out Unmoderated Comments',
      description: 'Verifies public comment list strictly includes PUBLISHED comments and excludes FLAGGED content',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 500,
      details: passed
        ? `Passed: All ${publicComments.total} public comments are PUBLISHED; flagged comments safely hidden`
        : 'Failed: Flagged comments are leaking into public view',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-10',
      category: 'CONTENT_VISIBILITY',
      name: 'Public Comment Query Filters Out Unmoderated Comments',
      description: 'Verifies public comment list strictly includes PUBLISHED comments and excludes FLAGGED content',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 11: Moderator Moderates Comment
  try {
    const modResult = projectStore.moderateComment(
      createdCommentId,
      'FLAG',
      mockModerator,
      'Administrative review of comment wording'
    );
    const passed = modResult.comment.status === 'FLAGGED';

    // Restore to PUBLISHED for remaining tests
    projectStore.moderateComment(createdCommentId, 'PUBLISH', mockModerator);

    cases.push({
      id: 'P6-TEST-11',
      category: 'MODERATOR_CONTROLS',
      name: 'Authorized Moderator Can Change Comment Status',
      description: 'Verifies system moderators can flag, publish, or remove comments across projects',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 403,
      details: passed
        ? `Passed: Moderator changed comment '${createdCommentId}' status to FLAGGED, then restored to PUBLISHED`
        : 'Failed: Moderator action failed',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-11',
      category: 'MODERATOR_CONTROLS',
      name: 'Authorized Moderator Can Change Comment Status',
      description: 'Verifies system moderators can flag, publish, or remove comments across projects',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 12: Civic Priority Upvoting
  try {
    const voteResult = projectStore.castVote('PRJ-GAR-001', 'UPVOTE', mockCitizenA);
    const passed =
      voteResult.summary.upvotes > 0 &&
      voteResult.summary.user_vote === 'UPVOTE';

    cases.push({
      id: 'P6-TEST-12',
      category: 'CIVIC_PRIORITY_VOTING',
      name: 'Citizen Casts Civic Priority Upvote',
      description: 'Verifies citizen can cast UPVOTE on a project and summary accurately reflects vote state',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 500,
      details: passed
        ? `Passed: Citizen upvoted PRJ-GAR-001 (Total upvotes: ${voteResult.summary.upvotes}, Score: ${voteResult.summary.priority_score})`
        : 'Failed: Upvote not recorded',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-12',
      category: 'CIVIC_PRIORITY_VOTING',
      name: 'Citizen Casts Civic Priority Upvote',
      description: 'Verifies citizen can cast UPVOTE on a project and summary accurately reflects vote state',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 13: Single Vote Per User (Toggle / Toggle-Off)
  try {
    // Casting UPVOTE again toggles it off
    const toggleResult = projectStore.castVote('PRJ-GAR-001', 'UPVOTE', mockCitizenA);
    const isToggledOff = toggleResult.actionTaken === 'REMOVED' && toggleResult.summary.user_vote === null;

    // Casting DOWNVOTE records DOWNVOTE
    const downvoteResult = projectStore.castVote('PRJ-GAR-001', 'DOWNVOTE', mockCitizenA);
    const isDownvoted = downvoteResult.summary.user_vote === 'DOWNVOTE';

    const passed = isToggledOff && isDownvoted;

    cases.push({
      id: 'P6-TEST-13',
      category: 'VOTE_CONSTRAINTS',
      name: 'Single Vote Per User Constraint (Toggle & Switch)',
      description: 'Verifies unique user vote constraint uq_project_user_vote, supporting toggle-off and vote switching',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 500,
      details: passed
        ? 'Passed: Repeat click toggled vote off; switching to DOWNVOTE updated vote without duplicating'
        : 'Failed: Vote toggling or unique constraint violated',
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-13',
      category: 'VOTE_CONSTRAINTS',
      name: 'Single Vote Per User Constraint (Toggle & Switch)',
      description: 'Verifies unique user vote constraint uq_project_user_vote, supporting toggle-off and vote switching',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  // TEST 14: Immutable Audit Logging for Citizen Feedback & Resolution
  try {
    const logs = projectStore.getAuditLogs();
    const hasReportLog = logs.some((l) => l.entity_type === 'PROJECT_REPORT' && l.action === 'REPORT_SUBMITTED');
    const hasResolutionLog = logs.some((l) => l.entity_type === 'PROJECT_REPORT' && (l.action === 'REPORT_RESOLVED' || l.action === 'REPORT_STATUS_UPDATED'));
    const hasCommentLog = logs.some((l) => l.entity_type === 'PROJECT_COMMENT');
    const hasVoteLog = logs.some((l) => l.entity_type === 'PROJECT_VOTE');

    const passed = hasReportLog && hasResolutionLog && hasCommentLog && hasVoteLog;

    cases.push({
      id: 'P6-TEST-14',
      category: 'AUDIT_COMPLIANCE',
      name: 'Audit Trail for Citizen Reports, Resolution, Comments & Votes',
      description: 'Verifies that every Phase 6 community action triggers append-only immutable audit log entries',
      passed,
      httpStatusExpected: 200,
      httpStatusReceived: passed ? 200 : 500,
      details: passed
        ? `Passed: Audit trail contains report submitted, report resolution, comment, and vote records`
        : `Failed: Missing audit log entries (ReportLog=${hasReportLog}, ResolutionLog=${hasResolutionLog}, CommentLog=${hasCommentLog}, VoteLog=${hasVoteLog})`,
    });
  } catch (err: any) {
    cases.push({
      id: 'P6-TEST-14',
      category: 'AUDIT_COMPLIANCE',
      name: 'Audit Trail for Citizen Reports, Resolution, Comments & Votes',
      description: 'Verifies that every Phase 6 community action triggers append-only immutable audit log entries',
      passed: false,
      httpStatusExpected: 200,
      httpStatusReceived: 500,
      details: `Failed: ${err.message}`,
    });
  }

  const passedCount = cases.filter((c) => c.passed).length;

  return {
    suite: 'Phase 6: Citizen Feedback, Community Reporting, Comments, Voting & Moderation Engine',
    total: cases.length,
    passed: passedCount,
    failed: cases.length - passedCount,
    allPassed: passedCount === cases.length,
    cases,
  };
}
