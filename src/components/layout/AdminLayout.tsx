import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  AlertOctagon,
  Image as ImageIcon,
  MessageSquare,
  Users,
  BarChart3,
  HardHat,
  CircleDollarSign,
  ClipboardCheck,
  ScrollText,
  Settings,
  Menu,
  X,
  Shield,
  ArrowLeft,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { UserRole } from '../../types/user';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NotificationBell } from './NotificationBell';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onNavigateSection?: (section: string) => void;
  onExitAdmin?: () => void;
  onOpenPhase7Tests?: () => void;
  onOpenPhase8Tests?: () => void;
  userRole?: UserRole;
  jurisdictionLabel?: string;
}

export function AdminLayout({
  children,
  activeSection = 'overview',
  onNavigateSection,
  onExitAdmin,
  onOpenPhase7Tests,
  onOpenPhase8Tests,
  userRole = 'MMDCE_OFFICER',
  jurisdictionLabel = 'Jurisdiction: Unassigned (Awaiting Auth in Phase 2)',
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions', label: 'Verification Queue', icon: FileCheck2 },
    { id: 'projects', label: 'Projects Registry', icon: FolderKanban },
    { id: 'reports', label: 'Community Reports', icon: AlertOctagon },
    { id: 'evidence', label: 'Evidence Queue', icon: ImageIcon },
    { id: 'comments', label: 'Civic Discussions', icon: MessageSquare },
    { id: 'audit-logs', label: 'Audit Logs (Immutable)', icon: ScrollText },
    { id: 'users', label: 'User Directory & RBAC', icon: Users },
    { id: 'analytics', label: 'Infrastructure Analytics', icon: BarChart3 },
    { id: 'contractors', label: 'Contractor Accountability', icon: HardHat },
    { id: 'finance', label: 'Fiscal Transparency', icon: CircleDollarSign },
    { id: 'inspections', label: 'Field Inspections', icon: ClipboardCheck },
    { id: 'export', label: 'Data Export Center', icon: Download },
    { id: 'settings', label: 'System Configuration', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setSidebarOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 text-slate-900 antialiased">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Official Portal</div>
              <div className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">
                GhanaBuild 2.0 Admin
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role & Jurisdiction Badge */}
        <div className="p-3.5 m-3 rounded-lg bg-slate-950 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 text-[11px] font-medium">Active Role</span>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0.2">
              {userRole}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-300 truncate font-mono">{jurisdictionLabel}</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Public Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ghana Administration
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-bold text-slate-800 capitalize">
                {activeSection.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenPhase8Tests && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPhase8Tests}
                className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 h-8 font-bold"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-700" />
                Phase 8 Security Suite
              </Button>
            )}

            {onOpenPhase7Tests && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPhase7Tests}
                className="hidden lg:flex items-center gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 h-8 font-semibold"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Phase 7
              </Button>
            )}

            <NotificationBell />

            <span className="hidden sm:inline-block text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full font-mono shadow-2xs">
              PHASE 8 ACTIVE
            </span>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
