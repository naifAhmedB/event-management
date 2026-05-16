import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Plus, QrCode, Settings, LogOut, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

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
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white/80 backdrop-blur-xl border-e border-white/60 shadow-[1px_0_20px_rgba(124,58,237,.06)] relative">

      {/* Subtle inner highlight */}
      <div className="absolute inset-0 pointer-events-none rounded-none bg-gradient-to-b from-white/40 to-transparent opacity-60" />

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="relative px-5 py-5 border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_2px_8px_rgba(124,58,237,.35)]">
            <span className="text-white text-base">📨</span>
          </div>
          <div>
            <span className="font-bold text-[15px] text-gray-900 leading-none tracking-tight">{t('app.name')}</span>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5 font-medium">Event Manager</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-violet-100/80 to-purple-50/60 text-purple-700 shadow-[0_1px_4px_rgba(124,58,237,.12),0_0_0_1px_rgba(167,139,250,.25)] backdrop-blur-sm'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,.05)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-e-full bg-gradient-to-b from-violet-500 to-purple-600 shadow-[0_0_6px_rgba(124,58,237,.4)]" />
                )}
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_1px_4px_rgba(124,58,237,.30)]'
                    : 'bg-gray-100/60 group-hover:bg-gray-200/60'
                )}>
                  <Icon
                    size={15}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom section ───────────────────────────── */}
      <div className="relative px-3 pb-4 pt-3 border-t border-white/50 space-y-1">

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/60 hover:text-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,.05)] transition-all duration-200"
        >
          <Globe size={15} className="text-gray-400" />
          <span className="font-medium">{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50/60 to-purple-50/40 border border-violet-100/40 mt-2 shadow-[0_1px_3px_rgba(124,58,237,.06)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_1px_4px_rgba(124,58,237,.30)]">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-none tracking-tight">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user.phone}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50/70 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={15} />
          <span className="font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
