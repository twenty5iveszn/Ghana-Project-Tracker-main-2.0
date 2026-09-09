import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { projectStore } from '../db/project_store';
import { VerificationStatus } from '../../src/types/project';
import { createFundingSchema, createCommitmentSchema, createTrancheSchema, createDisbursementSchema, createExpenditureSchema } from '../../src/lib/validation/project';

const router = Router();

// Protect all admin endpoints with authentication
router.use(requireAuth());

/**
 * GET /api/admin/metrics
 * Returns real-time metrics across projects, reports, evidence, comments, and recent audits
 * scoped by officer jurisdiction.
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = projectStore.getAdminMetrics(req.profile);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve admin metrics',
      },
    });
  }
});

const fiscalManagers = ['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];
const fiscalError = (err: unknown) => {
  const message = err instanceof Error ? err.message : 'Fiscal operation failed';
  const status = message.includes('FORBIDDEN') ? 403 : message.includes('NOT_FOUND') ? 404 : message.includes('EXCEEDS') || message.includes('MISMATCH') || message.includes('DUPLICATE') ? 409 : 400;
  return { status, body: { success: false, error: { code: message, message } } };
};

function requireFiscalManager(req: Request, res: Response): boolean {
  if (!fiscalManagers.includes(req.profile!.role)) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROLE', message: 'This role cannot manage fiscal records.' } }); return false; }
  return true;
}

router.get('/finance/:projectId', (req: Request, res: Response) => {
  try { res.json({ success: true, data: projectStore.getProjectFiscalRecords(req.params.projectId, req.profile) }); }
  catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.get('/finance-summary', (req: Request, res: Response) => {
  try {
    const query = req.query;
    res.json({ success: true, data: projectStore.getFiscalAnalytics(req.profile, {
      region: typeof query.region === 'string' ? query.region : undefined,
      district: typeof query.district === 'string' ? query.district : undefined,
      community: typeof query.community === 'string' ? query.community : undefined,
      category: typeof query.category === 'string' ? query.category : undefined,
      contractor: typeof query.contractor === 'string' ? query.contractor : undefined,
      status: typeof query.status === 'string' ? query.status as any : undefined,
      fiscal_year: typeof query.fiscal_year === 'string' && /^\d{4}$/.test(query.fiscal_year) ? Number(query.fiscal_year) : undefined,
      funding_source: typeof query.funding_source === 'string' ? query.funding_source : undefined,
      search: typeof query.search === 'string' ? query.search : undefined,
    }) });
  }
  catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.get('/inspections', (req: Request, res: Response) => {
  const allowed = ['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];
  if (!allowed.includes(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'INSPECTION_REVIEW_FORBIDDEN', message: 'Inspection review is not available to this role.' } });
  const data = projectStore.listFieldInspections({ actor: req.profile!, verificationStatus: typeof req.query.status === 'string' ? req.query.status : undefined });
  res.json({ success: true, data });
});

router.post('/inspections/:id/review', (req: Request, res: Response) => {
  const allowed = ['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];
  if (!allowed.includes(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'INSPECTION_REVIEW_FORBIDDEN', message: 'Inspection review is not available to this role.' } });
  const status = req.body.status === 'VERIFIED' || req.body.status === 'REJECTED' || req.body.status === 'UNDER_REVIEW' ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: { code: 'INVALID_REVIEW_STATUS', message: 'Status must be UNDER_REVIEW, VERIFIED, or REJECTED.' } });
  try { res.json({ success: true, data: projectStore.reviewFieldInspection(req.params.id, status, typeof req.body.notes === 'string' ? req.body.notes : null, req.profile!) }); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : 'Inspection review failed'; res.status(message.includes('FORBIDDEN') ? 403 : 404).json({ success: false, error: { code: message, message } }); }
});

router.post('/funding', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const parsed = createFundingSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_FISCAL_DATA', details: parsed.error.flatten().fieldErrors } });
  try { res.status(201).json({ success: true, data: projectStore.createFunding(req.body.project_id, parsed.data, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/commitments', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const parsed = createCommitmentSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_FISCAL_DATA', details: parsed.error.flatten().fieldErrors } });
  try { res.status(201).json({ success: true, data: projectStore.createCommitment(req.body.project_id, parsed.data, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/tranches', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const parsed = createTrancheSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_FISCAL_DATA', details: parsed.error.flatten().fieldErrors } });
  try { res.status(201).json({ success: true, data: projectStore.createTranche(req.body.project_id, parsed.data, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/disbursements', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const parsed = createDisbursementSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_FISCAL_DATA', details: parsed.error.flatten().fieldErrors } });
  try { res.status(201).json({ success: true, data: projectStore.createDisbursement(req.body.project_id, parsed.data, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/expenditures', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const parsed = createExpenditureSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_FISCAL_DATA', details: parsed.error.flatten().fieldErrors } });
  try { res.status(201).json({ success: true, data: projectStore.createExpenditure(req.body.project_id, parsed.data, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/expenditures/:id/verify', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  const status = req.body.status === 'REJECTED' ? 'REJECTED' : req.body.status === 'VERIFIED' ? 'VERIFIED' : null; if (!status) return res.status(400).json({ success: false, error: { code: 'INVALID_VERIFICATION_STATUS', message: 'Status must be VERIFIED or REJECTED.' } });
  try { res.json({ success: true, data: projectStore.verifyExpenditure(req.params.id, status, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

router.post('/disbursements/:id/reverse', (req: Request, res: Response) => {
  if (!requireFiscalManager(req, res)) return;
  try { res.json({ success: true, data: projectStore.reverseDisbursement(req.params.id, req.profile!) }); } catch (err: unknown) { const result = fiscalError(err); res.status(result.status).json(result.body); }
});

/**
 * GET /api/admin/submissions
 * Project verification and review queue with jurisdiction scoping and status filtering.
 */
router.get('/submissions', (req: Request, res: Response) => {
  try {
    const {
      status,
      verification_status,
      region_id,
      district_id,
      category_id,
      search,
      page = '1',
      limit = '10',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query as Record<string, string>;

    const officer = req.profile!;

    // Enforce jurisdiction boundaries
    let enforcedRegionId = region_id;
    let enforcedDistrictId = district_id;

    if (officer.role === 'MMDCE_OFFICER') {
      enforcedDistrictId = officer.district_id || undefined;
    } else if (officer.role === 'REGIONAL_OFFICER') {
      enforcedRegionId = officer.region_id || undefined;
    }

    const filters: any = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      search,
      category_id,
      region_id: enforcedRegionId,
      district_id: enforcedDistrictId,
      sort_by: (sort_by as any) || 'created_at',
      sort_order: (sort_order as any) || 'desc',
    };

    if (verification_status) {
      filters.verification_status = verification_status as VerificationStatus;
    }

    const result = projectStore.listProjects(filters);

    res.json({
      success: true,
      data: result.projects,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMISSIONS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve project submissions',
      },
    });
  }
});

/**
 * GET /api/admin/evidence
 * Evidence moderation queue with status filter, type filter, and jurisdiction enforcement.
 */
router.get('/evidence', (req: Request, res: Response) => {
  try {
    const {
      status,
      evidence_type,
      search,
      region_id,
      district_id,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const result = projectStore.listAllEvidence({
      status,
      evidence_type,
      search,
      region_id,
      district_id,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12,
      actor: req.profile,
    });

    res.json({
      success: true,
      data: result.evidence,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EVIDENCE_QUEUE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve evidence moderation queue',
      },
    });
  }
});

/**
 * GET /api/admin/comments
 * Comments moderation queue for official review of community contributions.
 */
router.get('/comments', (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '15' } = req.query as Record<string, string>;

    const result = projectStore.listAllComments({
      status,
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 15,
      actor: req.profile,
    });

    res.json({
      success: true,
      data: result.comments,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENTS_QUEUE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve comments moderation queue',
      },
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * System-wide immutable audit trail inspection.
 */
router.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const { entity_type, action, search, page = '1', limit = '20' } = req.query as Record<string, string>;

    const result = projectStore.listAllAuditLogs({
      entity_type,
      action,
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUDIT_LOGS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve audit logs',
      },
    });
  }
});

/**
 * GET /api/admin/notifications
 * In-app notifications for authenticated user.
 */
router.get('/notifications', (req: Request, res: Response) => {
  try {
    const userId = req.profile?.id || 'usr-adm-001';
    const notifications = projectStore.listNotifications(userId);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve notifications',
      },
    });
  }
});

/**
 * PATCH /api/admin/notifications/:id/read
 * Mark notification as read.
 */
router.patch('/notifications/:id/read', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.profile?.id || 'usr-adm-001';
    const updated = projectStore.markNotificationAsRead(id, userId);

    res.json({
      success: updated,
      message: updated ? 'Notification marked as read' : 'Notification not found',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to update notification',
      },
    });
  }
});

/**
 * POST /api/admin/notifications/mark-all-read
 * Mark all user notifications as read.
 */
router.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  try {
    const userId = req.profile?.id || 'usr-adm-001';
    projectStore.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_CLEAR_FAILED',
        message: err instanceof Error ? err.message : 'Failed to mark notifications read',
      },
    });
  }
});

/**
 * =========================================================================
 * Phase 8: User Directory, RBAC Management, System Settings & Analytics
 * =========================================================================
 */

/**
 * GET /api/admin/users
 * Directory of platform users with role, jurisdiction, and status filtering.
 */
router.get('/users', (req: Request, res: Response) => {
  try {
    const {
      search,
      role,
      region_id,
      district_id,
      status,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const result = projectStore.listUsers({
      search,
      role: role as any,
      region_id,
      district_id,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      actor: req.profile,
    });

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'USERS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve user directory',
      },
    });
  }
});

/**
 * POST /api/admin/users
 * Provision new official user (Super Admin only).
 */
router.post('/users', (req: Request, res: Response) => {
  try {
    const actor = req.profile;
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { full_name, email, phone, role, region_id, district_id, organization, reason } = req.body;

    if (!full_name || !email || !role || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name, email, role, and justification reason are required.',
        },
      });
    }

    const newUser = projectStore.createUser(
      { full_name, email, phone, role, region_id, district_id, organization, reason },
      actor
    );

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User successfully created and audit logged',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to provision user';
    const status = msg.includes('SUPER_ADMIN_REQUIRED') ? 403 : msg.includes('USER_ALREADY_EXISTS') ? 409 : 400;
    res.status(status).json({
      success: false,
      error: { code: 'USER_CREATION_FAILED', message: msg },
    });
  }
});

/**
 * POST /api/admin/users/:id/role
 * Assign user role & jurisdiction (Super Admin only, self-escalation strictly blocked).
 */
router.post('/users/:id/role', (req: Request, res: Response) => {
  try {
    const actor = req.profile;
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { role, region_id, district_id, organization, reason } = req.body;

    if (!role || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role and justification reason are required to assign a role.',
        },
      });
    }

    const updatedUser = projectStore.assignUserRole(
      id,
      { role, region_id, district_id, organization, reason },
      actor
    );

    res.json({
      success: true,
      data: updatedUser,
      message: `User role successfully updated to ${role}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to assign role';
    const isForbidden = msg.includes('SUPER_ADMIN_REQUIRED') || msg.includes('SELF_ESCALATION_BLOCKED');
    res.status(isForbidden ? 403 : 400).json({
      success: false,
      error: { code: 'ROLE_ASSIGNMENT_FAILED', message: msg },
    });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Update account status (ACTIVE, SUSPENDED, DISABLED) (Super Admin only).
 */
router.patch('/users/:id/status', (req: Request, res: Response) => {
  try {
    const actor = req.profile;
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status and justification reason are required.',
        },
      });
    }

    const updatedUser = projectStore.updateUserStatus(id, status, reason, actor);

    res.json({
      success: true,
      data: updatedUser,
      message: `User account status updated to ${status}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update user status';
    const isForbidden = msg.includes('SUPER_ADMIN_REQUIRED') || msg.includes('SELF_STATUS_MODIFICATION_BLOCKED');
    res.status(isForbidden ? 403 : 400).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: msg },
    });
  }
});

/**
 * GET /api/admin/settings
 * Retrieve platform system configuration.
 */
router.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = projectStore.getSystemSettings(req.profile);
    res.json({
      success: true,
      data: settings,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve system configuration',
      },
    });
  }
});

/**
 * PATCH /api/admin/settings
 * Update platform system configuration (Super Admin only, audit logged).
 */
router.patch('/settings', (req: Request, res: Response) => {
  try {
    const actor = req.profile;
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { reason, ...updates } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A mandatory justification reason (at least 5 characters) is required to modify system settings.',
        },
      });
    }

    const updatedSettings = projectStore.updateSystemSettings(updates, reason, actor);

    res.json({
      success: true,
      data: updatedSettings,
      message: 'System settings successfully updated and audit logged',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update system settings';
    const isForbidden = msg.includes('SUPER_ADMIN_REQUIRED');
    res.status(isForbidden ? 403 : 400).json({
      success: false,
      error: { code: 'SETTINGS_UPDATE_FAILED', message: msg },
    });
  }
});

/**
 * GET /api/admin/analytics
 * Retrieve operational analytics scoped by jurisdiction and filtered by timeframe.
 */
router.get('/analytics', (req: Request, res: Response) => {
  try {
    const { range = 'all' } = req.query as { range?: '7d' | '30d' | '90d' | 'year' | 'all' };

    const analytics = projectStore.getOperationalAnalytics({
      range,
      actor: req.profile,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to compile operational analytics',
      },
    });
  }
});

/**
 * GET /api/admin/export
 * Secure CSV data export with jurisdiction scoping, permission check, and audit trail.
 */
router.get('/export', (req: Request, res: Response) => {
  try {
    const actor = req.profile;
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for data export' },
      });
    }

    const { resource = 'projects', status, verification_status } = req.query as Record<string, string>;

    if (!['projects', 'reports', 'evidence', 'audit_logs', 'users'].includes(resource)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESOURCE',
          message: 'Export resource must be one of: projects, reports, evidence, audit_logs, users',
        },
      });
    }

    const { filename, csv } = projectStore.exportDataToCSV(
      resource as any,
      { status, verification_status },
      actor
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    const isForbidden = msg.includes('FORBIDDEN_OPERATION');
    res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: msg },
    });
  }
});

/**
 * GET /api/admin/phase9-tests
 * Automated Phase 9 Mapping & Analytics Test Suite
 */
router.get('/phase9-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase9Tests } = await import('../tests/phase9_tests');
    const results = runPhase9Tests();
    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PHASE9_TESTS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to execute Phase 9 test suite',
      },
    });
  }
});

/**
 * GET /api/admin/phase10-tests
 * Contractor accountability aggregation and scope checks.
 */
router.get('/phase10-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase10Tests } = await import('../tests/phase10_tests');
    res.json({ success: true, data: runPhase10Tests() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'PHASE10_TESTS_FAILED', message: err instanceof Error ? err.message : 'Failed to execute Phase 10 test suite' } });
  }
});

router.get('/phase11-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase11Tests } = await import('../tests/phase11_tests');
    res.json({ success: true, data: runPhase11Tests() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'PHASE11_TESTS_FAILED', message: err instanceof Error ? err.message : 'Failed to execute Phase 11 test suite' } });
  }
});

router.get('/phase12-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase12Tests } = await import('../tests/phase12_tests');
    res.json({ success: true, data: runPhase12Tests() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'PHASE12_TESTS_FAILED', message: err instanceof Error ? err.message : 'Failed to execute Phase 12 test suite' } });
  }
});

export default router;
