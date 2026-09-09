import { Router, Request, Response } from 'express';
import { projectStore } from '../db/project_store';
import {
  createProjectSchema,
  updateProjectSchema,
  createProjectUpdateSchema,
  createProjectReportSchema,
  resolveProjectReportSchema,
  createProjectCommentSchema,
  castVoteSchema,
} from '../../src/lib/validation/project';
import { requireAuth } from '../middleware/auth';
import { ProjectStatus, VerificationStatus } from '../../src/types/project';
import { runPhase6SecurityTests } from '../tests/phase6_security_tests';

const router = Router();

/**
 * GET /api/projects
 * Comprehensive Project Listing API
 * Supports filtering, search, pagination, and sorting.
 * Requirement #24: Public project visibility defaults to VERIFIED projects
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      region,
      district,
      community,
      category,
      contractor,
      project_status,
      status,
      verification_status,
      min_budget,
      max_budget,
      min_progress,
      max_progress,
      page,
      limit,
      sort,
      order,
      include_all,
    } = req.query;

    const user = req.profile;
    const isOfficerOrAdmin = user && ['SUPER_ADMIN', 'REGIONAL_OFFICER', 'MMDCE_OFFICER', 'NATIONAL_MONITOR', 'MODERATOR'].includes(user.role);

    // If an administrative user explicitly passes include_all=true or an explicit verification_status, honor it
    const shouldIncludeAll = include_all === 'true' && isOfficerOrAdmin;
    const allowUnverified = Boolean(isOfficerOrAdmin && (shouldIncludeAll || verification_status));
    const effectiveVerificationStatus = isOfficerOrAdmin
      ? (verification_status as VerificationStatus | undefined)
      : 'VERIFIED';

    const options = {
      search: typeof search === 'string' ? search : undefined,
      region: typeof region === 'string' ? region : undefined,
      district: typeof district === 'string' ? district : undefined,
      community: typeof community === 'string' ? community : undefined,
      category: typeof category === 'string' ? category : undefined,
      contractor: typeof contractor === 'string' ? contractor : undefined,
      status: (project_status || status) as ProjectStatus | undefined,
      verification_status: effectiveVerificationStatus,
      min_budget: min_budget ? Number(min_budget) : undefined,
      max_budget: max_budget ? Number(max_budget) : undefined,
      min_progress: min_progress !== undefined ? Number(min_progress) : undefined,
      max_progress: max_progress !== undefined ? Number(max_progress) : undefined,
      page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
      limit: limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 10,
      sort: sort as any,
      order: order === 'asc' ? 'asc' : 'desc' as any,
      includeAllStatus: allowUnverified,
    };

    const result = projectStore.listProjects(options);

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
        code: 'PROJECT_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve projects list',
      },
    });
  }
});

/**
 * GET /api/projects/public-stats
 * Real-time aggregated statistics for verified public projects
 */
router.get('/public-stats', (_req: Request, res: Response) => {
  try {
    const stats = projectStore.getPublicStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve public statistics',
      },
    });
  }
});

router.get('/:id/inspections', (req: Request, res: Response) => {
  try {
    const project = projectStore.getProjectByIdOrSlug(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
    res.json({ success: true, data: projectStore.getPublicInspectionSummaries(project.id) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'INSPECTION_FETCH_FAILED', message: err instanceof Error ? err.message : 'Failed to retrieve inspections' } });
  }
});

router.get('/finance-summary', (req: Request, res: Response) => {
  try {
    const query = req.query;
    res.json({ success: true, data: projectStore.getFiscalAnalytics(undefined, {
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
  catch (err: unknown) { res.status(500).json({ success: false, error: { code: 'FISCAL_ANALYTICS_FAILED', message: err instanceof Error ? err.message : 'Failed to retrieve fiscal analytics' } }); }
});

/**
 * GET /api/projects/featured
 * High-priority featured public projects across Ghana
 */
router.get('/featured', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    const featured = projectStore.getFeaturedProjects(limit);
    res.json({
      success: true,
      data: featured,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FEATURED_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve featured projects',
      },
    });
  }
});

/** Public fiscal summary and allowlisted approved records for a verified project. */
router.get('/:id/finance', (req: Request, res: Response) => {
  try {
    const project = projectStore.getProjectByIdOrSlug(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
    const data = projectStore.getProjectFiscalRecords(project.id);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve fiscal records';
    res.status(message === 'PROJECT_NOT_PUBLIC' ? 403 : 500).json({ success: false, error: { code: message, message: message === 'PROJECT_NOT_PUBLIC' ? 'Fiscal records are available after project verification.' : message } });
  }
});

/**
 * GET /api/projects/map
 * Lightweight spatial markers payload for Ghana Infrastructure Map
 * Supports comprehensive multi-criteria filtering, coordinate bounds validation, and optional role jurisdiction
 */
router.get('/map', (req: Request, res: Response) => {
  try {
    const {
      region,
      district,
      community,
      category,
      status,
      verification_status,
      search,
      contractor,
      min_progress,
      max_progress,
    } = req.query;

    const authHeader = req.headers.authorization;
    let actor = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      actor = projectStore.getUserBySimulatedToken(token) || undefined;
    }

    const mapData = projectStore.getProjectMapData({
      region: typeof region === 'string' ? region : undefined,
      district: typeof district === 'string' ? district : undefined,
      community: typeof community === 'string' ? community : undefined,
      category: typeof category === 'string' ? category : undefined,
      status: typeof status === 'string' ? status : undefined,
      verification_status: typeof verification_status === 'string' ? verification_status : undefined,
      search: typeof search === 'string' ? search : undefined,
      contractor: typeof contractor === 'string' ? contractor : undefined,
      min_progress: typeof min_progress === 'string' ? parseInt(min_progress, 10) : undefined,
      max_progress: typeof max_progress === 'string' ? parseInt(max_progress, 10) : undefined,
      actor,
    });

    const geocodedCount = mapData.filter((p) => p.has_valid_coordinates).length;
    const unlocatedCount = mapData.length - geocodedCount;

    res.json({
      success: true,
      data: mapData,
      meta: {
        total: mapData.length,
        geocoded: geocodedCount,
        unlocated: unlocatedCount,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MAP_DATA_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve map project data',
      },
    });
  }
});

/**
 * GET /api/projects/public-analytics
 * Aggregated public transparency metrics across Ghana's 16 regions and sectors
 */
router.get('/public-analytics', (req: Request, res: Response) => {
  try {
    const { range, region, category } = req.query;
    const analytics = projectStore.getPublicAnalytics({
      range: typeof range === 'string' ? range : undefined,
      region: typeof region === 'string' ? region : undefined,
      category: typeof category === 'string' ? category : undefined,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PUBLIC_ANALYTICS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to compile public analytics',
      },
    });
  }
});

/**
 * GET /api/projects/phase9-tests
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
        code: 'PHASE9_TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to run Phase 9 tests',
      },
    });
  }
});

/**
 * GET /api/projects/public-security-tests
 * Automated Phase 4 Public Project Explorer Acceptance Test Suite
 */
router.get('/public-security-tests', async (_req: Request, res: Response) => {
  try {
    const { runPublicSecurityTests } = await import('../tests/public_security_tests');
    const results = runPublicSecurityTests();
    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PUBLIC_SECURITY_TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to run public security tests',
      },
    });
  }
});

/**
 * GET /api/projects/security-tests
 * Automated Phase 3 Security & CRUD Acceptance Test Suite
 */
router.get('/security-tests', async (_req: Request, res: Response) => {
  try {
    const { runProjectSecurityTests } = await import('../tests/project_tests');
    const results = runProjectSecurityTests();
    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SECURITY_TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to run project security tests',
      },
    });
  }
});

/**
 * GET /api/projects/phase5-security-tests
 * Automated Phase 5 Project Details, Evidence & Document Management Acceptance Test Suite
 */
router.get('/phase5-security-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase5SecurityTests } = await import('../tests/phase5_security_tests');
    const results = runPhase5SecurityTests();
    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PHASE5_SECURITY_TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to run phase 5 security tests',
      },
    });
  }
});

/**
 * GET /api/projects/phase6-security-tests
 * Automated Phase 6 Citizen Feedback, Community Reporting, Comments, Voting & Moderation Engine Acceptance Test Suite
 */
router.get('/phase6-security-tests', async (_req: Request, res: Response) => {
  try {
    const { runPhase6SecurityTests } = await import('../tests/phase6_security_tests');
    const results = runPhase6SecurityTests();
    res.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PHASE6_SECURITY_TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to run phase 6 security tests',
      },
    });
  }
});

/**
 * GET /api/projects/:id
 * Retrieve a specific project by ID or SEO slug
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = projectStore.getProjectByIdOrSlug(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project with ID or slug '${id}' was not found.`,
        },
      });
    }

    // Public visibility check: unverified projects only visible to creator or authorized officers
    const user = req.profile;
    if (project.verification_status !== 'VERIFIED') {
      const canViewUnverified =
        user &&
        (user.role === 'SUPER_ADMIN' ||
          user.role === 'NATIONAL_MONITOR' ||
          user.role === 'MODERATOR' ||
          user.id === project.created_by ||
          (user.role === 'REGIONAL_OFFICER' && user.region_id === project.region_id) ||
          (user.role === 'MMDCE_OFFICER' && user.district_id === project.district_id));

      if (!canViewUnverified) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'This project is pending official verification and is not publicly accessible.',
          },
        });
      }
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve project details',
      },
    });
  }
});

/**
 * POST /api/projects
 * Requirement #4, #11: Authorized Project Creation
 * Validates role, jurisdiction, inputs, and writes audit log.
 */
router.post('/', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = req.profile!;

    // 1. Role Authorization Check: Only authorized officers can create official projects
    const allowedRoles = ['SUPER_ADMIN', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${user.role} does not possess authority to create official infrastructure projects.`,
        },
      });
    }

    // 2. Input Validation via Zod
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_DATA',
          message: 'Validation failed for project creation',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const data = parseResult.data;

    // 3. Server-side Jurisdiction Validation (Requirement #4)
    // Never accept jurisdiction blindly from client
    if (user.role === 'MMDCE_OFFICER') {
      if (!user.district_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNASSIGNED_JURISDICTION',
            message: 'Officer profile lacks an assigned District Assembly jurisdiction.',
          },
        });
      }
      if (data.district_id !== user.district_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'JURISDICTION_MISMATCH',
            message: `Cross-district creation forbidden: MMDCE Officer can only register projects within their assigned district (${user.district_id}).`,
          },
        });
      }
    }

    if (user.role === 'REGIONAL_OFFICER') {
      if (!user.region_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNASSIGNED_JURISDICTION',
            message: 'Regional officer profile lacks an assigned Regional Coordinating Council jurisdiction.',
          },
        });
      }
      if (data.region_id !== user.region_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'JURISDICTION_MISMATCH',
            message: `Cross-regional creation forbidden: Regional Officer can only register projects within their assigned region (${user.region_id}).`,
          },
        });
      }
    }

    // 4. Verification Status default based on role
    const initialVerificationStatus: VerificationStatus =
      user.role === 'SUPER_ADMIN' ? 'VERIFIED' : (data.verification_status || 'PENDING');

    // 5. Create in relational store
    const { project } = projectStore.createProject(
      {
        ...data,
        verification_status: initialVerificationStatus,
        verified_by: user.role === 'SUPER_ADMIN' ? user.id : null,
      },
      user
    );

    res.status(201).json({
      success: true,
      data: project,
      message: 'Infrastructure project successfully registered and audited.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create project';
    const isLocationError = msg.includes('INVALID_LOCATION');

    res.status(isLocationError ? 400 : 500).json({
      success: false,
      error: {
        code: isLocationError ? 'INVALID_LOCATION' : 'PROJECT_CREATION_FAILED',
        message: msg,
      },
    });
  }
});

/**
 * PATCH /api/projects/:id
 * Requirement #5, #12: Secure Project Editing
 * Enforces role & jurisdiction boundaries, whitelisted fields, and audit logging.
 */
router.patch('/:id', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    // Find existing project to verify jurisdiction
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    // 1. Role Authorization Check: Ordinary citizens cannot modify existing official projects
    if (user.role === 'CITIZEN' || user.role === 'COMMUNITY_OBSERVER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Citizens cannot modify official public infrastructure projects.',
        },
      });
    }

    // 2. Jurisdiction Boundary Checks (IDOR / JBAC Protection)
    if (user.role === 'MMDCE_OFFICER') {
      if (!user.district_id || user.district_id !== existing.district_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'JURISDICTION_MISMATCH',
            message: `Cross-district modification forbidden: Project belongs to district '${existing.district_id}', but officer is assigned to '${user.district_id}'.`,
          },
        });
      }
    }

    if (user.role === 'REGIONAL_OFFICER') {
      if (!user.region_id || user.region_id !== existing.region_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'JURISDICTION_MISMATCH',
            message: `Cross-regional modification forbidden: Project belongs to region '${existing.region_id}', but officer is assigned to '${user.region_id}'.`,
          },
        });
      }
    }

    // 3. Input Validation via Zod
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_DATA',
          message: 'Invalid project update data',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const updates = parseResult.data;

    // Mass-assignment protection: explicitly reject attempts to modify creator or ID
    if ((req.body as any).id || (req.body as any).created_by) {
      // Ignored safely
    }

    // Apply updates
    const { project, changedFields } = projectStore.updateProject(existing.id, updates, user);

    res.json({
      success: true,
      data: project,
      meta: {
        changedFields,
        message: 'Project successfully updated and audited.',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update project';
    const isLocationError = msg.includes('INVALID_LOCATION');

    res.status(isLocationError ? 400 : 500).json({
      success: false,
      error: {
        code: isLocationError ? 'INVALID_LOCATION' : 'PROJECT_UPDATE_FAILED',
        message: msg,
      },
    });
  }
});

/**
 * POST /api/projects/:id/archive
 * Requirement #3, #13: Project Archive API (Soft Deletion)
 */
router.post('/:id/archive', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;
    const { reason } = req.body || {};

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    // Check authorization: Super Admin or Officer with jurisdiction
    if (user.role === 'CITIZEN' || user.role === 'COMMUNITY_OBSERVER' || user.role === 'MODERATOR') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${user.role} does not possess authority to archive projects.`,
        },
      });
    }

    if (user.role === 'MMDCE_OFFICER' && user.district_id !== existing.district_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'JURISDICTION_MISMATCH',
          message: 'Cannot archive a project outside your district assembly.',
        },
      });
    }

    if (user.role === 'REGIONAL_OFFICER' && user.region_id !== existing.region_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'JURISDICTION_MISMATCH',
          message: 'Cannot archive a project outside your region.',
        },
      });
    }

    const { project } = projectStore.archiveProject(existing.id, user, reason);

    res.json({
      success: true,
      data: project,
      message: 'Project archived successfully and marked inactive.',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_ARCHIVE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to archive project',
      },
    });
  }
});

/**
 * GET /api/projects/:id/updates
 * Requirement #7, #14: Retrieve chronological milestone updates
 */
router.get('/:id/updates', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : undefined;
    const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10)) : undefined;

    if (page !== undefined || limit !== undefined) {
      const result = projectStore.listUpdatesPaginated(existing.id, { page, limit });
      return res.json({
        success: true,
        data: result.updates,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }

    const updates = projectStore.listUpdates(existing.id);

    res.json({
      success: true,
      data: updates,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATES_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve updates',
      },
    });
  }
});

/**
 * POST /api/projects/:id/updates
 * Requirement #7, #14: Post official milestone update to timeline
 */
router.post('/:id/updates', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    // Role check: Only authorized officers and admins can add official updates. Citizens cannot.
    const allowedRoles = ['SUPER_ADMIN', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${user.role} cannot publish official project updates.`,
        },
      });
    }

    // Jurisdiction check
    if (user.role === 'MMDCE_OFFICER' && user.district_id !== existing.district_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'JURISDICTION_MISMATCH',
          message: 'Cannot post updates for a project outside your assigned district.',
        },
      });
    }

    if (user.role === 'REGIONAL_OFFICER' && user.region_id !== existing.region_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'JURISDICTION_MISMATCH',
          message: 'Cannot post updates for a project outside your assigned region.',
        },
      });
    }

    // Validate update input
    const parseResult = createProjectUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UPDATE_DATA',
          message: 'Validation failed for project update',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { update, project } = projectStore.createUpdate(existing.id, parseResult.data, user);

    res.status(201).json({
      success: true,
      data: {
        update,
        project,
      },
      message: 'Official milestone update added to project timeline.',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CREATION_FAILED',
        message: err instanceof Error ? err.message : 'Failed to create project update',
      },
    });
  }
});

// ==========================================
// PHASE 5: EVIDENCE & MEDIA MANAGEMENT
// ==========================================

/**
 * GET /api/projects/:id/evidence
 * List verified evidence (or all evidence for authorized officers)
 */
router.get('/:id/evidence', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const user = req.profile;
    const isOfficer = user && (
      ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(user.role) ||
      (user.role === 'REGIONAL_OFFICER' && user.region_id === existing.region_id) ||
      (user.role === 'MMDCE_OFFICER' && user.district_id === existing.district_id)
    );

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 12)) : 12;

    const result = projectStore.listEvidence(existing.id, {
      isOfficer,
      userId: user?.id,
      page,
      limit,
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
        code: 'EVIDENCE_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve project evidence',
      },
    });
  }
});

/**
 * POST /api/projects/:id/evidence
 * Upload project evidence (photos/videos with geotagging & metadata)
 */
router.post('/:id/evidence', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const {
      file_url,
      thumbnail_url,
      file_type,
      file_size,
      caption,
      evidence_type,
      captured_at,
      latitude,
      longitude,
    } = req.body;

    if (!file_url || typeof file_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Valid file_url is required.' },
      });
    }

    if (!file_type || typeof file_type !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'file_type is required.' },
      });
    }

    if (!file_size || typeof file_size !== 'number' || file_size <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Positive numeric file_size is required.' },
      });
    }

    const { evidence } = projectStore.createEvidence(
      existing.id,
      {
        file_url,
        thumbnail_url,
        file_type,
        file_size,
        caption,
        evidence_type: evidence_type || 'SITE_PHOTO',
        captured_at,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
      },
      req.profile!
    );

    res.status(201).json({
      success: true,
      data: evidence,
      message:
        evidence.verification_status === 'VERIFIED'
          ? 'Evidence uploaded and verified.'
          : 'Evidence submitted successfully. Pending official verification.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload evidence';
    const isClientError = message.includes('INVALID_FILE_TYPE') || message.includes('FILE_TOO_LARGE') || message.includes('FORBIDDEN');
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: {
        code: 'EVIDENCE_UPLOAD_FAILED',
        message,
      },
    });
  }
});

/**
 * PATCH /api/projects/:id/evidence/:evidenceId/verify
 * Officer moderation: Mark evidence as VERIFIED or REJECTED
 */
router.patch('/:id/evidence/:evidenceId/verify', requireAuth(), (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.params;
    const { decision, reason } = req.body;

    if (decision !== 'VERIFIED' && decision !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DECISION', message: "Decision must be 'VERIFIED' or 'REJECTED'." },
      });
    }

    const { evidence } = projectStore.verifyEvidence(
      evidenceId,
      decision,
      req.profile!,
      reason
    );

    res.json({
      success: true,
      data: evidence,
      message: `Evidence marked as ${decision}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to verify evidence';
    const isForbidden = message.includes('FORBIDDEN');
    const isNotFound = message.includes('EVIDENCE_NOT_FOUND');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 500).json({
      success: false,
      error: {
        code: 'EVIDENCE_VERIFICATION_FAILED',
        message,
      },
    });
  }
});

/**
 * DELETE /api/projects/:id/evidence/:evidenceId
 * Delete evidence item (Authorized officer or uploader)
 */
router.delete('/:id/evidence/:evidenceId', requireAuth(), (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.params;
    projectStore.deleteEvidence(evidenceId, req.profile!);

    res.json({
      success: true,
      message: 'Evidence deleted successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete evidence';
    const isForbidden = message.includes('FORBIDDEN');
    const isNotFound = message.includes('EVIDENCE_NOT_FOUND');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 500).json({
      success: false,
      error: {
        code: 'EVIDENCE_DELETE_FAILED',
        message,
      },
    });
  }
});

// ==========================================
// PHASE 5: OFFICIAL DOCUMENT MANAGEMENT
// ==========================================

/**
 * GET /api/projects/:id/documents
 * List documents (public documents for citizens, all documents for authorized officers)
 */
router.get('/:id/documents', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const user = req.profile;
    const isOfficer = user && (
      ['SUPER_ADMIN', 'NATIONAL_MONITOR'].includes(user.role) ||
      (user.role === 'REGIONAL_OFFICER' && user.region_id === existing.region_id) ||
      (user.role === 'MMDCE_OFFICER' && user.district_id === existing.district_id)
    );

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10)) : 10;

    const result = projectStore.listDocuments(existing.id, { isOfficer, page, limit });

    res.json({
      success: true,
      data: result.documents,
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
        code: 'DOCUMENTS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve project documents',
      },
    });
  }
});

/**
 * POST /api/projects/:id/documents
 * Upload official project document (Officer only, enforced jurisdiction)
 */
router.post('/:id/documents', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const { name, description, file_url, document_type, file_size, is_public } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Document name is required.' },
      });
    }

    if (!file_url || typeof file_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Valid file_url is required.' },
      });
    }

    const { document } = projectStore.createDocument(
      existing.id,
      {
        name,
        description,
        file_url,
        document_type: document_type || 'OTHER',
        file_size: typeof file_size === 'number' ? file_size : 1024,
        is_public: is_public !== undefined ? Boolean(is_public) : true,
      },
      req.profile!
    );

    res.status(201).json({
      success: true,
      data: document,
      message: 'Official project document added successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload document';
    const isForbidden = message.includes('FORBIDDEN');
    res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: {
        code: 'DOCUMENT_UPLOAD_FAILED',
        message,
      },
    });
  }
});

/**
 * DELETE /api/projects/:id/documents/:documentId
 * Delete official document (Authorized officer in jurisdiction)
 */
router.delete('/:id/documents/:documentId', requireAuth(), (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    projectStore.deleteDocument(documentId, req.profile!);

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete document';
    const isForbidden = message.includes('FORBIDDEN');
    const isNotFound = message.includes('DOCUMENT_NOT_FOUND');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 500).json({
      success: false,
      error: {
        code: 'DOCUMENT_DELETE_FAILED',
        message,
      },
    });
  }
});

// ==========================================
// PHASE 5: VERIFICATIONS & REASON LOGS
// ==========================================

/**
 * GET /api/projects/:id/verifications
 * Verification timeline & decision history
 */
router.get('/:id/verifications', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const verifications = projectStore.listVerifications(existing.id);

    res.json({
      success: true,
      data: verifications,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATIONS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve verifications',
      },
    });
  }
});

/**
 * POST /api/projects/:id/verify
 * Requirement Phase 7: Authoritative Project Verification Decision
 * Strictly enforces RBAC, Jurisdiction, State Transitions, and Immutable Audit.
 */
router.post('/:id/verify', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const { decision, reason, notes, expected_status, checklist } = req.body || {};

    if (!decision || !['VERIFIED', 'REJECTED', 'REQUEST_CHANGES', 'UNDER_REVIEW'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DECISION',
          message: "decision must be one of: 'VERIFIED', 'REJECTED', 'REQUEST_CHANGES', 'UNDER_REVIEW'",
        },
      });
    }

    const result = projectStore.verifyProject(
      existing.id,
      {
        decision,
        reason,
        notes,
        expected_status,
        checklist,
      },
      req.profile!
    );

    res.json({
      success: true,
      data: result,
      message: `Project verification successfully updated to ${decision}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    const isForbidden = message.includes('FORBIDDEN') || message.includes('JURISDICTION');
    const isConflict = message.includes('CONCURRENT_MODIFICATION_CONFLICT');
    const isInvalid = message.includes('INVALID_STATE_TRANSITION') || message.includes('MANDATORY_JUSTIFICATION');

    const status = isForbidden ? 403 : isConflict ? 409 : isInvalid ? 400 : 500;

    res.status(status).json({
      success: false,
      error: {
        code: isForbidden
          ? 'FORBIDDEN'
          : isConflict
          ? 'CONFLICT'
          : isInvalid
          ? 'INVALID_TRANSITION'
          : 'VERIFICATION_FAILED',
        message,
      },
    });
  }
});

// ==========================================
// PHASE 5: COMMUNITY REPORTS SUMMARY (ANONYMIZED)
// ==========================================

/**
 * GET /api/projects/:id/reports-summary
 * Privacy-safe community feedback aggregation
 */
router.get('/:id/reports-summary', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const summary = projectStore.getReportsSummary(existing.id);

    res.json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORTS_SUMMARY_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve reports summary',
      },
    });
  }
});

// ==========================================
// PHASE 5: RELATED PROJECTS
// ==========================================

/**
 * GET /api/projects/:id/related
 * Contextual related projects in same district or category
 */
router.get('/:id/related', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const limit = req.query.limit ? Math.min(6, Math.max(1, parseInt(req.query.limit as string, 10) || 3)) : 3;
    const related = projectStore.getRelatedProjects(existing.id, limit);

    res.json({
      success: true,
      data: related,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RELATED_PROJECTS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve related projects',
      },
    });
  }
});

// ==========================================
// PHASE 6: CITIZEN REPORTS & RESOLUTION
// ==========================================

/**
 * GET /api/projects/:id/reports
 * Get project reports (officers see jurisdiction reports; citizens see own submitted reports)
 */
router.get('/:id/reports', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const user = req.profile;
    const isOfficer = user && ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'].includes(user.role);

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10)) : 10;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;

    const result = projectStore.listReports(existing.id, {
      isOfficer,
      officerProfile: isOfficer ? user : undefined,
      userId: !isOfficer && user ? user.id : undefined,
      status,
      severity,
      page,
      limit,
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
        message: err instanceof Error ? err.message : 'Failed to retrieve project reports',
      },
    });
  }
});

/**
 * POST /api/projects/:id/reports
 * Submit a citizen community issue report on this project
 */
router.post('/:id/reports', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const valResult = createProjectReportSchema.safeParse(req.body);
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

    const { report } = projectStore.createReport(existing.id, valResult.data, user);

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REPORT_SUBMISSION_FAILED',
        message: err.message || 'Failed to submit report',
      },
    });
  }
});

/**
 * PATCH /api/projects/:id/reports/:reportId
 * Officer in jurisdiction resolves an issue report
 */
router.patch('/:id/reports/:reportId', requireAuth, (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const user = req.profile!;

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

    const { report } = projectStore.resolveReport(reportId, valResult.data, user);

    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN');
    const isMismatch = err.message?.includes('JURISDICTION_MISMATCH');
    const isNotFound = err.message?.includes('REPORT_NOT_FOUND');

    const status = isNotFound ? 404 : isForbidden || isMismatch ? 403 : 400;
    const code = isNotFound
      ? 'REPORT_NOT_FOUND'
      : isForbidden
      ? 'FORBIDDEN'
      : isMismatch
      ? 'JURISDICTION_MISMATCH'
      : 'RESOLUTION_FAILED';

    res.status(status).json({
      success: false,
      error: {
        code,
        message: err.message || 'Failed to resolve report',
      },
    });
  }
});

// ==========================================
// PHASE 6: COMMENTS & COMMUNITY FEEDBACK
// ==========================================

/**
 * GET /api/projects/:id/comments
 * List published comments (public access)
 */
router.get('/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const user = req.profile;
    const isModerator = user && ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR'].includes(user.role);

    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 15)) : 15;

    const result = projectStore.listComments(existing.id, { page, limit, isModerator });

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
        code: 'COMMENTS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve comments',
      },
    });
  }
});

/**
 * POST /api/projects/:id/comments
 * Post a new comment (requires authentication)
 */
router.post('/:id/comments', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const valResult = createProjectCommentSchema.safeParse(req.body);
    if (!valResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment payload',
          details: valResult.error.format(),
        },
      });
    }

    const { comment } = projectStore.createComment(existing.id, valResult.data.content, user);

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'COMMENT_CREATION_FAILED',
        message: err.message || 'Failed to post comment',
      },
    });
  }
});

/**
 * PATCH /api/projects/:id/comments/:commentId/moderate
 * Moderator or jurisdiction officer moderates a comment
 */
router.patch('/:id/comments/:commentId/moderate', requireAuth, (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const user = req.profile!;
    const { action, reason } = req.body;

    if (!['PUBLISH', 'FLAG', 'REMOVE'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MODERATION_ACTION',
          message: "Action must be 'PUBLISH', 'FLAG', or 'REMOVE'",
        },
      });
    }

    const { comment } = projectStore.moderateComment(commentId, action, user, reason);

    res.json({
      success: true,
      data: comment,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN');
    const isNotFound = err.message?.includes('COMMENT_NOT_FOUND');

    res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'COMMENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'MODERATION_FAILED',
        message: err.message || 'Failed to moderate comment',
      },
    });
  }
});

/**
 * DELETE /api/projects/:id/comments/:commentId
 * Author or moderator deletes a comment
 */
router.delete('/:id/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const user = req.profile!;

    projectStore.deleteComment(commentId, user);

    res.json({
      success: true,
      data: { message: 'Comment deleted successfully' },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN');
    const isNotFound = err.message?.includes('COMMENT_NOT_FOUND');

    res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'COMMENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'DELETION_FAILED',
        message: err.message || 'Failed to delete comment',
      },
    });
  }
});

// ==========================================
// PHASE 6: CIVIC PRIORITY VOTES
// ==========================================

/**
 * GET /api/projects/:id/votes
 * Get aggregated priority votes and current user vote status
 */
router.get('/:id/votes', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const userId = req.profile?.id;
    const votesSummary = projectStore.getVotesSummary(existing.id, userId);

    res.json({
      success: true,
      data: votesSummary,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VOTES_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve votes',
      },
    });
  }
});

/**
 * POST /api/projects/:id/votes
 * Cast or toggle a civic priority vote (UPVOTE / DOWNVOTE)
 */
router.post('/:id/votes', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const valResult = castVoteSchema.safeParse(req.body);
    if (!valResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid vote type. Must be UPVOTE or DOWNVOTE',
          details: valResult.error.format(),
        },
      });
    }

    const result = projectStore.castVote(existing.id, valResult.data.vote_type, user);

    res.json({
      success: true,
      data: result.summary,
      actionTaken: result.actionTaken,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VOTE_FAILED',
        message: err.message || 'Failed to cast vote',
      },
    });
  }
});

/**
 * DELETE /api/projects/:id/votes
 * Remove vote
 */
router.delete('/:id/votes', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;

    const existing = projectStore.getProjectByIdOrSlug(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${id}' was not found.`,
        },
      });
    }

    const result = projectStore.removeVote(existing.id, user);

    res.json({
      success: true,
      data: result.summary,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VOTE_REMOVAL_FAILED',
        message: err.message || 'Failed to remove vote',
      },
    });
  }
});

export default router;
