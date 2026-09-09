-- ============================================================================
-- Phase 10: Contractor Accountability & Performance Scorecards Migration
-- ============================================================================

-- 1. Extend contractors table with performance metadata & slug
ALTER TABLE contractors 
    ADD COLUMN IF NOT EXISTS slug VARCHAR(200) UNIQUE,
    ADD COLUMN IF NOT EXISTS tin_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS category_specialization VARCHAR(100),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED')),
    ADD COLUMN IF NOT EXISTS year_established INTEGER;

-- 2. Ensure indexes exist for rapid search, filtering & relational joins
CREATE INDEX IF NOT EXISTS idx_contractors_slug ON contractors(slug);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_specialization ON contractors(category_specialization);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects(contractor_id);

-- 3. Additional RLS confirmation for Phase 10 Contractor Dossier Access
-- Public read access allows citizens to transparently scrutinize contractor execution
-- Only verified officers and super admins can register or mutate contractor profiles
CREATE POLICY "Public can view contractor profiles and scorecards" ON contractors
    FOR SELECT USING (true);

-- 4. Create Materialized / Real-Time View for Contractor Accountability Metrics
CREATE OR REPLACE VIEW contractor_performance_summary AS
SELECT 
    c.id AS contractor_id,
    c.name AS contractor_name,
    c.slug AS contractor_slug,
    c.status AS contractor_status,
    c.category_specialization,
    COUNT(p.id) AS total_projects,
    COUNT(p.id) FILTER (WHERE p.project_status = 'COMPLETED') AS completed_projects,
    COUNT(p.id) FILTER (WHERE p.project_status = 'ONGOING') AS ongoing_projects,
    COUNT(p.id) FILTER (WHERE p.project_status = 'ABANDONED') AS abandoned_projects,
    COUNT(p.id) FILTER (WHERE p.project_status != 'COMPLETED' AND p.expected_completion_date < CURRENT_DATE) AS delayed_projects,
    COALESCE(SUM(p.budget), 0) AS total_budget_managed,
    COALESCE(SUM(p.budget) FILTER (WHERE p.project_status = 'COMPLETED'), 0) AS total_budget_delivered,
    COALESCE(AVG(p.progress_percentage) FILTER (WHERE p.project_status = 'ONGOING'), 0) AS avg_ongoing_progress,
    COUNT(DISTINCT p.region_id) AS active_regions_count,
    COUNT(DISTINCT p.district_id) AS active_districts_count
FROM contractors c
LEFT JOIN projects p ON p.contractor_id = c.id
GROUP BY c.id, c.name, c.slug, c.status, c.category_specialization;
