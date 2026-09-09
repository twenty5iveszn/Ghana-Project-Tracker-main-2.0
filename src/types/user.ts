/**
 * GhanaBuild 2.0 User and Role Definitions
 * Strictly maps to Section 6 & 7 of the specification.
 */

export type UserRole =
  | 'CITIZEN'
  | 'COMMUNITY_OBSERVER'
  | 'MMDCE_OFFICER'
  | 'REGIONAL_OFFICER'
  | 'NATIONAL_MONITOR'
  | 'MODERATOR'
  | 'SUPER_ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  region_id?: string | null;
  district_id?: string | null;
  region_name?: string | null;
  district_name?: string | null;
  organization?: string | null;
  is_active: boolean;
  account_status?: AccountStatus;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Jurisdiction {
  region_id?: string | null;
  region_name?: string | null;
  district_id?: string | null;
  district_name?: string | null;
}

export interface SystemSettings {
  platform_name: string;
  default_page_size: number;
  public_submissions_enabled: boolean;
  community_reporting_enabled: boolean;
  civic_comments_enabled: boolean;
  evidence_max_file_size_mb?: number;
  evidence_upload_max_mb?: number;
  maintenance_mode: boolean;
  require_phone_for_problem_reports?: boolean;
  require_report_phone?: boolean;
  audit_log_retention_years?: number;
  audit_retention_years?: number;
  version?: number;
  updated_at: string;
  updated_by: string;
}
