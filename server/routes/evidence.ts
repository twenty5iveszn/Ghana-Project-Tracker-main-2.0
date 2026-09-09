import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabase';
import { requireAuth } from '../middleware/auth';
import { projectStore } from '../db/project_store';
import { EvidenceType } from '../../src/types/project';

const router = Router();
const BUCKET = 'project-evidence';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_INSPECTION_IMAGES = 8;
export const allowedEvidenceImages: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
};

function canCapture(role: string) { return ['COMMUNITY_OBSERVER', 'MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN'].includes(role); }
function canRead(evidence: ReturnType<typeof projectStore.getEvidenceById>, actor: NonNullable<Request['profile']>) {
  if (!evidence) return false;
  const project = projectStore.getProjectByIdOrSlug(evidence.project_id);
  return evidence.verification_status === 'VERIFIED' || evidence.uploaded_by === actor.id || actor.role === 'SUPER_ADMIN' || actor.role === 'NATIONAL_MONITOR' || actor.role === 'MODERATOR' || (actor.role === 'REGIONAL_OFFICER' && actor.region_id === project?.region_id) || (actor.role === 'MMDCE_OFFICER' && actor.district_id === project?.district_id);
}
export function buildEvidenceStoragePath(projectId: string, inspectionId: string, evidenceId: string, mime: string): string {
  return `${projectId}/${inspectionId}/${evidenceId}.${allowedEvidenceImages[mime].ext}`;
}
export function hasEvidenceMagic(bytes: Uint8Array, mime: string) {
  const prefixValid = allowedEvidenceImages[mime]?.magic.some((signature) => signature.every((value, index) => bytes[index] === value));
  return prefixValid && (mime !== 'image/webp' || [0x57, 0x45, 0x42, 0x50].every((value, index) => bytes[index + 8] === value));
}

// The server owns object identity. The browser receives a short-lived, single-object upload URL only.
router.post('/upload-authorize', requireAuth(), async (req: Request, res: Response) => {
  const { project_id, inspection_id, client_evidence_id, mime_type, size, filename } = req.body || {};
  if (!canCapture(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'EVIDENCE_ROLE_FORBIDDEN' } });
  if (![project_id, inspection_id, client_evidence_id, mime_type, filename].every((v) => typeof v === 'string') || !Number.isInteger(size)) return res.status(400).json({ success: false, error: { code: 'INVALID_EVIDENCE_METADATA' } });
  if (!allowedEvidenceImages[mime_type] || size < 1 || size > MAX_IMAGE_BYTES || /[\\/\0]/.test(filename)) return res.status(400).json({ success: false, error: { code: 'INVALID_EVIDENCE_FILE', message: 'Only JPEG, PNG, or WebP images up to 8 MB are accepted.' } });
  const inspection = projectStore.listFieldInspections({ actor: req.profile! }).find((item) => item.id === inspection_id);
  if (!inspection || inspection.project_id !== project_id) return res.status(403).json({ success: false, error: { code: 'INSPECTION_PROJECT_MISMATCH' } });
  const existing = projectStore.getEvidenceByClientId(client_evidence_id);
  if (existing) return res.json({ success: true, data: { evidence_id: existing.id, already_confirmed: true } });
  const evidenceId = randomUUID();
  const path = buildEvidenceStoragePath(project_id, inspection_id, evidenceId, mime_type);
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Evidence storage is not configured.' } });
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return res.status(502).json({ success: false, error: { code: 'UPLOAD_AUTHORIZATION_FAILED', message: error?.message } });
  res.json({ success: true, data: { evidence_id: evidenceId, storage_path: path, token: data.token, signed_url: data.signedUrl, expires_in_seconds: 600 } });
});

router.post('/confirm', requireAuth(), async (req: Request, res: Response) => {
  const { evidence_id, project_id, inspection_id, client_evidence_id, storage_path, mime_type, size, filename, caption, captured_at, latitude, longitude } = req.body || {};
  if (![evidence_id, project_id, inspection_id, client_evidence_id, storage_path, mime_type, filename].every((v) => typeof v === 'string') || !Number.isInteger(size) || !allowedEvidenceImages[mime_type] || size < 1 || size > MAX_IMAGE_BYTES) return res.status(400).json({ success: false, error: { code: 'INVALID_EVIDENCE_METADATA' } });
  if (storage_path !== buildEvidenceStoragePath(project_id, inspection_id, evidence_id, mime_type)) return res.status(400).json({ success: false, error: { code: 'INVALID_STORAGE_PATH' } });
  const inspection = projectStore.listFieldInspections({ actor: req.profile! }).find((item) => item.id === inspection_id);
  if (!inspection || inspection.project_id !== project_id) return res.status(403).json({ success: false, error: { code: 'INSPECTION_PROJECT_MISMATCH' } });
  const existing = projectStore.getEvidenceByClientId(client_evidence_id);
  if (existing) return res.json({ success: true, duplicate: true, data: existing });
  if (projectStore.listEvidence(project_id, { isOfficer: true, limit: 100 }).evidence.filter((e) => e.inspection_id === inspection_id).length >= MAX_INSPECTION_IMAGES) return res.status(409).json({ success: false, error: { code: 'INSPECTION_EVIDENCE_LIMIT' } });
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ success: false, error: { code: 'STORAGE_UNAVAILABLE' } });
  const { data: blob, error } = await admin.storage.from(BUCKET).download(storage_path);
  if (error || !blob) return res.status(409).json({ success: false, error: { code: 'OBJECT_NOT_FOUND' } });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length !== size || !hasEvidenceMagic(bytes, mime_type)) return res.status(400).json({ success: false, error: { code: 'INVALID_IMAGE_CONTENT' } });
  try {
    const record = { id: evidence_id, project_id, uploaded_by: req.profile!.id, file_url: `/api/evidence/${evidence_id}/signed-url`, file_type: mime_type, file_size: size, caption: typeof caption === 'string' ? caption : null, evidence_type: 'SITE_PHOTO', captured_at: typeof captured_at === 'string' ? captured_at : null, latitude: typeof latitude === 'number' ? latitude : null, longitude: typeof longitude === 'number' ? longitude : null, inspection_id, client_evidence_id, storage_path, original_filename: filename, verification_status: 'PENDING', upload_status: 'UPLOADED' };
    const { error: dbError } = await (admin.from('project_evidence') as any).insert(record);
    if (dbError) throw new Error(`DATABASE_METADATA_FAILED: ${dbError.message}`);
    const { evidence } = projectStore.createEvidence(project_id, { ...record, force_pending: true, evidence_type: 'SITE_PHOTO' as EvidenceType }, req.profile!);
    res.status(201).json({ success: true, data: evidence });
  } catch (err) { res.status(500).json({ success: false, error: { code: 'EVIDENCE_CONFIRM_FAILED', message: err instanceof Error ? err.message : 'Metadata creation failed; retry confirmation with the same identifiers.' } }); }
});

// Read-only, admin-only data-quality check. It intentionally never deletes objects.
router.get('/diagnostics', requireAuth(), async (req: Request, res: Response) => {
  if (!['SUPER_ADMIN', 'NATIONAL_MONITOR'].includes(req.profile!.role)) return res.status(403).json({ success: false, error: { code: 'DIAGNOSTICS_FORBIDDEN' } });
  const admin = getSupabaseAdmin(); if (!admin) return res.status(503).json({ success: false, error: { code: 'STORAGE_UNAVAILABLE' } });
  const { data: rows, error } = await (admin.from('project_evidence') as any).select('id,project_id,inspection_id,client_evidence_id,storage_path,upload_status,created_at').limit(500);
  if (error) return res.status(502).json({ success: false, error: { code: 'DIAGNOSTICS_QUERY_FAILED', message: error.message } });
  const records = rows || []; const missingStorage: string[] = []; const missingPath: string[] = []; const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const row of records) {
    if (!row.storage_path) { missingPath.push(row.id); continue; }
    if (row.client_evidence_id) { if (seen.has(row.client_evidence_id)) duplicates.push(row.id); seen.add(row.client_evidence_id); }
    const { error: objectError } = await admin.storage.from(BUCKET).download(row.storage_path);
    if (objectError) missingStorage.push(row.id);
  }
  res.json({ success: true, data: { inspected_records: records.length, database_rows_without_storage_path: missingPath, database_rows_with_missing_storage_object: missingStorage, duplicate_client_evidence_ids: duplicates, storage_orphans: 'Run the supplied SQL inventory against storage.objects before remediation; API listing is intentionally bounded to avoid broad bucket enumeration.', recommendation: 'Investigate each ID, preserve evidence, and use an audited administrative archival process. No records or objects were changed.' } });
});

router.get('/:id/signed-url', async (req: Request, res: Response) => {
  const evidence = projectStore.getEvidenceById(req.params.id);
  if (!evidence || (evidence.verification_status !== 'VERIFIED' && (!req.profile || !canRead(evidence, req.profile)))) return res.status(404).json({ success: false, error: { code: 'EVIDENCE_NOT_FOUND' } });
  if (!evidence?.storage_path) return res.status(409).json({ success: false, error: { code: 'EVIDENCE_NOT_STORED' } });
  const admin = getSupabaseAdmin(); if (!admin) return res.status(503).json({ success: false, error: { code: 'STORAGE_UNAVAILABLE' } });
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(evidence.storage_path, 300);
  if (error || !data) return res.status(502).json({ success: false, error: { code: 'SIGNED_URL_FAILED', message: error?.message } });
  res.json({ success: true, data: { url: data.signedUrl, expires_in_seconds: 300 } });
});

export default router;
