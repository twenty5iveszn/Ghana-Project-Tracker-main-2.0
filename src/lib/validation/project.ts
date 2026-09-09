import { z } from 'zod';
import { ProjectStatus, VerificationStatus } from '../../types/project';

export const PROJECT_STATUS_VALUES: [ProjectStatus, ...ProjectStatus[]] = [
  'PLANNED',
  'ONGOING',
  'ON_HOLD',
  'COMPLETED',
  'ABANDONED',
  'CANCELLED',
];

export const VERIFICATION_STATUS_VALUES: [VerificationStatus, ...VerificationStatus[]] = [
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'ARCHIVED',
];

/**
 * Zod schema for creating a project
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(5, 'Project title must be at least 5 characters')
    .max(200, 'Project title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Project description must be at least 10 characters')
    .max(3000, 'Project description cannot exceed 3000 characters')
    .trim(),
  category_id: z.string().min(1, 'Category is required'),
  region_id: z.string().min(1, 'Region is required'),
  district_id: z.string().min(1, 'District assembly is required'),
  community_id: z.string().optional().nullable(),
  location_name: z
    .string()
    .min(2, 'Location name must be at least 2 characters')
    .max(200, 'Location name cannot exceed 200 characters')
    .trim(),
  latitude: z
    .number({ message: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ message: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  contractor_id: z.string().optional().nullable(),
  budget: z
    .number({ message: 'Budget must be a number' })
    .min(0, 'Budget cannot be negative'),
  currency: z.string().default('GHS'),
  start_date: z.string().optional().nullable(),
  expected_completion_date: z.string().optional().nullable(),
  actual_completion_date: z.string().optional().nullable(),
  progress_percentage: z
    .number({ message: 'Progress must be a number' })
    .min(0, 'Progress cannot be less than 0%')
    .max(100, 'Progress cannot exceed 100%')
    .default(0),
  project_status: z.enum(PROJECT_STATUS_VALUES).default('PLANNED'),
  verification_status: z.enum(VERIFICATION_STATUS_VALUES).default('PENDING'),
});

/**
 * Zod schema for updating an existing project
 * Explicitly whitelists editable fields and disallows mass-assignment of system fields
 */
export const updateProjectSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  description: z.string().min(10).max(3000).trim().optional(),
  category_id: z.string().min(1).optional(),
  community_id: z.string().optional().nullable(),
  location_name: z.string().min(2).max(200).trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contractor_id: z.string().optional().nullable(),
  budget: z.number().min(0, 'Budget cannot be negative').optional(),
  currency: z.string().optional(),
  start_date: z.string().optional().nullable(),
  expected_completion_date: z.string().optional().nullable(),
  actual_completion_date: z.string().optional().nullable(),
  progress_percentage: z
    .number()
    .min(0, 'Progress cannot be less than 0%')
    .max(100, 'Progress cannot exceed 100%')
    .optional(),
  project_status: z.enum(PROJECT_STATUS_VALUES).optional(),
  verification_status: z.enum(VERIFICATION_STATUS_VALUES).optional(),
});

/**
 * Zod schema for creating an official project timeline update
 */
export const createProjectUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Update title must be at least 3 characters')
    .max(150, 'Update title cannot exceed 150 characters')
    .trim(),
  description: z
    .string()
    .min(5, 'Update description must be at least 5 characters')
    .max(2000, 'Update description cannot exceed 2000 characters')
    .trim(),
  progress_percentage: z
    .number({ message: 'Progress must be a number' })
    .min(0, 'Progress cannot be less than 0%')
    .max(100, 'Progress cannot exceed 100%'),
  status: z.enum(PROJECT_STATUS_VALUES),
});

/**
 * Zod schema for creating or updating contractors
 */
export const createContractorSchema = z.object({
  name: z
    .string()
    .min(2, 'Contractor name must be at least 2 characters')
    .max(200, 'Contractor name cannot exceed 200 characters')
    .trim(),
  registration_number: z.string().max(100).optional().nullable(),
  contact_email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(50).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and hyphens').optional(),
  tin_number: z.string().max(100).optional().nullable(),
  category_specialization: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'SUSPENDED']).optional(),
  year_established: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateProjectUpdateInput = z.infer<typeof createProjectUpdateSchema>;
export type CreateContractorInput = z.infer<typeof createContractorSchema>;

export const REPORT_TYPE_VALUES = [
  'DELAYED',
  'POOR_WORKMANSHIP',
  'ABANDONED',
  'INCORRECT_INFORMATION',
  'ENVIRONMENTAL_CONCERN',
  'SAFETY_CONCERN',
  'OTHER',
] as const;

export const REPORT_SEVERITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const REPORT_STATUS_VALUES = [
  'OPEN',
  'UNDER_REVIEW',
  'ACKNOWLEDGED',
  'RESOLVED',
  'REJECTED',
] as const;

export const createProjectReportSchema = z.object({
  report_type: z.enum(REPORT_TYPE_VALUES, {
    message: 'Please select a valid report issue category',
  }),
  description: z
    .string({ message: 'Description is required' })
    .min(10, 'Observation description must be at least 10 characters')
    .max(2500, 'Observation description cannot exceed 2500 characters')
    .trim(),
  severity: z.enum(REPORT_SEVERITY_VALUES).default('MEDIUM'),
  location_notes: z.string().max(300).optional().nullable(),
  evidence_url: z.string().url('Invalid evidence URL').optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(30).optional().nullable(),
  project_title: z.string().optional().nullable(),
  community: z.string().optional().nullable(),
});

export const resolveProjectReportSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED'], {
    message: 'Please select a valid resolution status',
  }),
  resolution_notes: z
    .string({ message: 'Resolution audit notes are required' })
    .min(5, 'Resolution note must be at least 5 characters')
    .max(2000, 'Resolution note cannot exceed 2000 characters')
    .trim(),
});

export const createProjectCommentSchema = z.object({
  content: z
    .string({ message: 'Comment content is required' })
    .min(3, 'Comment must be at least 3 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim(),
});

export const castVoteSchema = z.object({
  vote_type: z.enum(['UPVOTE', 'DOWNVOTE'], {
    message: 'Vote type must be UPVOTE or DOWNVOTE',
  }),
});

export type CreateProjectReportInput = z.infer<typeof createProjectReportSchema>;
export type ResolveProjectReportInput = z.infer<typeof resolveProjectReportSchema>;
export type CreateProjectCommentInput = z.infer<typeof createProjectCommentSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;

const fiscalAmount = z.number({ message: 'Amount must be a number' }).finite().positive('Amount must be greater than zero');
const fiscalDate = z.string().min(1, 'Date is required').refine((value) => !Number.isNaN(Date.parse(value)), 'Date must be valid');
const fiscalCurrency = z.string().trim().regex(/^[A-Z]{3}$/, 'Currency must be a three-letter ISO code');
const fiscalYear = z.number().int().min(2000).max(new Date().getFullYear() + 1);

export const createFundingSchema = z.object({ funding_source: z.string().min(2).max(200).trim(), funding_reference: z.string().max(120).optional().nullable(), allocated_amount: fiscalAmount, currency: fiscalCurrency.default('GHS'), allocation_date: fiscalDate, fiscal_year: fiscalYear, funding_status: z.enum(['PROPOSED', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'CANCELLED']).default('PROPOSED'), notes: z.string().max(2000).optional().nullable() });
export const createCommitmentSchema = z.object({ contractor_id: z.string().optional().nullable(), commitment_reference: z.string().min(2).max(120).trim(), committed_amount: fiscalAmount, currency: fiscalCurrency.default('GHS'), commitment_date: fiscalDate, approved_by: z.string().optional().nullable(), status: z.enum(['PROPOSED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PROPOSED'), notes: z.string().max(2000).optional().nullable() });
export const createTrancheSchema = z.object({ commitment_id: z.string().min(1), tranche_number: z.number().int().positive(), tranche_name: z.string().min(2).max(160).trim(), approved_amount: fiscalAmount, currency: fiscalCurrency.default('GHS'), approval_date: fiscalDate.optional().nullable(), scheduled_disbursement_date: fiscalDate.optional().nullable(), status: z.enum(['PLANNED', 'APPROVED', 'PARTIALLY_DISBURSED', 'DISBURSED', 'SUSPENDED', 'CANCELLED']).default('PLANNED'), notes: z.string().max(2000).optional().nullable() });
export const createDisbursementSchema = z.object({ tranche_id: z.string().min(1), disbursement_reference: z.string().min(2).max(120).trim(), amount: fiscalAmount, currency: fiscalCurrency.default('GHS'), disbursement_date: fiscalDate, payment_status: z.enum(['PENDING', 'APPROVED', 'DISBURSED', 'REVERSED', 'CANCELLED']).default('DISBURSED'), payment_method: z.string().max(80).optional().nullable(), source_reference: z.string().max(160).optional().nullable(), notes: z.string().max(2000).optional().nullable() });
export const createExpenditureSchema = z.object({ disbursement_id: z.string().optional().nullable(), expenditure_reference: z.string().min(2).max(120).trim(), amount: fiscalAmount, currency: fiscalCurrency.default('GHS'), expenditure_date: fiscalDate, expenditure_category: z.enum(['LABOUR', 'MATERIALS', 'EQUIPMENT', 'TRANSPORT', 'PROFESSIONAL_SERVICES', 'LAND', 'ADMINISTRATION', 'OTHER']), description: z.string().min(5).max(2000).trim(), source_document_id: z.string().optional().nullable() });

export const createFieldInspectionSchema = z.object({
  client_id: z.string().min(8).max(160), inspection_reference: z.string().min(3).max(160), inspection_date: fiscalDate,
  inspection_type: z.enum(['ROUTINE', 'PROGRESS', 'QUALITY', 'SAFETY', 'COMPLETION', 'FOLLOW_UP', 'OTHER']),
  observed_status: z.enum(PROJECT_STATUS_VALUES), observed_progress_percentage: z.number().finite().min(0).max(100),
  observations: z.string().min(5).max(5000).trim(), issues_found: z.array(z.enum(['DELAYED_WORK', 'POOR_WORKMANSHIP', 'INCOMPLETE_WORK', 'SAFETY_CONCERN', 'ENVIRONMENTAL_CONCERN', 'MISSING_MATERIALS', 'SITE_INACTIVITY', 'INCORRECT_INFORMATION', 'OTHER'])).max(20),
  safety_observations: z.string().max(3000).optional().nullable(), environmental_observations: z.string().max(3000).optional().nullable(),
  latitude: z.number().finite().min(-90).max(90).optional().nullable(), longitude: z.number().finite().min(-180).max(180).optional().nullable(), gps_accuracy: z.number().finite().min(0).max(100000).optional().nullable(),
  captured_at: fiscalDate, device_timestamp: fiscalDate,
});
