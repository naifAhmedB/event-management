import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Plus, QrCode, Settings, LogOut, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';

const AppShell = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/events',        icon: Calendar, label: t('nav.my_events') },
    { to: '/events/create', icon: Plus,     label: t('nav.create_event') },
    { to: '/scanner',       icon: QrCode,   label: t('nav.scanner') },
    ...(isAdmin ? [{ to: '/admin', icon: Settings, label: t('nav.admin') }] : []),
  ];

  const initials = user?.full_name
    ? user.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
    : '?';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <aside className="fixed inset-y-0 start-0 w-72 bg-white/90 backdrop-blur-xl border-e border-white/60 shadow-[4px_0_30px_rgba(0,0,0,.12)] z-50 md:hidden flex flex-col animate-fade-in">

          {/* Drawer header */}
          <div className="px-5 py-4 border-b border-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_2px_8px_rgba(124,58,237,.35)]">
                <span className="text-white text-base">📨</span>
              </div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight">{t('app.name')}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100/70 transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-violet-100/80 to-purple-50/60 text-purple-700 shadow-[0_1px_4px_rgba(124,58,237,.12),0_0_0_1px_rgba(167,139,250,.25)]'
                      : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-e-full bg-gradient-to-b from-violet-500 to-purple-600" />
                    )}
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      isActive ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_1px_4px_rgba(124,58,237,.25)]' : 'bg-gray-100/60'
                    )}>
                      <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400'} />
                    </div>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-5 pt-3 border-t border-white/50 space-y-1">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-white/60 hover:text-gray-800 transition-all"
            >
              <Globe size={15} className="text-gray-400" />
              {language === 'ar' ? 'English' : 'العربية'}
            </button>

            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50/60 border border-violet-100/40 my-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate leading-none tracking-tight">{user.full_name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user.phone}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/70 transition-all"
            >
              <LogOut size={15} />
              {t('nav.logout')}
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header — glass bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-[0_1px_12px_rgba(124,58,237,.06)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/70 hover:shadow-[0_1px_4px_rgba(0,0,0,.08)] transition-all duration-200"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_1px_4px_rgba(124,58,237,.30)]">
              <span className="text-white text-xs">📨</span>
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight">{t('app.name')}</span>
          </div>

          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="text-gray-500 hover:text-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/70 border border-white/80 hover:bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,.06)] transition-all duration-200"
          >
            {language === 'ar' ? 'EN' : 'عر'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
