-- Phase 11: Fiscal transparency and disbursement tracking.
-- Financial records are distinct from projects.budget and are never hard-deleted.

CREATE TYPE fiscal_funding_status AS ENUM ('PROPOSED','APPROVED','ACTIVE','SUSPENDED','CLOSED','CANCELLED');
CREATE TYPE fiscal_commitment_status AS ENUM ('PROPOSED','APPROVED','ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE fiscal_tranche_status AS ENUM ('PLANNED','APPROVED','PARTIALLY_DISBURSED','DISBURSED','SUSPENDED','CANCELLED');
CREATE TYPE fiscal_payment_status AS ENUM ('PENDING','APPROVED','DISBURSED','REVERSED','CANCELLED');
CREATE TYPE fiscal_verification_status AS ENUM ('PENDING','UNDER_REVIEW','VERIFIED','REJECTED');
CREATE TYPE fiscal_expenditure_category AS ENUM ('LABOUR','MATERIALS','EQUIPMENT','TRANSPORT','PROFESSIONAL_SERVICES','LAND','ADMINISTRATION','OTHER');

CREATE TABLE project_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  funding_source TEXT NOT NULL CHECK (length(trim(funding_source)) > 1), funding_reference TEXT,
  allocated_amount NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0), currency CHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'),
  allocation_date DATE NOT NULL, fiscal_year INTEGER NOT NULL CHECK (fiscal_year BETWEEN 2000 AND 2100),
  funding_status fiscal_funding_status NOT NULL DEFAULT 'PROPOSED', notes TEXT, created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(project_id, funding_reference)
);
CREATE TABLE project_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  contractor_id UUID REFERENCES contractors(id) ON DELETE RESTRICT, commitment_reference TEXT NOT NULL UNIQUE,
  committed_amount NUMERIC(18,2) NOT NULL CHECK (committed_amount > 0), currency CHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'),
  commitment_date DATE NOT NULL, approved_by UUID REFERENCES profiles(id), status fiscal_commitment_status NOT NULL DEFAULT 'PROPOSED', notes TEXT,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE project_tranches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  commitment_id UUID NOT NULL REFERENCES project_commitments(id) ON DELETE RESTRICT, tranche_number INTEGER NOT NULL CHECK (tranche_number > 0),
  tranche_name TEXT NOT NULL, approved_amount NUMERIC(18,2) NOT NULL CHECK (approved_amount > 0), currency CHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'),
  approval_date DATE, scheduled_disbursement_date DATE, status fiscal_tranche_status NOT NULL DEFAULT 'PLANNED', notes TEXT,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(project_id, tranche_number), UNIQUE(commitment_id, tranche_number)
);
CREATE TABLE project_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  tranche_id UUID NOT NULL REFERENCES project_tranches(id) ON DELETE RESTRICT, disbursement_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0), currency CHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'), disbursement_date DATE NOT NULL,
  payment_status fiscal_payment_status NOT NULL DEFAULT 'PENDING', payment_method TEXT, source_reference TEXT, notes TEXT,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE project_expenditures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  disbursement_id UUID REFERENCES project_disbursements(id) ON DELETE RESTRICT, expenditure_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0), currency CHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'), expenditure_date DATE NOT NULL,
  expenditure_category fiscal_expenditure_category NOT NULL, description TEXT NOT NULL, verification_status fiscal_verification_status NOT NULL DEFAULT 'PENDING',
  verified_by UUID REFERENCES profiles(id), verified_at TIMESTAMPTZ, source_document_id UUID REFERENCES project_documents(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_funding_project_status ON project_funding(project_id, funding_status);
CREATE INDEX idx_project_funding_source_year ON project_funding(funding_source, fiscal_year);
CREATE INDEX idx_project_commitments_project_status ON project_commitments(project_id, status);
CREATE INDEX idx_project_commitments_contractor ON project_commitments(contractor_id);
CREATE INDEX idx_project_tranches_commitment ON project_tranches(commitment_id, status);
CREATE INDEX idx_project_disbursements_tranche_date ON project_disbursements(tranche_id, disbursement_date);
CREATE INDEX idx_project_expenditures_project_status ON project_expenditures(project_id, verification_status);
CREATE INDEX idx_project_expenditures_disbursement_date ON project_expenditures(disbursement_id, expenditure_date);

CREATE OR REPLACE FUNCTION validate_phase11_relationships() RETURNS trigger AS $$
DECLARE parent_project UUID; parent_currency CHAR(3); parent_amount NUMERIC; used_amount NUMERIC;
BEGIN
  IF TG_TABLE_NAME = 'project_commitments' THEN
    SELECT currency, budget INTO parent_currency, parent_amount FROM projects WHERE id = NEW.project_id;
    IF parent_currency IS NULL OR parent_currency <> NEW.currency THEN RAISE EXCEPTION 'Commitment project currency mismatch'; END IF;
    SELECT COALESCE(SUM(committed_amount), 0) INTO used_amount FROM project_commitments WHERE project_id = NEW.project_id AND status <> 'CANCELLED' AND id <> NEW.id;
    IF used_amount + NEW.committed_amount > parent_amount THEN RAISE EXCEPTION 'Commitment exceeds project allocation'; END IF;
  ELSIF TG_TABLE_NAME = 'project_tranches' THEN
    SELECT project_id, currency, committed_amount INTO parent_project, parent_currency, parent_amount FROM project_commitments WHERE id = NEW.commitment_id;
    IF parent_project IS NULL OR parent_project <> NEW.project_id OR parent_currency <> NEW.currency THEN RAISE EXCEPTION 'Tranche commitment relationship or currency mismatch'; END IF;
    IF NEW.approved_amount > parent_amount THEN RAISE EXCEPTION 'Tranche exceeds commitment'; END IF;
  ELSIF TG_TABLE_NAME = 'project_disbursements' THEN
    SELECT project_id, currency INTO parent_project, parent_currency FROM project_tranches WHERE id = NEW.tranche_id;
    IF parent_project IS NULL OR parent_project <> NEW.project_id OR parent_currency <> NEW.currency THEN RAISE EXCEPTION 'Disbursement tranche relationship or currency mismatch'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.tranche_id::text, 0));
    SELECT approved_amount INTO parent_amount FROM project_tranches WHERE id = NEW.tranche_id;
    SELECT COALESCE(SUM(amount), 0) INTO used_amount FROM project_disbursements WHERE tranche_id = NEW.tranche_id AND payment_status IN ('APPROVED','DISBURSED') AND id <> NEW.id;
    IF used_amount + NEW.amount > parent_amount THEN RAISE EXCEPTION 'Disbursement exceeds tranche'; END IF;
  ELSIF TG_TABLE_NAME = 'project_expenditures' AND NEW.disbursement_id IS NOT NULL THEN
    SELECT project_id, currency INTO parent_project, parent_currency FROM project_disbursements WHERE id = NEW.disbursement_id;
    IF parent_project IS NULL OR parent_project <> NEW.project_id OR parent_currency <> NEW.currency THEN RAISE EXCEPTION 'Expenditure disbursement relationship or currency mismatch'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.disbursement_id::text, 0));
    SELECT amount INTO parent_amount FROM project_disbursements WHERE id = NEW.disbursement_id;
    SELECT COALESCE(SUM(amount), 0) INTO used_amount FROM project_expenditures WHERE disbursement_id = NEW.disbursement_id AND verification_status <> 'REJECTED' AND id <> NEW.id;
    IF used_amount + NEW.amount > parent_amount THEN RAISE EXCEPTION 'Expenditure exceeds disbursement'; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER validate_phase11_tranches BEFORE INSERT OR UPDATE ON project_tranches FOR EACH ROW EXECUTE FUNCTION validate_phase11_relationships();
CREATE TRIGGER validate_phase11_commitments BEFORE INSERT OR UPDATE ON project_commitments FOR EACH ROW EXECUTE FUNCTION validate_phase11_relationships();
CREATE TRIGGER validate_phase11_disbursements BEFORE INSERT OR UPDATE ON project_disbursements FOR EACH ROW EXECUTE FUNCTION validate_phase11_relationships();
CREATE TRIGGER validate_phase11_expenditures BEFORE INSERT OR UPDATE ON project_expenditures FOR EACH ROW EXECUTE FUNCTION validate_phase11_relationships();

ALTER TABLE project_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tranches ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenditures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved fiscal funding" ON project_funding FOR SELECT USING (funding_status IN ('APPROVED','ACTIVE','CLOSED') AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'));
CREATE POLICY "Public can view approved commitments" ON project_commitments FOR SELECT USING (status IN ('APPROVED','ACTIVE','COMPLETED') AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'));
CREATE POLICY "Public can view approved tranches" ON project_tranches FOR SELECT USING (status IN ('APPROVED','PARTIALLY_DISBURSED','DISBURSED') AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'));
CREATE POLICY "Public can view disbursed payments" ON project_disbursements FOR SELECT USING (payment_status = 'DISBURSED' AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'));
CREATE POLICY "Public can view verified expenditure" ON project_expenditures FOR SELECT USING (verification_status = 'VERIFIED' AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.verification_status = 'VERIFIED'));

CREATE POLICY "Authorized officers can read fiscal records" ON project_funding FOR SELECT USING (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)));
CREATE POLICY "Authorized officers can read commitments" ON project_commitments FOR SELECT USING (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)));
CREATE POLICY "Authorized officers can read tranches" ON project_tranches FOR SELECT USING (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)));
CREATE POLICY "Authorized officers can read disbursements" ON project_disbursements FOR SELECT USING (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)));
CREATE POLICY "Authorized officers can read expenditures" ON project_expenditures FOR SELECT USING (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)));

CREATE POLICY "Authorized fiscal managers can create funding" ON project_funding FOR INSERT WITH CHECK (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)) AND public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN'));
CREATE POLICY "Authorized fiscal managers can create commitments" ON project_commitments FOR INSERT WITH CHECK (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)) AND public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN'));
CREATE POLICY "Authorized fiscal managers can create tranches" ON project_tranches FOR INSERT WITH CHECK (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)) AND public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN'));
CREATE POLICY "Authorized fiscal managers can create disbursements" ON project_disbursements FOR INSERT WITH CHECK (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)) AND public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN'));
CREATE POLICY "Authorized fiscal managers can create expenditures" ON project_expenditures FOR INSERT WITH CHECK (public.has_jurisdiction_over_project((SELECT region_id FROM projects WHERE id = project_id), (SELECT district_id FROM projects WHERE id = project_id)) AND public.current_user_role() IN ('MMDCE_OFFICER','REGIONAL_OFFICER','NATIONAL_MONITOR','SUPER_ADMIN'));

-- Posted rows are immutable at the database policy layer; corrections use reversal/cancellation rows.
CREATE POLICY "Fiscal records are not deleted" ON project_disbursements FOR DELETE USING (false);
CREATE POLICY "Fiscal expenditures are not deleted" ON project_expenditures FOR DELETE USING (false);
CREATE POLICY "Fiscal commitments are not deleted" ON project_commitments FOR DELETE USING (false);
CREATE POLICY "Fiscal tranches are not deleted" ON project_tranches FOR DELETE USING (false);
CREATE POLICY "Fiscal funding is not deleted" ON project_funding FOR DELETE USING (false);

CREATE OR REPLACE VIEW project_fiscal_summary AS
SELECT p.id AS project_id, p.currency,
 COALESCE((SELECT SUM(allocated_amount) FROM project_funding f WHERE f.project_id = p.id AND f.funding_status <> 'CANCELLED'),0) AS total_allocated,
 COALESCE((SELECT SUM(committed_amount) FROM project_commitments c WHERE c.project_id = p.id AND c.status <> 'CANCELLED'),0) AS total_committed,
 COALESCE((SELECT SUM(approved_amount) FROM project_tranches t WHERE t.project_id = p.id AND t.status <> 'CANCELLED'),0) AS total_tranche_value,
 COALESCE((SELECT SUM(amount) FROM project_disbursements d WHERE d.project_id = p.id AND d.payment_status = 'DISBURSED'),0) AS total_disbursed,
 COALESCE((SELECT SUM(amount) FROM project_expenditures e WHERE e.project_id = p.id),0) AS total_reported_expenditure,
 COALESCE((SELECT SUM(amount) FROM project_expenditures e WHERE e.project_id = p.id AND e.verification_status = 'VERIFIED'),0) AS verified_expenditure
FROM projects p;
