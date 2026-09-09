-- Phase 12: Offline field inspections. Offline capture never implies verification.
CREATE TYPE inspection_sync_status AS ENUM ('LOCAL_DRAFT','QUEUED','SYNCING','SYNCED','SYNC_FAILED','CONFLICT');
CREATE TYPE inspection_verification_status AS ENUM ('PENDING','UNDER_REVIEW','VERIFIED','REJECTED');
CREATE TYPE inspection_type AS ENUM ('ROUTINE','PROGRESS','QUALITY','SAFETY','COMPLETION','FOLLOW_UP','OTHER');
CREATE TYPE inspection_issue_type AS ENUM ('DELAYED_WORK','POOR_WORKMANSHIP','INCOMPLETE_WORK','SAFETY_CONCERN','ENVIRONMENTAL_CONCERN','MISSING_MATERIALS','SITE_INACTIVITY','INCORRECT_INFORMATION','OTHER');

CREATE TABLE field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id TEXT NOT NULL, project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, inspection_reference TEXT NOT NULL UNIQUE,
  inspection_date DATE NOT NULL, inspection_type inspection_type NOT NULL, observed_status project_status NOT NULL,
  observed_progress_percentage NUMERIC(5,2) NOT NULL CHECK (observed_progress_percentage BETWEEN 0 AND 100), observations TEXT NOT NULL,
  issues_found inspection_issue_type[] NOT NULL DEFAULT '{}', safety_observations TEXT, environmental_observations TEXT,
  latitude NUMERIC(9,6) CHECK (latitude BETWEEN -90 AND 90), longitude NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180), gps_accuracy NUMERIC(10,2) CHECK (gps_accuracy IS NULL OR gps_accuracy >= 0),
  captured_at TIMESTAMPTZ NOT NULL, device_timestamp TIMESTAMPTZ NOT NULL, sync_status inspection_sync_status NOT NULL DEFAULT 'SYNCED',
  verification_status inspection_verification_status NOT NULL DEFAULT 'PENDING', server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_by UUID REFERENCES profiles(id), reviewed_at TIMESTAMPTZ, review_notes TEXT,
  distance_from_project_meters NUMERIC(12,2) CHECK (distance_from_project_meters IS NULL OR distance_from_project_meters >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inspector_id, client_id)
);

CREATE INDEX idx_field_inspections_project_status ON field_inspections(project_id, verification_status);
CREATE INDEX idx_field_inspections_inspector_sync ON field_inspections(inspector_id, sync_status);
CREATE INDEX idx_field_inspections_date ON field_inspections(inspection_date DESC);
CREATE INDEX idx_field_inspections_type ON field_inspections(inspection_type);

ALTER TABLE project_evidence ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES field_inspections(id) ON DELETE SET NULL;
ALTER TABLE project_evidence ADD COLUMN IF NOT EXISTS client_evidence_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_evidence_client_id ON project_evidence(client_evidence_id) WHERE client_evidence_id IS NOT NULL;
CREATE INDEX idx_project_evidence_inspection ON project_evidence(inspection_id);

ALTER TABLE field_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can view scoped inspections" ON field_inspections FOR SELECT USING (
  public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id))
  OR (verification_status = 'VERIFIED' AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'))
);
CREATE POLICY "Field users can create scoped inspections" ON field_inspections FOR INSERT WITH CHECK (
  inspector_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = TRUE)
  AND public.current_user_role() IN ('COMMUNITY_OBSERVER','MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN')
  AND public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id))
);
CREATE POLICY "Reviewers can update inspection review" ON field_inspections FOR UPDATE USING (
  public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN')
  AND public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id))
) WITH CHECK (TRUE);
CREATE POLICY "Inspections cannot be deleted" ON field_inspections FOR DELETE USING (FALSE);

CREATE OR REPLACE FUNCTION reject_future_field_inspection() RETURNS trigger AS $$
BEGIN
  IF NEW.device_timestamp > now() + interval '1 day' THEN RAISE EXCEPTION 'Inspection device timestamp is implausibly in the future'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER validate_field_inspection_timestamp BEFORE INSERT OR UPDATE ON field_inspections FOR EACH ROW EXECUTE FUNCTION reject_future_field_inspection();
