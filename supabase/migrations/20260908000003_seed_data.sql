-- ==============================================================================
-- GHANABUILD 2.0 — REFERENCE SEED DATA
-- Migration: 20260908000003_seed_data.sql
-- Description: Seeds the 16 Regions of Ghana, sample districts, project categories, and system roles.
-- ==============================================================================

-- ==============================================================================
-- 1. SEED SYSTEM ROLES (Section 6)
-- ==============================================================================

INSERT INTO roles (name, description) VALUES
    ('CITIZEN', 'Public citizen: Discover, browse, comment, submit infrastructure proposals and reports.'),
    ('COMMUNITY_OBSERVER', 'Trusted community observer: Field evidence submission and local monitoring.'),
    ('MMDCE_OFFICER', 'Local Government Officer: Manages projects and reviews submissions within assigned MMDA district.'),
    ('REGIONAL_OFFICER', 'Regional Coordinating Council Officer: Monitors projects across all districts in the assigned region.'),
    ('NATIONAL_MONITOR', 'National Infrastructure Monitoring Body: Cross-regional analytics, auditing, and high-level verification.'),
    ('MODERATOR', 'Content Moderator: Reviews citizen submissions, evidence, comments, and reports for standards compliance.'),
    ('SUPER_ADMIN', 'Platform Administrator: Full user management, role assignments, system config, and audit trail oversight.')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 2. SEED ALL 16 REGIONS OF GHANA (Section 9)
-- ==============================================================================

INSERT INTO regions (name, code, capital) VALUES
    ('Greater Accra', 'GAR', 'Accra'),
    ('Ashanti', 'ASH', 'Kumasi'),
    ('Western', 'WR', 'Sekondi-Takoradi'),
    ('Western North', 'WN', 'Sefwi Wiawso'),
    ('Central', 'CR', 'Cape Coast'),
    ('Eastern', 'ER', 'Koforidua'),
    ('Volta', 'VR', 'Ho'),
    ('Oti', 'OR', 'Dambai'),
    ('Northern', 'NR', 'Tamale'),
    ('Savannah', 'SR', 'Damongo'),
    ('North East', 'NE', 'Nalerigu'),
    ('Upper East', 'UE', 'Bolgatanga'),
    ('Upper West', 'UW', 'Wa'),
    ('Bono', 'BR', 'Sunyani'),
    ('Bono East', 'BE', 'Techiman'),
    ('Ahafo', 'AH', 'Goaso')
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    capital = EXCLUDED.capital;

-- ==============================================================================
-- 3. SEED REPRESENTATIVE SAMPLE DISTRICTS (MMDAs)
-- ==============================================================================

DO $$
DECLARE
    r_accra UUID;
    r_ashanti UUID;
    r_volta UUID;
    r_northern UUID;
    r_central UUID;
    r_western UUID;
    r_bono UUID;
    r_ue UUID;
    r_uw UUID;
BEGIN
    SELECT id INTO r_accra FROM regions WHERE code = 'GAR';
    SELECT id INTO r_ashanti FROM regions WHERE code = 'ASH';
    SELECT id INTO r_volta FROM regions WHERE code = 'VR';
    SELECT id INTO r_northern FROM regions WHERE code = 'NR';
    SELECT id INTO r_central FROM regions WHERE code = 'CR';
    SELECT id INTO r_western FROM regions WHERE code = 'WR';
    SELECT id INTO r_bono FROM regions WHERE code = 'BR';
    SELECT id INTO r_ue FROM regions WHERE code = 'UE';
    SELECT id INTO r_uw FROM regions WHERE code = 'UW';

    -- Greater Accra MMDAs
    IF r_accra IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_accra, 'Accra Metropolitan', 'METROPOLITAN'),
            (r_accra, 'Tema Metropolitan', 'METROPOLITAN'),
            (r_accra, 'Ga East Municipal', 'MUNICIPAL'),
            (r_accra, 'Ga West Municipal', 'MUNICIPAL'),
            (r_accra, 'Ayawaso West Municipal', 'MUNICIPAL'),
            (r_accra, 'Ada East District', 'DISTRICT')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Ashanti MMDAs
    IF r_ashanti IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_ashanti, 'Kumasi Metropolitan', 'METROPOLITAN'),
            (r_ashanti, 'Asokwa Municipal', 'MUNICIPAL'),
            (r_ashanti, 'Oforikrom Municipal', 'MUNICIPAL'),
            (r_ashanti, 'Obuasi Municipal', 'MUNICIPAL'),
            (r_ashanti, 'Ejisu Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Volta MMDAs
    IF r_volta IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_volta, 'Ho Municipal', 'MUNICIPAL'),
            (r_volta, 'Keta Municipal', 'MUNICIPAL'),
            (r_volta, 'Hohoe Municipal', 'MUNICIPAL'),
            (r_volta, 'South Dayi District', 'DISTRICT')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Northern MMDAs
    IF r_northern IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_northern, 'Tamale Metropolitan', 'METROPOLITAN'),
            (r_northern, 'Sagnarigu Municipal', 'MUNICIPAL'),
            (r_northern, 'Yendi Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Central MMDAs
    IF r_central IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_central, 'Cape Coast Metropolitan', 'METROPOLITAN'),
            (r_central, 'Kormantse District', 'DISTRICT'),
            (r_central, 'Mfantseman Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Western MMDAs
    IF r_western IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_western, 'Sekondi-Takoradi Metropolitan', 'METROPOLITAN'),
            (r_western, 'Tarkwa-Nsuaem Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Bono MMDAs
    IF r_bono IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_bono, 'Sunyani Municipal', 'MUNICIPAL'),
            (r_bono, 'Berekum East Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    -- Upper East & Upper West
    IF r_ue IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_ue, 'Bolgatanga Municipal', 'MUNICIPAL'),
            (r_ue, 'Kassena Nankana Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;

    IF r_uw IS NOT NULL THEN
        INSERT INTO districts (region_id, name, district_type) VALUES
            (r_uw, 'Wa Municipal', 'MUNICIPAL')
        ON CONFLICT (region_id, name) DO NOTHING;
    END IF;
END $$;

-- ==============================================================================
-- 4. SEED 13 CORE PROJECT CATEGORIES (Section 10)
-- ==============================================================================

INSERT INTO project_categories (name, slug, description, icon) VALUES
    ('Roads & Highways', 'roads', 'National highways, urban asphalt overlays, feeder roads, and rural access corridors.', 'Road'),
    ('Schools & Education', 'schools', 'Basic schools, senior high school complexes, STEM centers, and tertiary facilities.', 'GraduationCap'),
    ('Hospitals & Clinical Centers', 'hospitals', 'District hospitals, regional hospital wings, and specialized medical centers.', 'Building2'),
    ('Health Centres & CHPS', 'health-centres', 'Community-based Health Planning and Services (CHPS) compounds and local clinics.', 'Cross'),
    ('Markets & Commercial Centers', 'markets', 'Modern multi-storey markets, agro-commodity trading hubs, and transport terminals.', 'ShoppingBag'),
    ('Water Supply & Boreholes', 'water', 'Community water treatment plants, urban mains extensions, and mechanized boreholes.', 'Droplet'),
    ('Sanitation & Waste Management', 'sanitation', 'Engineered landfill sites, institutional bio-digester facilities, and public washrooms.', 'Trash2'),
    ('Electricity & Grid Power', 'electricity', 'Rural electrification expansion, transformer substations, and solar mini-grids.', 'Zap'),
    ('Public Housing', 'housing', 'Affordable civic housing estates and public servant accommodation units.', 'Home'),
    ('Bridges & Culverts', 'bridges', 'River crossings, pedestrian overpasses, flyovers, and storm drainage culverts.', 'Network'),
    ('Agriculture & Irrigation', 'agriculture', 'Irrigation dams, warehouses, processing centers, and livestock watering points.', 'Wheat'),
    ('Government Buildings', 'government-buildings', 'MMDA assembly halls, court complexes, police stations, and fire stations.', 'Landmark'),
    ('Other Public Works', 'other', 'Public recreational grounds, community centers, and miscellaneous civic infrastructure.', 'Layers')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;
