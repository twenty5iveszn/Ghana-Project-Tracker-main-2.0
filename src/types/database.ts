/**
 * GhanaBuild 2.0 Database Schema Types
 * Strongly typed representation of the 17 core PostgreSQL tables.
 */

import { UserRole } from './user';
import {
  ProjectStatus,
  VerificationStatus,
  EvidenceType,
  ReportType,
  ReportSeverity,
  ReportStatus,
  ProjectFunding,
  ProjectCommitment,
  ProjectTranche,
  ProjectDisbursement,
  ProjectExpenditure,
  FieldInspection,
} from './project';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          region_id: string | null;
          district_id: string | null;
          organization: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      roles: {
        Row: {
          id: string;
          name: UserRole;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
      };
      regions: {
        Row: {
          id: string;
          name: string;
          code: string;
          capital: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['regions']['Insert']>;
      };
      districts: {
        Row: {
          id: string;
          region_id: string;
          name: string;
          district_type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['districts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['districts']['Insert']>;
      };
      communities: {
        Row: {
          id: string;
          district_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['communities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['communities']['Insert']>;
      };
      project_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_categories']['Insert']>;
      };
      contractors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          registration_number: string | null;
          tin_number: string | null;
          category_specialization: string | null;
          description: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          website: string | null;
          status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
          year_established: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contractors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contractors']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          category_id: string;
          region_id: string;
          district_id: string;
          community_id: string | null;
          location_name: string;
          latitude: number;
          longitude: number;
          contractor_id: string | null;
          budget: number;
          currency: string;
          start_date: string | null;
          expected_completion_date: string | null;
          actual_completion_date: string | null;
          progress_percentage: number;
          project_status: ProjectStatus;
          verification_status: VerificationStatus;
          created_by: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      project_funding: {
        Row: ProjectFunding;
        Insert: Omit<ProjectFunding, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_funding']['Insert']>;
      };
      project_commitments: {
        Row: ProjectCommitment;
        Insert: Omit<ProjectCommitment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_commitments']['Insert']>;
      };
      project_tranches: {
        Row: ProjectTranche;
        Insert: Omit<ProjectTranche, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_tranches']['Insert']>;
      };
      project_disbursements: {
        Row: ProjectDisbursement;
        Insert: Omit<ProjectDisbursement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_disbursements']['Insert']>;
      };
      project_expenditures: {
        Row: ProjectExpenditure;
        Insert: Omit<ProjectExpenditure, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_expenditures']['Insert']>;
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          progress_percentage: number;
          status: ProjectStatus;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_updates']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_updates']['Insert']>;
      };
      project_evidence: {
        Row: {
          id: string;
          project_id: string;
          uploaded_by: string;
          file_url: string;
          file_type: string;
          file_size: number;
          caption: string | null;
          evidence_type: EvidenceType;
          captured_at: string | null;
          latitude: number | null;
          longitude: number | null;
          verification_status: VerificationStatus;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          inspection_id: string | null;
          client_evidence_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['project_evidence']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_evidence']['Insert']>;
      };
      field_inspections: {
        Row: FieldInspection;
        Insert: Omit<FieldInspection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['field_inspections']['Insert']>;
      };
      project_documents: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          file_url: string;
          document_type: string;
          file_size: number;
          is_public: boolean;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_documents']['Insert']>;
      };
      project_reports: {
        Row: {
          id: string;
          project_id: string;
          submitted_by: string;
          report_type: ReportType;
          description: string;
          severity: ReportSeverity;
          status: ReportStatus;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['project_reports']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_reports']['Insert']>;
      };
      project_comments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          content: string;
          status: 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REMOVED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_comments']['Insert']>;
      };
      project_votes: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          vote_type: 'UPVOTE' | 'FLAG';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_votes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_votes']['Insert']>;
      };
      project_verifications: {
        Row: {
          id: string;
          project_id: string;
          reviewer_id: string;
          previous_status: VerificationStatus;
          new_status: VerificationStatus;
          decision: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_verifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_verifications']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          reason: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
