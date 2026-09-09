-- ==============================================================================
-- GHANABUILD 2.0 — ROW LEVEL SECURITY (RLS) POLICIES & JURISDICTION SECURITY
-- Migration: 20260908000002_rls_policies.sql
-- Description: RLS enabled on all 17 tables with role & jurisdiction authorization.
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY HELPER FUNCTIONS (Runs in database security context)
-- ==============================================================================

-- Returns current authenticated user profile
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles AS $$
    SELECT * FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
        AND role = 'SUPER_ADMIN'
        AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if user is MODERATOR or higher
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
        AND role IN ('MODERATOR', 'SUPER_ADMIN')
        AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if user has jurisdiction over a project (Section 7)
CREATE OR REPLACE FUNCTION public.has_jurisdiction_over_project(p_region_id UUID, p_district_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_prof public.profiles;
BEGIN
    SELECT * INTO user_prof FROM public.profiles
    WHERE auth_user_id = auth.uid()
    AND is_active = TRUE;

    IF user_prof.role = 'SUPER_ADMIN' OR user_prof.role = 'NATIONAL_MONITOR' THEN
        RETURN TRUE;
    END IF;

    IF user_prof.role = 'REGIONAL_OFFICER' AND user_prof.region_id = p_region_id THEN
        RETURN TRUE;
    END IF;

    IF user_prof.role = 'MMDCE_OFFICER' AND user_prof.district_id = p_district_id THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ==============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLICIES: TAXONOMY & GEOGRAPHY (Public Read, Admin Write)
-- ==============================================================================

-- 3.1 Roles (Read for all, Write for Super Admin)
CREATE POLICY "Public can view roles" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage roles" ON roles
    FOR ALL USING (public.is_super_admin());

-- 3.2 Regions (Read for all, Super Admin Write)
CREATE POLICY "Public can view regions" ON regions
    FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage regions" ON regions
    FOR ALL USING (public.is_super_admin());

-- 3.3 Districts (Read for all, Super Admin Write)
CREATE POLICY "Public can view districts" ON districts
    FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage districts" ON districts
    FOR ALL USING (public.is_super_admin());

-- 3.4 Communities (Read for all, Officers/Admin Write)
CREATE POLICY "Public can view communities" ON communities
    FOR SELECT USING (true);

CREATE POLICY "Officers and Admin can insert communities" ON communities
    FOR INSERT WITH CHECK (
        public.is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid()
            AND p.role IN ('MMDCE_OFFICER', 'REGIONAL_OFFICER')
            AND p.is_active = TRUE
        )
    );

-- 3.5 Categories (Read for all, Admin Write)
CREATE POLICY "Public can view project categories" ON project_categories
    FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage categories" ON project_categories
    FOR ALL USING (public.is_super_admin());

-- 3.6 Contractors (Read for all, Officers/Admin Write)
CREATE POLICY "Public can view contractors" ON contractors
    FOR SELECT USING (true);

CREATE POLICY "Officers and Admin can manage contractors" ON contractors
    FOR ALL USING (
        public.is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid()
            AND p.role IN ('MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR')
            AND p.is_active = TRUE
        )
    );

-- ==============================================================================
-- 4. POLICIES: PROFILES (Rule 4 & Section 8)
-- ==============================================================================

-- Anyone can view basic public profile info of active users
CREATE POLICY "Public can view active profiles" ON profiles
    FOR SELECT USING (is_active = TRUE);

-- Users can update their own personal info (name, phone, avatar)
-- Role, region_id, and district_id cannot be changed by the user directly
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth_user_id = auth.uid())
    WITH CHECK (
        auth_user_id = auth.uid() AND
        role = (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) AND
        region_id IS NOT DISTINCT FROM (SELECT region_id FROM profiles WHERE auth_user_id = auth.uid()) AND
        district_id IS NOT DISTINCT FROM (SELECT district_id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- Super Admin can view and modify any profile (assign roles/jurisdictions)
CREATE POLICY "Super Admin has full access to profiles" ON profiles
    FOR ALL USING (public.is_super_admin());

-- ==============================================================================
-- 5. POLICIES: PROJECTS (Section 11, 12 & Jurisdiction Model)
-- ==============================================================================

-- Public can view VERIFIED projects
-- Officers can view ALL projects in their jurisdiction
-- Submitters can view their own projects
-- Super Admin and National Monitor can view ALL projects
CREATE POLICY "Select projects policy" ON projects
    FOR SELECT USING (
        verification_status = 'VERIFIED' OR
        created_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        public.has_jurisdiction_over_project(region_id, district_id) OR
        public.is_moderator_or_admin()
    );

-- Citizens can submit new projects (must be created as PENDING)
CREATE POLICY "Citizens can submit projects" ON projects
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        verification_status = 'PENDING' AND
        created_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- Authorized officers and admins can update projects in their jurisdiction
CREATE POLICY "Officers can update projects in jurisdiction" ON projects
    FOR UPDATE USING (
        public.has_jurisdiction_over_project(region_id, district_id)
    ) WITH CHECK (
        public.has_jurisdiction_over_project(region_id, district_id)
    );

-- Only Super Admin can delete/archive projects
CREATE POLICY "Super Admin can delete projects" ON projects
    FOR DELETE USING (public.is_super_admin());

-- ==============================================================================
-- 6. POLICIES: PROJECT UPDATES (Section 14)
-- ==============================================================================

-- Public can view updates for verified projects
CREATE POLICY "Public can view project updates" ON project_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (
                p.verification_status = 'VERIFIED' OR
                public.has_jurisdiction_over_project(p.region_id, p.district_id)
            )
        )
    );

-- Officers in jurisdiction and admins can create updates
CREATE POLICY "Officers can post project updates" ON project_updates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        ) AND
        created_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- ==============================================================================
-- 7. POLICIES: EVIDENCE & DOCUMENTS (Section 15 & 16)
-- ==============================================================================

-- 7.1 Evidence: Verified evidence visible to public; uploaders view own; officers view jurisdiction
CREATE POLICY "Select evidence policy" ON project_evidence
    FOR SELECT USING (
        verification_status = 'VERIFIED' OR
        uploaded_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (
                public.has_jurisdiction_over_project(p.region_id, p.district_id) OR
                public.is_moderator_or_admin()
            )
        )
    );

-- Authenticated users can upload evidence (defaults to PENDING verification)
CREATE POLICY "Users can upload evidence" ON project_evidence
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        verification_status = 'PENDING' AND
        uploaded_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- Moderators and Jurisdiction Officers can verify/moderate evidence
CREATE POLICY "Officers can moderate evidence" ON project_evidence
    FOR UPDATE USING (
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

-- 7.2 Documents: Visible on verified projects or to authorized officers
CREATE POLICY "Select documents policy" ON project_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (
                p.verification_status = 'VERIFIED' OR
                public.has_jurisdiction_over_project(p.region_id, p.district_id)
            )
        )
    );

CREATE POLICY "Officers can upload documents" ON project_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        ) AND
        uploaded_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- ==============================================================================
-- 8. POLICIES: COMMUNITY REPORTS (Section 17)
-- ==============================================================================

-- Users can view their own reports; Officers/Moderators view reports in jurisdiction
CREATE POLICY "Select reports policy" ON project_reports
    FOR SELECT USING (
        submitted_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

-- Authenticated users can submit reports (starts as OPEN)
CREATE POLICY "Authenticated users can submit reports" ON project_reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        status = 'OPEN' AND
        submitted_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- Officers in jurisdiction and moderators can update/resolve reports
CREATE POLICY "Officers can resolve reports" ON project_reports
    FOR UPDATE USING (
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

-- ==============================================================================
-- 9. POLICIES: COMMENTS & VOTES (Section 18 & 19)
-- ==============================================================================

-- Published comments visible to all; Authors view own; Moderators view all
CREATE POLICY "Select comments policy" ON project_comments
    FOR SELECT USING (
        status = 'PUBLISHED' OR
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        public.is_moderator_or_admin()
    );

CREATE POLICY "Authenticated users can comment" ON project_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Moderators can moderate comments" ON project_comments
    FOR UPDATE USING (public.is_moderator_or_admin());

-- Votes: Public can view vote aggregates; Users manage their own vote
CREATE POLICY "Public can view votes" ON project_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can cast vote" ON project_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can remove own vote" ON project_votes
    FOR DELETE USING (
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- ==============================================================================
-- 10. POLICIES: AUDIT LOGS & NOTIFICATIONS (Section 20, 21, 22)
-- ==============================================================================

-- 10.1 Project Verifications: History visible to officers, moderators, and admins
CREATE POLICY "Select verifications policy" ON project_verifications
    FOR SELECT USING (
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

CREATE POLICY "Authorized reviewers insert verifications" ON project_verifications
    FOR INSERT WITH CHECK (
        public.is_moderator_or_admin() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND public.has_jurisdiction_over_project(p.region_id, p.district_id)
        )
    );

-- 10.2 Audit Logs: STRICTLY IMMUTABLE (Append-only).
-- Only Super Admin and National Monitor can read logs.
-- NO user can UPDATE or DELETE audit logs.
CREATE POLICY "Super Admin and National Monitor can view audit logs" ON audit_logs
    FOR SELECT USING (
        public.is_super_admin() OR
        (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'NATIONAL_MONITOR'
    );

CREATE POLICY "System and authenticated actions can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 10.3 Notifications: Users only see their own notifications
CREATE POLICY "Users view own notifications" ON notifications
    FOR SELECT USING (
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users update own notifications read status" ON notifications
    FOR UPDATE USING (
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    ) WITH CHECK (
        user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );
