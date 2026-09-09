import { useState } from 'react';
import { Menu, X, Shield, PlusCircle, Search, Compass, MapPin, User, LogIn, ChevronDown, BarChart3, Map, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { Badge } from '../ui/badge';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function Navbar({ currentPath = '/', onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'profile' | 'roles'>('signin');

  const { isAuthenticated, profile, role, isOfficer, isSuperAdmin, isNationalMonitor } = useAuth();

  const navItems = [
    { label: 'Explore Projects', path: '/projects', icon: Search },
    { label: 'Map Explorer', path: '/map', icon: MapPin },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Contractors', path: '/contractors', icon: Building2 },
    { label: 'Regions', path: '/regions', icon: Compass },
    { label: 'Report Issue', path: '/submit', icon: PlusCircle },
    { label: 'About', path: '/about', icon: null },
  ];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const openAuth = (tab: 'signin' | 'register' | 'profile' | 'roles') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Civic Identity Bar */}
      <div className="bg-slate-950 px-4 py-1 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">Republic of Ghana — Infrastructure Transparency Platform</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-amber-400 font-semibold">GHANABUILD 2.0</span>
          <span>•</span>
          <button
            onClick={() => openAuth('roles')}
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
          >
            RBAC Inspector
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="h-10 w-10 rounded-lg bg-emerald-700 border border-emerald-500/50 flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:bg-emerald-600 transition-colors">
              <span className="text-amber-400 font-bold">GB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Ghana<span className="text-emerald-400">Build</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Transparency &bull; Verification &bull; Accountability
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 opacity-75" />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* CTA & Identity Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated && profile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all text-xs text-left"
                >
                  <div className="h-6 w-6 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-[11px]">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 line-clamp-1 max-w-[110px]">
                      {profile.full_name?.split(' ')[0]}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-3.5 font-mono border-emerald-500/40 text-emerald-400"
                    >
                      {role}
                    </Badge>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
                </button>

                {(isOfficer || isSuperAdmin || isNationalMonitor) && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleNav('/admin')}
                    className="flex items-center gap-1.5 h-8 text-xs font-semibold"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Officer Portal
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAuth('signin')}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800 bg-slate-900/50 flex items-center gap-1.5 text-xs h-8"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-1.5 text-xs h-8"
                >
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-medium flex items-center gap-2.5 ${
                currentPath === item.path
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item.icon && <item.icon className="h-5 w-5 opacity-70" />}
              {item.label}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('profile');
                  }}
                  className="w-full justify-center border-slate-700 text-slate-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  My Profile ({role})
                </Button>
                {(isOfficer || isSuperAdmin || isNationalMonitor) && (
                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => handleNav('/admin')}
                    className="w-full justify-center"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Officer Portal
                  </Button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('signin');
                  }}
                  className="w-full justify-center border-slate-700 text-slate-200"
                >
                  Sign In
                </Button>
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('register');
                  }}
                  className="w-full justify-center"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
}
