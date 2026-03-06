import React from 'react';
import { LucideIcon, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { cn } from '../../core/utils';
import { useTranslation } from '../../lib/hooks/useTranslation';
import { AdvancedTabBar, TabItem } from '../components/AdvancedTabBar';

interface MicroHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onTabsReorder?: (tabs: TabItem[]) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  extraRow?: React.ReactNode;
  enableDragDrop?: boolean;
  enableKeyboardNav?: boolean;
  enable3D?: boolean;
}

const MicroHeader: React.FC<MicroHeaderProps> = ({
  title,
  icon: Icon,
  iconColor = "text-blue-600",
  actions,
  tabs,
  activeTab,
  onTabChange,
  onTabsReorder,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  extraRow,
  enableDragDrop = false,
  enableKeyboardNav = true,
  enable3D = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dir } = useTranslation();
  const isRoot = location.pathname === '/';

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="sticky top-0 z-40 bg-[var(--app-surface)]/70 backdrop-blur-2xl border-b border-[var(--app-border)] shadow-sm transition-all no-print supports-[backdrop-filter]:bg-[var(--app-surface)]/50">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Row */}
        <div className="flex h-10 md:h-14 items-center justify-between px-2 md:px-5">
          <div className="flex items-center gap-1.5 md:gap-2.5 overflow-hidden">
            {!isRoot && (
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-[var(--app-surface-hover)] rounded-lg transition-transform active:scale-90"
                aria-label="Go back"
              >
                <BackIcon size={16} className="text-[var(--app-text-secondary)]" />
              </button>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 bg-[var(--app-bg)]/50 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-[var(--app-border)]">
              <Icon className={iconColor} size={12} />
              <h1 className="text-[10px] md:text-xs font-bold text-[var(--app-text)] whitespace-nowrap">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {actions}
          </div>
        </div>

        {/* Tab Row - Advanced Tab Bar */}
        {tabs && onTabChange && activeTab && (
          <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)]/40 px-2 md:px-4 py-2">
            <AdvancedTabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onTabsReorder={onTabsReorder}
              enableDragDrop={enableDragDrop}
              enableKeyboardNav={enableKeyboardNav}
              size="md"
              theme="auto"
              animation={{
                transitionDuration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                enable3D: enable3D,
                enableGlassmorphism: true,
                enablePulsing: true,
                enableMultiLayerShadows: true,
              }}
              a11y={{
                ariaLabel: `${title} navigation tabs`,
                announceChanges: true,
              }}
            />
          </div>
        )}

        {/* Dynamic Search/Filter Row */}
        {(onSearchChange || extraRow) && (
          <div className="p-2 md:p-3 flex items-center gap-2 md:gap-3 bg-[var(--app-bg)]/50 border-t border-[var(--app-border)]">
            {onSearchChange && (
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-text-secondary)] group-focus-within:text-blue-500 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "بحث ذكي..."}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg py-1.5 md:py-2.5 pr-10 md:pr-12 pl-4 md:pl-5 text-xs md:text-sm font-medium outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  aria-label={searchPlaceholder || "Search"}
                />
              </div>
            )}
            {extraRow}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroHeader;
