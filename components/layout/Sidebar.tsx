'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { springPillMotion, overlayMotion } from '@/lib/motion';
import {
  LayoutDashboard,
  AlertOctagon,
  CheckSquare,
  FolderKanban,
  LogOut,
  User,
  Shield,
  KeyRound,
  Database,
  Calendar,
  Columns3,
  Target,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Optimistic active path for 0ms visual feedback on click
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const activePath = pendingPath || pathname;

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  // Lock body scroll on mobile when Sidebar is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    // Selectively purge client storage keys
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
    try { sessionStorage.clear(); } catch {}

    // Navigate to server-side logout route handler which issues Set-Cookie maxAge=0 headers
    window.location.href = '/auth/logout';
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Focus Mode', href: '/dashboard/focus', icon: Target },
    { label: 'Vital Tasks', href: '/dashboard/vital', icon: AlertOctagon, badge: 'Ghim' },
    { label: 'Calendar View', href: '/dashboard/calendar', icon: Calendar },
    { label: 'Kanban Board', href: '/dashboard/board', icon: Columns3 },
    { label: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Task Categories', href: '/dashboard/categories', icon: FolderKanban },
  ];

  const settingItems = [
    { label: 'Account Info', href: '/dashboard/settings/account', icon: Shield },
    { label: 'Change Password', href: '/dashboard/settings/password', icon: KeyRound },
    { label: 'Data (Export/Import)', href: '/dashboard/settings/data', icon: Database },
  ];

  return (
    <>
      {/* Mobile Backdrop with Smooth AnimatePresence Fade In/Out */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayMotion}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-xs lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 surface-panel bg-surface-1 border-r border-hairline flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-xs">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-ink">
                Flow State
              </h1>
              <p className="text-[11px] text-ink-subtle font-medium uppercase tracking-wider">
                Productivity OS
              </p>
            </div>
          </div>

          {/* User Profile Snippet */}
          {user && (
            <div className="p-3 rounded-lg bg-surface-2 border border-hairline flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-hairline"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center font-semibold text-xs">
                  {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-medium text-ink truncate">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </h4>
                <p className="text-[11px] text-ink-subtle truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Main Navigation Group - Completely Independent Layout Scope */}
          <LayoutGroup id="sidebar-main-group" inherit={false}>
            <div className="space-y-1 relative">
              <p className="px-3 text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1.5">
                Menu chính
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setPendingPath(item.href);
                      onClose?.();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-main-active-pill"
                        transition={springPillMotion}
                        className="absolute inset-0 rounded-md bg-primary-subtle border border-primary-border z-0"
                      />
                    )}

                    <div className="flex items-center gap-2.5 relative z-10">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="relative z-10 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/15 text-warning border border-warning/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </LayoutGroup>

          {/* Settings Section - Completely Independent Layout Scope */}
          <LayoutGroup id="sidebar-settings-group" inherit={false}>
            <div className="space-y-1 relative">
              <p className="px-3 text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1.5">
                Cài đặt & Tài khoản
              </p>
              {settingItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setPendingPath(item.href);
                      onClose?.();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-settings-active-pill"
                        transition={springPillMotion}
                        className="absolute inset-0 rounded-md bg-primary-subtle border border-primary-border z-0"
                      />
                    )}
                    <div className="flex items-center gap-2.5 relative z-10">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Footer Logout Button */}
        <div className="pt-4 border-t border-hairline">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-danger hover:bg-danger/10 transition-colors active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
