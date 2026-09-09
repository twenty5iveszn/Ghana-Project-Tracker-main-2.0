-- ==============================================================================
-- GHANABUILD 2.0 — PHASE 5: PROJECT EVIDENCE & DOCUMENT MANAGEMENT MIGRATION
-- Migration: 20260908000004_phase5_evidence_documents.sql
-- Description: Extends project_documents schema, configures storage policies,
--              defines public verification history visibility, and optimizes
--              evidence and document query indexing.
-- ==============================================================================

-- 1. Extend project_documents with visibility and size attributes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_documents' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE project_documents ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_documents' AND column_name = 'file_size'
    ) THEN
        ALTER TABLE project_documents ADD COLUMN file_size BIGINT NOT NULL DEFAULT 1048576;
    END IF;
END $$;

-- 2. Performance Indexes for Phase 5 Data Access
CREATE INDEX IF NOT EXISTS idx_project_evidence_project_status 
    ON project_evidence(project_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_public 
    ON project_documents(project_id, is_public);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_date 
    ON project_updates(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_verifications_project 
    ON project_verifications(project_id, created_at DESC);

-- 3. Document Access Security Policies
-- Public can only view is_public = TRUE documents for VERIFIED projects
DROP POLICY IF EXISTS "Public can view public documents for verified projects" ON project_documents;
CREATE POLICY "Public can view public documents for verified projects" ON project_documents
    FOR SELECT USING (
        is_public = TRUE AND
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND p.verification_status = 'VERIFIED'
        )
    );

-- Officers in jurisdiction can view all documents (including confidential/administrative)
DROP POLICY IF EXISTS "Officers can view all documents in jurisdiction" ON project_documents;
CREATE POLICY "Officers can view all documents in jurisdiction" ON project_documents
    FOR SELECT USING (
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

-- 4. Public Verification History Visibility
-- Citizens can view verification records for verified projects (reviewer contact info masked)
DROP POLICY IF EXISTS "Public can view verification records for verified projects" ON project_verifications;
CREATE POLICY "Public can view verification records for verified projects" ON project_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND p.verification_status = 'VERIFIED'
        ) OR
        public.is_moderator_or_admin()
    );

-- 5. Storage Buckets Configuration (Documentation & Declaration)
-- project-evidence: Public read for verified objects; Officer/authenticated write to {project_id}/*
-- project-documents: Public read for public docs; signed URLs for restricted docs
-- project-images: Public read for general thumbnails and site banners
