import { Router, Request, Response } from 'express';
import { projectStore } from '../db/project_store';

const router = Router();

/**
 * GET /api/geography/regions
 * Returns all 16 administrative regions of Ghana
 */
router.get('/regions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: projectStore.getRegions(),
  });
});

/**
 * GET /api/geography/regions-with-stats
 * Returns all 16 regions with live project metrics, budgets, and district counts
 */
router.get('/regions-with-stats', (_req: Request, res: Response) => {
  try {
    const stats = projectStore.getRegionStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REGION_STATS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve region statistics',
      },
    });
  }
});

/**
 * GET /api/geography/regions/:slugOrId
 * Detailed region info, statistics, and its verified project directory
 */
router.get('/regions/:slugOrId', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const data = projectStore.getRegionBySlugOrId(slugOrId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REGION_NOT_FOUND',
          message: `Region '${slugOrId}' not found`,
        },
      });
    }
    res.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REGION_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve region details',
      },
    });
  }
});

/**
 * GET /api/geography/districts
 * Returns MMDCE districts, filtered by region_id if provided
 */
router.get('/districts', (req: Request, res: Response) => {
  const { region_id } = req.query;
  res.json({
    success: true,
    data: projectStore.getDistricts(typeof region_id === 'string' ? region_id : undefined),
  });
});

/**
 * GET /api/geography/districts/:districtSlugOrId
 * Detailed district info, statistics, communities, and verified projects
 */
router.get('/districts/:districtSlugOrId', (req: Request, res: Response) => {
  try {
    const { districtSlugOrId } = req.params;
    const data = projectStore.getDistrictBySlugOrId(districtSlugOrId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DISTRICT_NOT_FOUND',
          message: `District '${districtSlugOrId}' not found`,
        },
      });
    }
    res.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DISTRICT_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve district details',
      },
    });
  }
});

/**
 * GET /api/geography/regions/:regionSlug/districts/:districtSlug
 * Nested regional district detail endpoint
 */
router.get('/regions/:regionSlug/districts/:districtSlug', (req: Request, res: Response) => {
  try {
    const { regionSlug, districtSlug } = req.params;
    const data = projectStore.getDistrictBySlugOrId(districtSlug, regionSlug);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DISTRICT_NOT_FOUND',
          message: `District '${districtSlug}' in region '${regionSlug}' not found`,
        },
      });
    }
    res.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DISTRICT_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve district details',
      },
    });
  }
});

/**
 * GET /api/geography/communities
 * Returns local communities, filtered by district_id if provided
 */
router.get('/communities', (req: Request, res: Response) => {
  const { district_id } = req.query;
  res.json({
    success: true,
    data: projectStore.getCommunities(typeof district_id === 'string' ? district_id : undefined),
  });
});

/**
 * GET /api/geography/categories
 * Returns official project infrastructure categories
 */
router.get('/categories', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: projectStore.getCategories(),
  });
});

/**
 * GET /api/geography/categories-with-stats
 * Returns infrastructure sectors with live counts and public investment totals
 */
router.get('/categories-with-stats', (_req: Request, res: Response) => {
  try {
    const stats = projectStore.getCategoryStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_STATS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve category statistics',
      },
    });
  }
});

/**
 * GET /api/geography/categories/:slugOrId
 * Detailed category info, statistics, and its verified project directory
 */
router.get('/categories/:slugOrId', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const data = projectStore.getCategoryBySlugOrId(slugOrId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: `Category '${slugOrId}' not found`,
        },
      });
    }
    res.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retrieve category details',
      },
    });
  }
});

/**
 * GET /api/geography/audit-logs
 * Immutable audit logs
 */
router.get('/audit-logs', (req: Request, res: Response) => {
  const { entity_id, entity_type, limit } = req.query;
  res.json({
    success: true,
    data: projectStore.getAuditLogs({
      entityId: typeof entity_id === 'string' ? entity_id : undefined,
      entityType: typeof entity_type === 'string' ? entity_type : undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
    }),
  });
});

export default router;
