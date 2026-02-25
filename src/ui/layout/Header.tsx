import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Car, Menu, Search } from 'lucide-react';
import HeaderActions from './header/HeaderActions';
import { MENU_ITEMS } from '../../core/constants';
import { useTranslation } from '../../lib/hooks/useTranslation';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentRoute = MENU_ITEMS.find(item => item.path === location.pathname);
  const title = currentRoute ? t(currentRoute.labelKey) : 'الرئيسية';

  return (
    <header className="flex h-14 md:h-[72px] items-center justify-between px-4 md:px-8 bg-[var(--app-surface)]/80 backdrop-blur-md border-b border-[var(--app-border)] flex-shrink-0 z-10 sticky top-0 transition-colors">
      {/* Left side: Logo/Title (Mobile) / Page Title (Desktop) */}
      <div className="flex items-center gap-3 flex-1 md:flex-none">
        {/* Mobile Menu Button */}
        <button onClick={onMenuClick} className="md:hidden p-2 -ms-2 text-gray-500 dark:text-slate-400">
          <Menu size={24} />
        </button>
        <div
          onClick={() => navigate('/')}
          className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20 cursor-pointer active:scale-90 transition-transform md:hidden"
        >
          <Car size={18} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm md:text-lg font-black text-gray-800 dark:text-slate-100 leading-none">{title}</h1>
          <span className="text-[8px] md:hidden text-gray-400 font-bold uppercase tracking-widest mt-1">Al-Zahra Smart ERP</span>
        </div>
      </div>

      {/* Center: Search (Desktop) */}
      <div className="hidden md:flex flex-1 justify-center px-8">
        <div className="relative group w-full max-w-xl">
          <input
            type="text"
            placeholder={t('global_search_placeholder')}
            className="w-full bg-[#f3f4f6] dark:bg-slate-800 border-none rounded-xl py-3 pr-12 pl-5 text-sm text-gray-600 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
          />
          <Search className="absolute right-4 top-3 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500" size={20} />
        </div>
      </div>

      {/* Right side: Global Actions (Profile, Theme, etc) */}
      <HeaderActions />
    </header>
  );
};

export default Header;
