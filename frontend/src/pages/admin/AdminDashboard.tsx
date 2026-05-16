import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, CalendarDays, Tag, TrendingUp, Activity } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminService } from '../../services/adminService';
import { AdminStats } from '../../types';

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then((res) => {
      if (res.success && res.data) setStats(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const tiles = [
    {
      icon: Package,
      label: t('admin.packages'),
      desc: t('admin.manage_packages_desc'),
      to: '/admin/packages',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Users,
      label: t('admin.users'),
      desc: t('admin.manage_users_desc'),
      to: '/admin/users',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: CalendarDays,
      label: t('admin.all_events'),
      desc: t('admin.manage_events_desc'),
      to: '/admin/events',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Tag,
      label: t('admin.promo_codes'),
      desc: t('admin.manage_promos_desc'),
      to: '/admin/promos',
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              label={t('admin.total_users')}
              value={stats?.total_users ?? '—'}
              icon={Users}
              color="text-blue-600 bg-blue-50"
            />
            <StatCard
              label={t('admin.total_events')}
              value={stats?.total_events ?? '—'}
              icon={CalendarDays}
              color="text-green-600 bg-green-50"
            />
            <StatCard
              label={t('admin.active_events')}
              value={stats?.active_events ?? '—'}
              icon={Activity}
              color="text-purple-600 bg-purple-50"
            />
            <StatCard
              label={t('admin.total_packages')}
              value={stats?.total_packages ?? '—'}
              icon={TrendingUp}
              color="text-orange-600 bg-orange-50"
            />
          </>
        )}
      </div>

      {/* Nav tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(({ icon: Icon, label, desc, to, color }) => (
          <Link key={to} to={to}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
