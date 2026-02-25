
import React, { useState } from 'react';
import { Bell, Moon, Sun, Globe } from 'lucide-react';
import { useThemeStore } from '../../../lib/themeStore';
import { useAuthStore } from '../../../features/auth/store';
import { useI18nStore } from '../../../lib/i18nStore';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useNotificationStore } from '../../../features/notifications/store';
import NotificationDropdown from '../../../features/notifications/components/NotificationDropdown';

const HeaderActions: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { lang, setLang } = useI18nStore();
  const { t } = useTranslation();

  const { unreadCount } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-[var(--app-surface-hover)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface)] transition-all active:scale-90 border border-[var(--app-border)]"
        title={theme === 'light' ? t('theme_dark') : t('theme_light')}
      >
        {theme === 'light' ? <Moon size={16} className="md:size-18" /> : <Sun size={16} className="text-yellow-500 md:size-18" />}
      </button>

      {/* Language Toggle (Desktop Friendly) */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-[var(--app-surface-hover)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface)] transition-all border border-[var(--app-border)] font-sans text-xs font-black uppercase tracking-tighter"
        title="Change Language"
      >
        {lang === 'ar' ? 'En' : 'ع'}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-[var(--app-surface-hover)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface)] transition-all active:scale-90 border border-[var(--app-border)] relative"
          title={t('notifications')}
        >
          <Bell size={16} className="md:size-18" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          )}
        </button>
        {isNotifOpen && (
          <div className="absolute top-12 left-0 z-50">
            <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="ms-1 md:ms-0 cursor-pointer group">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs md:text-sm border-2 border-white dark:border-slate-800 shadow-md transform transition-all group-hover:rotate-6">
          {userInitial}
        </div>
      </div>
    </div>
  );
};

export default HeaderActions;
