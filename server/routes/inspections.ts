import { Router, Request, Response } from 'express';
import { projectStore } from '../db/project_store';
import { requireAuth } from '../middleware/auth';
import { createFieldInspectionSchema } from '../../src/lib/validation/project';

const router = Router();
const captureRoles = ['COMMUNITY_OBSERVER', 'MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];
const reviewRoles = ['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'];

router.post('/', requireAuth(), (req: Request, res: Response) => {
  if (!captureRoles.includes(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'INSPECTION_ROLE_FORBIDDEN', message: 'This role cannot submit field inspections.' } });
  const parsed = createFieldInspectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_INSPECTION', details: parsed.error.flatten().fieldErrors } });
  try {
    if (typeof req.body.project_id !== 'string') throw new Error('PROJECT_NOT_FOUND');
    const result = projectStore.createFieldInspection(req.body.project_id, parsed.data, req.profile!);
    res.status(result.duplicate ? 200 : 201).json({ success: true, duplicate: result.duplicate, data: result.inspection, message: result.duplicate ? 'This inspection already reached the server. No duplicate was created.' : 'Inspection synchronized and queued for review.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Inspection synchronization failed';
    const status = message.includes('FORBIDDEN') ? 403 : message.includes('NOT_FOUND') ? 404 : 409;
    res.status(status).json({ success: false, error: { code: message, message } });
  }
});

router.get('/:id', requireAuth(), (req: Request, res: Response) => {
  const inspection = projectStore.listFieldInspections({ actor: req.profile! }).find((record) => record.id === req.params.id);
  if (!inspection) return res.status(404).json({ success: false, error: { code: 'INSPECTION_NOT_FOUND', message: 'Inspection not found in your authorized scope.' } });
  res.json({ success: true, data: inspection });
});

router.post('/:id/review', requireAuth(), (req: Request, res: Response) => {
  if (!reviewRoles.includes(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'INSPECTION_REVIEW_FORBIDDEN', message: 'This role cannot review inspections.' } });
  const status = req.body.status === 'VERIFIED' || req.body.status === 'REJECTED' || req.body.status === 'UNDER_REVIEW' ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: { code: 'INVALID_REVIEW_STATUS', message: 'Status must be UNDER_REVIEW, VERIFIED, or REJECTED.' } });
  try { res.json({ success: true, data: projectStore.reviewFieldInspection(req.params.id, status, typeof req.body.notes === 'string' ? req.body.notes : null, req.profile!) }); }
  catch (err: unknown) { const message = err instanceof Error ? err.message : 'Inspection review failed'; res.status(message.includes('FORBIDDEN') ? 403 : 404).json({ success: false, error: { code: message, message } }); }
});

export default router;
