import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onOpenSecurityTests?: () => void;
  onOpenPhase5SecurityTests?: () => void;
  onOpenPhase9Tests?: () => void;
}

export function PublicLayout({
  children,
  currentPath,
  onNavigate,
  onOpenSecurityTests,
  onOpenPhase5SecurityTests,
  onOpenPhase9Tests,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer
        onNavigate={onNavigate}
        onOpenSecurityTests={onOpenSecurityTests}
        onOpenPhase5SecurityTests={onOpenPhase5SecurityTests}
        onOpenPhase9Tests={onOpenPhase9Tests}
      />
    </div>
  );
}
