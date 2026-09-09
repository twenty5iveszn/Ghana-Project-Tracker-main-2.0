import { Router, Request, Response } from 'express';
import { projectStore } from '../db/project_store';
import { createProjectReportSchema, resolveProjectReportSchema } from '../../src/lib/validation/project';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/reports
 * List reports across jurisdiction for officers, or submitted reports for citizens
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const user = req.profile;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to view community reports',
        },
      });
    }

    const isOfficer = ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'].includes(
      user.role
    );

    const { status, severity, project_id, page, limit } = req.query;

    const pageNum = page ? Math.max(1, parseInt(page as string, 10) || 1) : 1;
    const limitNum = limit ? Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10)) : 10;

    const result = projectStore.listReports(project_id as string | undefined, {
      isOfficer,
      officerProfile: isOfficer ? user : undefined,
      userId: !isOfficer ? user.id : undefined,
      status: status as string | undefined,
      severity: severity as string | undefined,
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: result.reports,
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
        code: 'REPORTS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve reports',
      },
    });
  }
});

/**
 * GET /api/reports/:id
 * Retrieve a specific report by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = projectStore.getReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: `Report '${id}' not found`,
        },
      });
    }

    // Privacy check
    const user = req.profile;
    const isOfficer = user && ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'].includes(user.role);
    const isOwner = user && user.id === report.submitted_by;

    if (!isOfficer && !isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this report details',
        },
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve report',
      },
    });
  }
});

/**
 * POST /api/reports
 * Global citizen issue report submission
 */
router.post('/', requireAuth, (req: Request, res: Response) => {
  try {
    const user = req.profile!;
    const { project_id, ...reportData } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'Project ID is required to file a report',
        },
      });
    }

    const valResult = createProjectReportSchema.safeParse(reportData);
    if (!valResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid report data provided',
          details: valResult.error.format(),
        },
      });
    }

    const { report } = projectStore.createReport(project_id, valResult.data, user);

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    const isNotFound = err.message?.includes('PROJECT_NOT_FOUND');
    const isValidation = err.message?.includes('VALIDATION_ERROR');

    res.status(isNotFound ? 404 : isValidation ? 400 : 500).json({
      success: false,
      error: {
        code: isNotFound ? 'PROJECT_NOT_FOUND' : isValidation ? 'VALIDATION_ERROR' : 'REPORT_SUBMISSION_FAILED',
        message: err.message || 'Failed to submit report',
      },
    });
  }
});

/**
 * PATCH /api/reports/:id/resolve
 * Officer in jurisdiction resolves an issue report
 */
router.patch('/:id/resolve', requireAuth, (req: Request, res: Response) => {
  try {
    const user = req.profile!;
    const { id } = req.params;

    const valResult = resolveProjectReportSchema.safeParse(req.body);
    if (!valResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid resolution payload provided',
          details: valResult.error.format(),
        },
      });
    }

    const { report } = projectStore.resolveReport(id, valResult.data, user);

    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN');
    const isMismatch = err.message?.includes('JURISDICTION_MISMATCH');
    const isNotFound = err.message?.includes('REPORT_NOT_FOUND');
    const isValidation = err.message?.includes('VALIDATION_ERROR');

    const status = isNotFound ? 404 : isForbidden || isMismatch ? 403 : isValidation ? 400 : 500;
    const code = isNotFound
      ? 'REPORT_NOT_FOUND'
      : isForbidden
      ? 'FORBIDDEN'
      : isMismatch
      ? 'JURISDICTION_MISMATCH'
      : isValidation
      ? 'VALIDATION_ERROR'
      : 'REPORT_RESOLUTION_FAILED';

    res.status(status).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to resolve report',
      },
    });
  }
});

export default router;
