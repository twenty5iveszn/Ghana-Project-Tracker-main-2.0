import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { NotFound } from './components/common/NotFound';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Alert } from './components/ui/alert';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthModal } from './components/auth/AuthModal';
import { useAuth } from './lib/auth/AuthContext';
import { ProjectsRegistry } from './components/admin/projects/ProjectsRegistry';
import { DatabaseSchemaViewer } from './components/database/DatabaseSchemaViewer';
import { PrivilegeEscalationTester } from './components/auth/PrivilegeEscalationTester';
import { JurisdictionAccessDemo } from './components/auth/JurisdictionAccessDemo';

// Public Phase 4 Components
import { HomePage } from './components/public/HomePage';
import { ProjectExplorer } from './components/public/ProjectExplorer';
import { ProjectDetailPreview } from './components/public/ProjectDetailPreview';
import { RegionsDirectory } from './components/public/RegionsDirectory';
import { RegionDetail } from './components/public/RegionDetail';
import { CategoriesDirectory } from './components/public/CategoriesDirectory';
import { CategoryDetail } from './components/public/CategoryDetail';
import { AboutPage } from './components/public/AboutPage';
import { SubmitProblemPage } from './components/public/SubmitProblemPage';
import { PublicSecurityTestModal } from './components/public/PublicSecurityTestModal';
import { Phase5SecurityTestModal } from './components/public/Phase5SecurityTestModal';

// Phase 9 Advanced Map & Public Analytics Components
import { PublicAnalyticsDashboard } from './components/public/PublicAnalyticsDashboard';
import { DistrictDetail } from './components/public/DistrictDetail';
import { GhanaProjectMap } from './components/public/GhanaProjectMap';
import { Phase9TestModal } from './components/public/Phase9TestModal';

// Phase 7 Admin Components
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview';
import { SubmissionsReviewQueue } from './components/admin/SubmissionsReviewQueue';
import { ReportsModerationQueue } from './components/admin/ReportsModerationQueue';
import { EvidenceModerationQueue } from './components/admin/EvidenceModerationQueue';
import { CommentsModerationQueue } from './components/admin/CommentsModerationQueue';
import { AuditLogsViewer } from './components/admin/AuditLogsViewer';
import { Phase7SecurityTestModal } from './components/admin/Phase7SecurityTestModal';

// Phase 8 Administrative Infrastructure Components
import { OperationalAnalyticsDashboard } from './components/admin/OperationalAnalyticsDashboard';
import { UserManagementDirectory } from './components/admin/UserManagementDirectory';
import { SystemSettingsManager } from './components/admin/SystemSettingsManager';
import { DataExportCenter } from './components/admin/DataExportCenter';
import { Phase8SecurityTestModal } from './components/admin/Phase8SecurityTestModal';
import { ContractorAnalyticsDashboard } from './components/admin/ContractorAnalyticsDashboard';
import { ContractorDirectory } from './components/public/ContractorDirectory';
import { ContractorProfile } from './components/public/ContractorProfile';
import { ContractorMethodology } from './components/public/ContractorMethodology';
import { FinanceTransparency } from './components/public/FinanceTransparency';
import { FinanceMethodology } from './components/public/FinanceMethodology';
import { FiscalAnalyticsDashboard } from './components/public/FiscalAnalyticsDashboard';
import { FieldInspectionPage } from './components/field/FieldInspectionPage';
import { FieldInspectionsQueue } from './components/admin/FieldInspectionsQueue';

import {
  ShieldCheck,
  FolderKanban,
  Shield,
  Layers,
  Database,
  Lock,
} from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
  );
  const [adminSection, setAdminSection] = useState<string>('overview');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'profile' | 'roles'>('signin');
  const [securityTestModalOpen, setSecurityTestModalOpen] = useState(false);
  const [phase5SecurityTestModalOpen, setPhase5SecurityTestModalOpen] = useState(false);
  const [phase7SecurityTestModalOpen, setPhase7SecurityTestModalOpen] = useState(false);
  const [phase8SecurityTestModalOpen, setPhase8SecurityTestModalOpen] = useState(false);
  const [phase9SecurityTestModalOpen, setPhase9SecurityTestModalOpen] = useState(false);

  const { isAuthenticated, role, profile } = useAuth();

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route extraction
  const pathname = currentRoute.split('?')[0] || '/';

  useEffect(() => {
    if (pathname === '/admin/finance') setAdminSection('finance');
    if (pathname === '/admin/inspections') setAdminSection('inspections');
  }, [pathname]);

  // Dynamic document title update
  useEffect(() => {
    if (pathname === '/') {
      document.title = 'GhanaBuild — Track the Projects Building Ghana';
    } else if (pathname === '/projects') {
      document.title = 'Explore Verified Infrastructure Projects — GhanaBuild';
    } else if (pathname.startsWith('/projects/')) {
      document.title = 'Project Dossier & Verification — GhanaBuild';
    } else if (pathname === '/map') {
      document.title = 'Interactive National Infrastructure Map Explorer — GhanaBuild';
    } else if (pathname === '/analytics') {
      document.title = 'Public Infrastructure Analytics & Capital Transparency — GhanaBuild';
    } else if (pathname === '/regions') {
      document.title = '16 Administrative Regions Directory — GhanaBuild';
    } else if (pathname.startsWith('/regions/')) {
      document.title = 'Regional Infrastructure Overview — GhanaBuild';
    } else if (pathname.startsWith('/districts/')) {
      document.title = 'District Assembly Infrastructure Portfolio — GhanaBuild';
    } else if (pathname === '/categories') {
      document.title = 'Infrastructure Sectors & Categories — GhanaBuild';
    } else if (pathname.startsWith('/categories/')) {
      document.title = 'Sector Projects & Metrics — GhanaBuild';
    } else if (pathname === '/about') {
      document.title = 'About & Verification Lifecycle — GhanaBuild';
    } else if (pathname === '/contractors') {
      document.title = 'Public Contractor Directory — GhanaBuild';
    } else if (pathname === '/contractors/methodology') {
      document.title = 'Contractor Performance Methodology — GhanaBuild';
    } else if (pathname.startsWith('/contractors/')) {
      document.title = 'Contractor Performance Profile — GhanaBuild';
    } else if (pathname === '/analytics/finance') {
      document.title = 'Public Fiscal Transparency Analytics — GhanaBuild';
    } else if (pathname === '/finance/methodology') {
      document.title = 'Fiscal Transparency Methodology — GhanaBuild';
    } else if (pathname === '/field-inspections') {
      document.title = 'Offline Field Inspections — GhanaBuild';
    } else if (pathname === '/admin/inspections') {
      document.title = 'Field Inspection Review — GhanaBuild';
    } else if (pathname === '/submit') {
      document.title = 'Report Infrastructure Problem — GhanaBuild';
    } else if (pathname.startsWith('/admin')) {
      document.title = 'Administrative Oversight Portal — GhanaBuild';
    }
  }, [pathname]);

  // 1. Render Admin Portal
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <ErrorBoundary>
        <ProtectedRoute
          requiredRoles={['MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN']}
          onOpenLogin={() => {
            setAuthModalTab('signin');
            setAuthModalOpen(true);
          }}
          fallbackMessage="Access to the Government Admin & Monitoring Portal is strictly reserved for verified MMDCE Officers, Regional Officers, National Monitors, and Administrators."
        >
          <AdminLayout
            activeSection={adminSection}
            onNavigateSection={setAdminSection}
            onExitAdmin={() => navigate('/')}
            onOpenPhase7Tests={() => setPhase7SecurityTestModalOpen(true)}
            onOpenPhase8Tests={() => setPhase8SecurityTestModalOpen(true)}
            userRole={role || 'SUPER_ADMIN'}
            jurisdictionLabel={
              profile?.organization ||
              (role === 'MMDCE_OFFICER'
                ? 'Accra Metropolitan Assembly'
                : role === 'REGIONAL_OFFICER'
                ? 'Ashanti Regional Coordinating Council'
                : 'National Infrastructure Monitoring Directorate')
            }
          >
            {adminSection === 'overview' && (
              <AdminDashboardOverview
                onNavigateSection={setAdminSection}
                onOpenPhase7Tests={() => setPhase7SecurityTestModalOpen(true)}
              />
            )}
            {adminSection === 'submissions' && <SubmissionsReviewQueue />}
            {adminSection === 'projects' && <ProjectsRegistry />}
            {adminSection === 'reports' && <ReportsModerationQueue />}
            {adminSection === 'evidence' && <EvidenceModerationQueue />}
            {adminSection === 'comments' && <CommentsModerationQueue />}
            {adminSection === 'audit-logs' && <AuditLogsViewer />}
            {adminSection === 'users' && <UserManagementDirectory />}
            {adminSection === 'analytics' && <OperationalAnalyticsDashboard />}
            {adminSection === 'contractors' && <ContractorAnalyticsDashboard />}
            {adminSection === 'finance' && <FiscalAnalyticsDashboard admin />}
            {adminSection === 'inspections' && <FieldInspectionsQueue />}
            {adminSection === 'export' && <DataExportCenter />}
            {adminSection === 'settings' && (
              <div className="space-y-6 max-w-6xl">
                <SystemSettingsManager />
                <JurisdictionAccessDemo />
                <PrivilegeEscalationTester />
                <DatabaseSchemaViewer />
              </div>
            )}

            <Phase7SecurityTestModal
              isOpen={phase7SecurityTestModalOpen}
              onClose={() => setPhase7SecurityTestModalOpen(false)}
            />

            <Phase8SecurityTestModal
              isOpen={phase8SecurityTestModalOpen}
              onClose={() => setPhase8SecurityTestModalOpen(false)}
            />
          </AdminLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    );
  }

  // 2. Render Public Views inside PublicLayout
  const renderPublicContent = () => {
    // A. Root Homepage
    if (pathname === '/' || pathname === '') {
      return <HomePage onNavigate={navigate} />;
    }

    // B. Projects Directory & Search
    if (pathname === '/projects') {
      return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <ProjectExplorer onNavigate={navigate} />
        </div>
      );
    }

    // C. Single Project Detail Page (/projects/:slug)
    if (pathname.startsWith('/projects/')) {
      const slug = pathname.replace('/projects/', '');
      return <ProjectDetailPreview slugOrId={slug} onNavigate={navigate} />;
    }

    // D. Map Explorer (/map)
    if (pathname === '/map') {
      return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span>Phase 9 Geospatial Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                Ghana Infrastructure Map Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Real-time geospatial exploration of geotagged public works across all 16 regions and 261 districts.
              </p>
            </div>
          </div>
          <GhanaProjectMap
            height="calc(80vh - 40px)"
            onProjectClick={(slug) => navigate(`/projects/${slug}`)}
          />
        </div>
      );
    }

    // E. Public Analytics Dashboard (/analytics)
    if (pathname === '/analytics') {
      return <PublicAnalyticsDashboard onNavigate={navigate} />;
    }

    // F. Contractor accountability directory and methodology
    if (pathname === '/contractors') {
      return <ContractorDirectory onNavigate={navigate} />;
    }
    if (pathname === '/contractors/methodology') {
      return <ContractorMethodology onNavigate={navigate} />;
    }
    if (pathname.startsWith('/contractors/')) {
      return <ContractorProfile slug={pathname.replace('/contractors/', '')} onNavigate={navigate} />;
    }

    if (pathname === '/analytics/finance') {
      return <FiscalAnalyticsDashboard onNavigate={navigate} />;
    }
    if (pathname === '/finance/methodology') {
      return <FinanceMethodology onNavigate={navigate} />;
    }
    if (pathname === '/field-inspections') {
      return (
        <ProtectedRoute
          requiredRoles={['COMMUNITY_OBSERVER', 'MMDCE_OFFICER', 'REGIONAL_OFFICER', 'NATIONAL_MONITOR', 'SUPER_ADMIN']}
          onOpenLogin={() => { setAuthModalTab('signin'); setAuthModalOpen(true); }}
          fallbackMessage="Field inspections require an active authorized field-capable account."
        >
          <FieldInspectionPage />
        </ProtectedRoute>
      );
    }

    // F. 16 Regions Directory (/regions)
    if (pathname === '/regions') {
      return <RegionsDirectory onNavigate={navigate} />;
    }

    // G. Region Detail (/regions/:slug)
    if (pathname.startsWith('/regions/')) {
      const slug = pathname.replace('/regions/', '');
      return <RegionDetail slugOrId={slug} onNavigate={navigate} />;
    }

    // H. District Detail (/districts/:slug)
    if (pathname.startsWith('/districts/')) {
      const slug = pathname.replace('/districts/', '');
      return <DistrictDetail slugOrId={slug} onNavigate={navigate} />;
    }

    // I. Categories Directory (/categories)
    if (pathname === '/categories') {
      return <CategoriesDirectory onNavigate={navigate} />;
    }

    // J. Category Detail (/categories/:slug)
    if (pathname.startsWith('/categories/')) {
      const slug = pathname.replace('/categories/', '');
      return <CategoryDetail slugOrId={slug} onNavigate={navigate} />;
    }

    // K. About GhanaBuild (/about)
    if (pathname === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    // L. Citizen Problem Report (/submit)
    if (pathname === '/submit') {
      return <SubmitProblemPage onNavigate={navigate} />;
    }

    // Fallback: 404 Not Found
    return (
      <NotFound
        onNavigateHome={() => navigate('/')}
        onNavigateProjects={() => navigate('/projects')}
      />
    );
  };

  return (
    <ErrorBoundary>
      <PublicLayout
        currentPath={currentRoute}
        onNavigate={navigate}
        onOpenSecurityTests={() => setSecurityTestModalOpen(true)}
        onOpenPhase5SecurityTests={() => setPhase5SecurityTestModalOpen(true)}
        onOpenPhase9Tests={() => setPhase9SecurityTestModalOpen(true)}
      >
        {renderPublicContent()}

        {/* Global Security Audit Modal (Phase 4) */}
        <PublicSecurityTestModal
          isOpen={securityTestModalOpen}
          onClose={() => setSecurityTestModalOpen(false)}
        />

        {/* Phase 5 Evidence & Document Security Audit Modal */}
        <Phase5SecurityTestModal
          isOpen={phase5SecurityTestModalOpen}
          onClose={() => setPhase5SecurityTestModalOpen(false)}
        />

        {/* Phase 9 Advanced Map & Public Analytics Acceptance Suite Modal */}
        <Phase9TestModal
          isOpen={phase9SecurityTestModalOpen}
          onClose={() => setPhase9SecurityTestModalOpen(false)}
        />

        {/* Global Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </PublicLayout>
    </ErrorBoundary>
  );
}
