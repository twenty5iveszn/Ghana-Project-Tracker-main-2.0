import { Router, Request, Response } from 'express';
import { projectStore } from '../db/project_store';
import { createContractorSchema } from '../../src/lib/validation/project';
import { requireAuth } from '../middleware/auth';
import { UserRole } from '../../src/types/user';

const router = Router();

const PUBLIC_CONTRACTOR_FIELDS = ({ contact_email: _email, contact_phone: _phone, address: _address, tin_number: _tin, ...publicContractor }: any) => publicContractor;

/** Public, verified-project contractor directory. */
router.get('/directory', (_req: Request, res: Response) => {
  try {
    const data = projectStore.listContractorAccountability().map((contractor) => PUBLIC_CONTRACTOR_FIELDS(contractor));
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'CONTRACTOR_DIRECTORY_FAILED', message: err instanceof Error ? err.message : 'Failed to retrieve contractor directory' } });
  }
});

/** Public contractor dossier addressed by stable slug. */
router.get('/profile/:slug', (req: Request, res: Response) => {
  try {
    const contractor = projectStore.listContractors().find((item) => item.slug === req.params.slug && item.status !== 'ARCHIVED');
    if (!contractor) return res.status(404).json({ success: false, error: { code: 'CONTRACTOR_NOT_FOUND', message: 'Contractor profile not found' } });
    const accountability = projectStore.getContractorAccountability(contractor.id);
    if (!accountability) return res.status(404).json({ success: false, error: { code: 'CONTRACTOR_NOT_FOUND', message: 'Contractor profile not found' } });
    res.json({ success: true, data: { contractor: PUBLIC_CONTRACTOR_FIELDS(accountability.contractor), scorecard: accountability.scorecard, projects: accountability.projects } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'CONTRACTOR_PROFILE_FAILED', message: err instanceof Error ? err.message : 'Failed to retrieve contractor profile' } });
  }
});

/** Authorized comparison endpoint; scope is derived from the authenticated profile. */
router.get('/analytics', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = req.profile!;
    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'];
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Contractor analytics are not available to this role.' } });
    const contractors = projectStore.listContractorAccountability(user);
    const rated = contractors.filter((contractor) => contractor.scorecard.overall_score !== null);
    res.json({ success: true, data: { jurisdiction: user.role === 'MMDCE_OFFICER' ? user.district_name || user.district_id : user.role === 'REGIONAL_OFFICER' ? user.region_name || user.region_id : 'Nationwide authorized scope', contractors, summary: { contractor_count: contractors.length, project_count: contractors.reduce((sum, contractor) => sum + contractor.total_projects_count, 0), active_projects: contractors.reduce((sum, contractor) => sum + contractor.ongoing_projects_count, 0), completed_projects: contractors.reduce((sum, contractor) => sum + contractor.completed_projects_count, 0), average_score: rated.length ? Math.round(rated.reduce((sum, contractor) => sum + (contractor.scorecard.overall_score || 0), 0) / rated.length) : null } } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: { code: 'CONTRACTOR_ANALYTICS_FAILED', message: err instanceof Error ? err.message : 'Failed to retrieve contractor analytics' } });
  }
});

/**
 * GET /api/contractors
 * List contractors with search support
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const contractors = projectStore.listContractors(typeof search === 'string' ? search : undefined);
    res.json({
      success: true,
      data: contractors,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTRACTOR_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve contractors',
      },
    });
  }
});

/**
 * POST /api/contractors
 * Register a new contractor in the GhanaBuild Registry
 * Only administrative/officer roles can register contractors
 */
router.post('/', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = req.profile!;
    const allowedRoles = ['SUPER_ADMIN', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${user.role} is not permitted to register contractors.`,
        },
      });
    }

    const parseResult = createContractorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTRACTOR_DATA',
          message: 'Invalid contractor registration details',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const contractor = projectStore.createContractor(parseResult.data, user);

    res.status(201).json({
      success: true,
      data: contractor,
      message: 'Contractor successfully registered in GhanaBuild Registry.',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTRACTOR_CREATION_FAILED',
        message: err instanceof Error ? err.message : 'Failed to create contractor',
      },
    });
  }
});

/**
 * PATCH /api/contractors/:id
 * Update contractor details
 */
router.patch('/:id', requireAuth(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.profile!;
    const allowedRoles = ['SUPER_ADMIN', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role ${user.role} is not permitted to edit contractors.`,
        },
      });
    }

    const parseResult = createContractorSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTRACTOR_DATA',
          message: 'Invalid contractor update details',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const updated = projectStore.updateContractor(id, parseResult.data, user);

    res.json({
      success: true,
      data: updated,
      message: 'Contractor record successfully updated.',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTRACTOR_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to update contractor',
      },
    });
  }
});

export default router;
