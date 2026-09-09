import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { authenticateToken } from './server/middleware/auth';
import authRouter from './server/routes/auth';
import projectsRouter from './server/routes/projects';
import contractorsRouter from './server/routes/contractors';
import geographyRouter from './server/routes/geography';
import reportsRouter from './server/routes/reports';
import adminRouter from './server/routes/admin';
import inspectionsRouter from './server/routes/inspections';
import evidenceRouter from './server/routes/evidence';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(authenticateToken);

  // Mount Application Routers
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/contractors', contractorsRouter);
  app.use('/api/geography', geographyRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/inspections', inspectionsRouter);
  app.use('/api/evidence', evidenceRouter);

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'GhanaBuild 2.0 API',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL);
    const hasSupabaseAnon = Boolean(process.env.VITE_SUPABASE_ANON_KEY);
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    res.json({
      success: true,
      data: {
        platform: 'GhanaBuild 2.0',
        phase: 'PHASE 3 (Project Management)',
        databaseConfigured: hasSupabaseUrl && hasSupabaseAnon,
        adminServiceConfigured: hasServiceRole,
        readyForPhase3: true,
      },
    });
  });

  // Database Schema Status & Integrity Check
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    try {
      const { validateGhanaBuildSchema } = await import('./server/db/validate_schema');
      const schemaReport = validateGhanaBuildSchema();
      res.json({
        success: true,
        data: schemaReport,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SCHEMA_VERIFICATION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to verify schema',
        },
      });
    }
  });

  // Database Security & RLS Unauthorized Access Simulation
  app.get('/api/database/security-tests', async (_req: Request, res: Response) => {
    try {
      const { runSecuritySimulation } = await import('./server/db/security_tests');
      const testReport = runSecuritySimulation();
      res.json({
        success: true,
        data: testReport,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SECURITY_TEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to run security suite',
        },
      });
    }
  });

  // Authentication & Privilege Escalation Security Tests
  app.get('/api/auth/security-tests', async (_req: Request, res: Response) => {
    try {
      const { runAuthSecurityTests } = await import('./server/tests/auth_privilege_tests');
      const testReport = runAuthSecurityTests();
      res.json({
        success: true,
        data: testReport,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_TEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to run auth test suite',
        },
      });
    }
  });

  // Phase 7 Verification, Jurisdiction & Immutability Security Tests
  app.get('/api/tests/phase7-security-tests', async (_req: Request, res: Response) => {
    try {
      const { runPhase7SecurityTests } = await import('./server/tests/phase7_security_tests');
      const testReport = await runPhase7SecurityTests();
      res.json({
        success: true,
        data: testReport,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PHASE7_TEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to run Phase 7 test suite',
        },
      });
    }
  });

  app.post('/api/tests/phase7-security-tests', async (_req: Request, res: Response) => {
    try {
      const { runPhase7SecurityTests } = await import('./server/tests/phase7_security_tests');
      const testReport = await runPhase7SecurityTests();
      res.json({
        success: true,
        data: testReport,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PHASE7_TEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to run Phase 7 test suite',
        },
      });
    }
  });

  // Global API Error Handler
  app.use('/api', (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred.',
      },
    });
  });

  // Vite Middleware for development / Static Serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GhanaBuild] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GhanaBuild] Failed to start server:', err);
  process.exit(1);
});
