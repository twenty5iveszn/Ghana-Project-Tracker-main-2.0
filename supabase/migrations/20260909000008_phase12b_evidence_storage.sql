-- Phase 12B: private field evidence objects. Apply after Phase 12.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-evidence', 'project-evidence', false, 8388608, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 8388608, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

ALTER TABLE project_evidence ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE project_evidence ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE project_evidence ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (upload_status IN ('PENDING_UPLOAD','UPLOADED','FAILED'));
CREATE UNIQUE INDEX IF NOT EXISTS project_evidence_storage_path_unique ON project_evidence(storage_path) WHERE storage_path IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS project_evidence_client_id_unique ON project_evidence(client_evidence_id) WHERE client_evidence_id IS NOT NULL;

-- Direct browser storage access is denied. The authenticated API issues a five-minute
-- object-specific signed URL after it has checked project jurisdiction and inspection ownership.
DROP POLICY IF EXISTS "No direct project evidence reads" ON storage.objects;
CREATE POLICY "No direct project evidence reads" ON storage.objects FOR SELECT USING (bucket_id <> 'project-evidence');
DROP POLICY IF EXISTS "No direct project evidence writes" ON storage.objects;
CREATE POLICY "No direct project evidence writes" ON storage.objects FOR INSERT WITH CHECK (bucket_id <> 'project-evidence');
DROP POLICY IF EXISTS "No direct project evidence updates" ON storage.objects;
CREATE POLICY "No direct project evidence updates" ON storage.objects FOR UPDATE USING (bucket_id <> 'project-evidence');
DROP POLICY IF EXISTS "No direct project evidence deletes" ON storage.objects;
CREATE POLICY "No direct project evidence deletes" ON storage.objects FOR DELETE USING (bucket_id <> 'project-evidence');
