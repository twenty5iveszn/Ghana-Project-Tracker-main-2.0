import { z } from 'zod';

export const userRoleEnum = z.enum([
  'CITIZEN',
  'COMMUNITY_OBSERVER',
  'MMDCE_OFFICER',
  'REGIONAL_OFFICER',
  'NATIONAL_MONITOR',
  'MODERATOR',
  'SUPER_ADMIN',
]);

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
    requested_role: userRoleEnum.default('CITIZEN'),
    organization: z.string().optional().or(z.literal('')),
    region_id: z.string().uuid('Invalid region ID').optional().or(z.literal('')),
    district_id: z.string().uuid('Invalid district ID').optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().max(25).optional().or(z.literal('')),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  organization: z.string().max(150).optional().or(z.literal('')),
  // Notice: role, region_id, and district_id are excluded here.
  // Standard users cannot alter their role or jurisdiction.
});

export const assignRoleSchema = z.object({
  target_user_id: z.string().uuid('Invalid user ID'),
  role: userRoleEnum,
  region_id: z.string().uuid('Invalid region ID').nullable().optional(),
  district_id: z.string().uuid('Invalid district ID').nullable().optional(),
  organization: z.string().max(150).nullable().optional(),
  reason: z.string().min(5, 'Reason for role assignment is required for audit logs'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
