import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Building2,
  FileEdit,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface MockProject {
  id: string;
  title: string;
  region: string;
  region_id: string;
  district: string;
  district_id: string;
  status: string;
  budget: string;
}

const SAMPLE_PROJECTS: MockProject[] = [
  {
    id: 'PRJ-GAR-001',
    title: 'Accra Outer Ring Road Asphalt Overlay',
    region: 'Greater Accra',
    region_id: 'REG-GAR-01',
    district: 'Accra Metropolitan Assembly',
    district_id: 'DIST-ACCRA-METRO',
    status: 'IN_PROGRESS',
    budget: 'GHS 42,500,000',
  },
  {
    id: 'PRJ-ASH-002',
    title: 'Kumasi Maternal & Child Health Block Annex',
    region: 'Ashanti',
    region_id: 'REG-ASHANTI-01',
    district: 'Kumasi Metropolitan Assembly',
    district_id: 'DIST-KUMASI-METRO',
    status: 'PLANNING',
    budget: 'GHS 18,200,000',
  },
  {
    id: 'PRJ-NR-003',
    title: 'Tamale North Piped Water Supply Expansion',
    region: 'Northern',
    region_id: 'REG-NR-01',
    district: 'Sagnarigu Municipal Assembly',
    district_id: 'DIST-SAGNARIGU-01',
    status: 'IN_PROGRESS',
    budget: 'GHS 26,000,000',
  },
];

export const JurisdictionAccessDemo: React.FC = () => {
  const { role, profile, canAccessProject, isSuperAdmin, isNationalMonitor, isModerator } = useAuth();
  const [feedback, setFeedback] = useState<{
    projectId: string;
    action: string;
    allowed: boolean;
    reason: string;
  } | null>(null);

  const handleAction = (project: MockProject, action: 'edit' | 'verify' | 'moderate' | 'view') => {
    // 1. View action
    if (action === 'view') {
      setFeedback({
        projectId: project.id,
        action: 'View Project Details',
        allowed: true,
        reason: 'Public read transparency: All registered citizens and officials can inspect verified public project records.',
      });
      return;
    }

    // 2. Moderation action
    if (action === 'moderate') {
      if (isModerator || isSuperAdmin) {
        setFeedback({
          projectId: project.id,
          action: 'Moderate Civic Content',
          allowed: true,
          reason: 'Authorized: Active Moderator role permits reviewing and censoring citizen feedback and community evidence.',
        });
      } else {
        setFeedback({
          projectId: project.id,
          action: 'Moderate Civic Content',
          allowed: false,
          reason: 'Denied: Civic moderation requires MODERATOR or SUPER_ADMIN role.',
        });
      }
      return;
    }

    // 3. Super Admin & National Monitor override
    if (isSuperAdmin) {
      setFeedback({
        projectId: project.id,
        action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
        allowed: true,
        reason: 'Authorized: SUPER_ADMIN holds universal nationwide oversight privileges.',
      });
      return;
    }

    if (action === 'verify' && isNationalMonitor) {
      setFeedback({
        projectId: project.id,
        action: 'Verify Project Audit',
        allowed: true,
        reason: 'Authorized: NATIONAL_MONITOR holds presidential/national monitoring verification authority across all 16 regions.',
      });
      return;
    }

    // 4. Regional Officer
    if (role === 'REGIONAL_OFFICER') {
      if (profile?.region_id === project.region_id) {
        setFeedback({
          projectId: project.id,
          action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
          allowed: true,
          reason: `Authorized: Project is located within your assigned region (${project.region}).`,
        });
      } else {
        setFeedback({
          projectId: project.id,
          action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
          allowed: false,
          reason: `JURISDICTION MISMATCH: Your authority is restricted to ${profile?.region_id || 'your region'}. You cannot modify projects in ${project.region}.`,
        });
      }
      return;
    }

    // 5. MMDCE Officer
    if (role === 'MMDCE_OFFICER') {
      if (profile?.district_id === project.district_id) {
        setFeedback({
          projectId: project.id,
          action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
          allowed: true,
          reason: `Authorized: Project belongs to your assigned district (${project.district}).`,
        });
      } else {
        setFeedback({
          projectId: project.id,
          action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
          allowed: false,
          reason: `CROSS-DISTRICT TAMPERING BLOCKED: You are assigned to ${profile?.district_id}. You cannot modify projects in ${project.district}.`,
        });
      }
      return;
    }

    // 6. Citizen / Community Observer
    setFeedback({
      projectId: project.id,
      action: action === 'edit' ? 'Update Project Milestone' : 'Verify Project Audit',
      allowed: false,
      reason: `UNPRIVILEGED ROLE: Role ${role} cannot alter contractor milestones or official verifications. Submit a Citizen Report instead.`,
    });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-800" />
              <CardTitle className="text-base text-slate-900">
                Live Jurisdiction-Based Access Control (JBAC) Matrix
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Test how the active user session handles geographical boundaries and project mutations.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Active Role:</span>
            <Badge className="bg-emerald-800 text-white font-mono text-[11px]">{role || 'CITIZEN'}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feedback Alert if an action was clicked */}
        {feedback && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-all ${
              feedback.allowed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {feedback.allowed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {feedback.allowed ? 'ACTION AUTHORIZED' : 'ACTION REJECTED BY SERVER GUARD'}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  [{feedback.action} on {feedback.projectId}]
                </span>
              </div>
              <p className="leading-relaxed text-[11px]">{feedback.reason}</p>
            </div>
          </div>
        )}

        {/* Interactive Project Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_PROJECTS.map((proj) => {
            const hasAccess = canAccessProject(proj.region_id, proj.district_id);
            return (
              <div
                key={proj.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{proj.id}</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 font-medium">
                      {proj.status}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-2">{proj.title}</h4>

                  <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{proj.region} Region</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{proj.district}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      Budget: <span className="font-semibold text-slate-700">{proj.budget}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons with live permission feedback */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2 text-slate-700"
                    onClick={() => handleAction(proj, 'view')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Inspect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2 text-slate-700 hover:text-emerald-800"
                    onClick={() => handleAction(proj, 'edit')}
                  >
                    <FileEdit className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2 text-slate-700 hover:text-emerald-800"
                    onClick={() => handleAction(proj, 'verify')}
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2 text-slate-700 hover:text-amber-800"
                    onClick={() => handleAction(proj, 'moderate')}
                  >
                    Moderate
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
