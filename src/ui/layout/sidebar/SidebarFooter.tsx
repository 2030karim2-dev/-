import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../features/auth/store';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useLogout } from '../../../features/auth/hooks';
import LogoutConfirmModal from '../../../features/auth/components/LogoutConfirmModal';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

interface UserInfoProps {
  isCollapsed: boolean;
  name: string;
  role: string;
  initial: string;
  onLogout: () => void;
  logoutTitle: string;
}

const UserInfo: React.FC<UserInfoProps> = ({
  isCollapsed,
  name,
  role,
  initial,
  onLogout,
  logoutTitle,
}) => {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 transition-all duration-300">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
          {initial}
        </div>
        <button
          onClick={onLogout}
          className="mt-2 p-2 text-[var(--app-text-secondary)] transition-colors hover:text-red-500"
          title={logoutTitle}
          aria-label={logoutTitle}
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 transition-all duration-300">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
        {initial}
      </div>
      <div className="animate-in fade-in flex flex-col overflow-hidden duration-300">
        <span className="truncate text-sm font-bold text-[var(--app-text)]" title={name}>
          {name}
        </span>
        <span className="text-[10px] capitalize text-[var(--app-text-secondary)]">{role}</span>
      </div>
      <button
        onClick={onLogout}
        className="mr-auto p-2 text-[var(--app-text-secondary)] transition-colors hover:text-red-500"
        title={logoutTitle}
        aria-label={logoutTitle}
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

const SidebarFooter: React.FC<SidebarFooterProps> = ({ isCollapsed }) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { logout: performLogout, isLoggingOut } = useLogout();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const fullName = user?.full_name ?? '';
  const emailName = user?.email != null ? user.email.split('@')[0] : '';
  const rawName = fullName !== '' ? fullName : emailName !== '' ? emailName : 'User';
  const name = rawName;
  const initial = name.charAt(0).toUpperCase();
  const role = user?.role ?? 'Staff';

  const handleOpenLogout = (): void => {
    setIsLogoutModalOpen(true);
  };

  return (
    <div className="mt-auto border-t border-[var(--app-border)] p-4">
      <UserInfo
        isCollapsed={isCollapsed}
        name={name}
        role={role}
        initial={initial}
        onLogout={handleOpenLogout}
        logoutTitle={t('logout')}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => {
          setIsLogoutModalOpen(false);
        }}
        onConfirm={performLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};

export default SidebarFooter;
