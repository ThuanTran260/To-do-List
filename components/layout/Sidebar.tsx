'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  AlertOctagon,
  CheckSquare,
  FolderKanban,
  Settings,
  LogOut,
  Sparkles,
  User,
  Shield,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Vital Tasks', href: '/dashboard/vital', icon: AlertOctagon, badge: 'Ghim' },
    { label: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Task Categories', href: '/dashboard/categories', icon: FolderKanban },
  ];

  const settingItems = [
    { label: 'Account Info', href: '/dashboard/settings/account', icon: Shield },
    { label: 'Change Password', href: '/dashboard/settings/password', icon: KeyRound },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 glass-panel bg-white/95 dark:bg-slate-950/95 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                Flow State
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Productivity OS
              </p>
            </div>
          </div>

          {/* User Profile Snippet */}
          {user && (
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-10 h-10 rounded-xl object-cover border border-indigo-500/30 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {user.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Main Navigation Group */}
          <div className="space-y-1 relative">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menu chính
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="relative z-10 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cài đặt & Tài khoản
            </p>
            {settingItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Logout Button */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
