import { Request, Response, NextFunction } from 'express';
import { UserRole, Profile } from '../../src/types/user';
import { getSupabaseAdmin } from '../supabase';
import { projectStore } from '../db/project_store';

// Extend Express Request to carry authenticated user & profile
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
      profile?: Profile;
    }
  }
}

/**
 * Role Permission Mapping according to GhanaBuild 2.0 Specifications
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CITIZEN: [
    'projects:read_verified',
    'projects:submit',
    'comments:create',
    'votes:cast',
    'reports:submit',
    'profile:manage_own',
  ],
  COMMUNITY_OBSERVER: [
    'projects:read_verified',
    'projects:submit',
    'comments:create',
    'votes:cast',
    'reports:submit',
    'evidence:upload_field',
    'profile:manage_own',
  ],
  MMDCE_OFFICER: [
    'projects:read_jurisdiction',
    'projects:create_district',
    'projects:update_district',
    'updates:post_district',
    'evidence:verify_district',
    'reports:resolve_district',
    'contractors:manage_district',
    'profile:manage_own',
  ],
  REGIONAL_OFFICER: [
    'projects:read_jurisdiction',
    'projects:update_region',
    'updates:post_region',
    'evidence:verify_region',
    'reports:resolve_region',
    'analytics:regional',
    'profile:manage_own',
  ],
  NATIONAL_MONITOR: [
    'projects:read_all',
    'projects:verify_national',
    'analytics:national',
    'audit_logs:read',
    'reports:read_all',
    'profile:manage_own',
  ],
  MODERATOR: [
    'projects:read_all',
    'comments:moderate',
    'evidence:moderate',
    'reports:moderate',
    'profile:manage_own',
  ],
  SUPER_ADMIN: [
    '*', // All permissions granted
  ],
};

/**
 * Extracts and verifies JWT from Authorization header
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const actorRoleHeader = req.headers['x-actor-role'] as string | undefined;
  const actorIdHeader = req.headers['x-actor-id'] as string | undefined;

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Test identities are deliberately unavailable in production. Storage authorization
  // depends on this boundary: a caller must never be able to mint an officer identity.
  const allowSimulation = process.env.NODE_ENV !== 'production';
  if (allowSimulation && token && token.startsWith('simulated-')) {
    const user = projectStore.getUserBySimulatedToken(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      req.profile = user;
      return next();
    }
  }

  // 2. Direct simulation header for server test suites
  if (allowSimulation && actorRoleHeader) {
    const user = projectStore.getUserByRole(actorRoleHeader as UserRole) || (actorIdHeader ? projectStore.getUserById(actorIdHeader) : null);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      req.profile = user;
      return next();
    }
  }

  if (!token) {
    return next();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin && allowSimulation) {
      // Check if token matches a known user ID or email in memory
      const user = projectStore.getUserById(token) || projectStore.getUserByEmail(token);
      if (user) {
        req.user = { id: user.id, email: user.email, role: user.role };
        req.profile = user;
      }
      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authorization token',
        },
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!profileError && profile) {
      req.profile = profile as Profile;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Failed to authenticate user session',
      },
    });
  }
}

/**
 * Reusable server-side requireAuth() middleware
 * Rejects unauthenticated requests with HTTP 401
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.profile) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required to perform this action',
        },
      });
    }

    if (!req.profile.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'This account has been deactivated. Please contact an administrator.',
        },
      });
    }

    next();
  };
}

/**
 * Reusable server-side requireRole() middleware
 * Enforces Role-Based Access Control (RBAC) on privileged endpoints
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required',
        },
      });
    }

    const userRole = req.profile.role;

    // SUPER_ADMIN has system-wide override access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${userRole}`,
        },
      });
    }

    next();
  };
}

/**
 * Reusable server-side requirePermission() middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required',
        },
      });
    }

    const userRole = req.profile.role;

    // Check if role has wildcard '*' or specific permission
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    const hasPerm = permissions.includes('*') || permissions.includes(permission);

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_PERMISSION',
          message: `Permission denied. Required permission: '${permission}'.`,
        },
      });
    }

    next();
  };
}

/**
 * Reusable server-side requireProjectAccess() middleware
 * Enforces Jurisdiction-Based Access Control (JBAC) on project mutations
 */
export function requireProjectAccess(action: 'read' | 'update' | 'verify') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const projectId = req.params.projectId || req.body.project_id;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Project ID is required' },
      });
    }

    const userRole = req.profile.role;

    // Super Admin has unrestricted jurisdiction
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    // National Monitor has full view and national verification access
    if (userRole === 'NATIONAL_MONITOR') {
      return next();
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      // In preview or simulation mode, check mock jurisdiction parameters if provided
      return checkMockJurisdiction(req, res, next, action);
    }

    try {
      const { data: project, error } = await (supabaseAdmin
        .from('projects') as any)
        .select('id, region_id, district_id, verification_status, created_by')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        });
      }

      // 1. Reading Project
      if (action === 'read') {
        if (project.verification_status === 'VERIFIED') {
          return next();
        }
        if (project.created_by === req.profile.id) {
          return next();
        }
      }

      // 2. Updating / Verifying Project — Enforce strict geographic boundaries
      if (userRole === 'REGIONAL_OFFICER') {
        if (!req.profile.region_id || req.profile.region_id !== project.region_id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'JURISDICTION_MISMATCH',
              message: `Access denied. Regional Officers can only manage projects within their assigned region (${req.profile.region_id}).`,
            },
          });
        }
        return next();
      }

      if (userRole === 'MMDCE_OFFICER') {
        if (!req.profile.district_id || req.profile.district_id !== project.district_id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'JURISDICTION_MISMATCH',
              message: `Access denied. MMDCE Officers can only manage projects within their assigned district assembly (${req.profile.district_id}).`,
            },
          });
        }
        return next();
      }

      // Standard citizen or observer cannot update or verify projects
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_OPERATION',
          message: `Role ${userRole} is not authorized to ${action} projects.`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to verify project jurisdiction' },
      });
    }
  };
}

/**
 * Fallback simulation jurisdiction check for development/testing
 */
function checkMockJurisdiction(req: Request, res: Response, next: NextFunction, action: string) {
  const user = req.profile!;
  const targetRegionId = req.headers['x-target-region-id'] as string;
  const targetDistrictId = req.headers['x-target-district-id'] as string;

  if (user.role === 'CITIZEN' && (action === 'update' || action === 'verify')) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_OPERATION', message: 'Citizens cannot update or verify projects' },
    });
  }

  if (user.role === 'MMDCE_OFFICER' && targetDistrictId && targetDistrictId !== user.district_id) {
    return res.status(403).json({
      success: false,
      error: { code: 'JURISDICTION_MISMATCH', message: 'Cannot modify projects outside assigned district' },
    });
  }

  if (user.role === 'REGIONAL_OFFICER' && targetRegionId && targetRegionId !== user.region_id) {
    return res.status(403).json({
      success: false,
      error: { code: 'JURISDICTION_MISMATCH', message: 'Cannot modify projects outside assigned region' },
    });
  }

  next();
}
