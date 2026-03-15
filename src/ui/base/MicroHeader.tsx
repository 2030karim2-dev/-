import React from 'react';
import { LucideIcon, ArrowRight, ArrowLeft, Search, X } from 'lucide-react';
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
  searchWidth?: string;
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
  searchWidth = "md:w-80",
  extraRow,
  enableDragDrop = false,
  enableKeyboardNav = true,
  enable3D = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dir } = useTranslation();
  const isRoot = location.pathname === '/';
  const [localSearch, setLocalSearch] = React.useState(searchValue || '');

  // Keep local search in sync if external value changes (e.g. cleared by parent)
  React.useEffect(() => {
    setLocalSearch(searchValue || '');
  }, [searchValue]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const triggerSearch = () => {
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[var(--app-surface)]/70 backdrop-blur-2xl border-b border-[var(--app-border)] shadow-sm transition-all no-print supports-[backdrop-filter]:bg-[var(--app-surface)]/50">
      <div className="max-w-none mx-auto">
        {/* Main Row */}
        <div className="flex h-10 md:h-14 lg:h-16 items-center justify-between px-2 md:px-5 lg:px-6">
          <div className="flex items-center gap-1.5 md:gap-2.5 overflow-hidden">
            {!isRoot && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-[var(--app-surface-hover)] rounded-lg transition-transform active:scale-90"
                aria-label="Go back"
              >
                <BackIcon size={18} className="text-[var(--app-text-secondary)]" />
              </button>
            )}
            <div className="flex items-center gap-2 md:gap-3 bg-[var(--app-bg)]/50 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full border border-[var(--app-border)]">
              <Icon className={iconColor} size={16} />
              <h1 className="text-xs md:text-sm lg:text-base font-bold text-[var(--app-text)] whitespace-nowrap">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
            {actions}
          </div>
        </div>

        {/* Unified Search & Tab Row - MERGED TO SAVE SPACE */}
        {(tabs || onSearchChange || extraRow) && (
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-2 md:px-4 bg-[var(--app-bg)]/50 border-t border-[var(--app-border)]">
            {/* Tabs Section */}
            {tabs && onTabChange && activeTab && (
              <div className="flex-1 w-full overflow-x-auto no-scrollbar min-w-0">
                <AdvancedTabBar
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  onTabsReorder={onTabsReorder}
                  enableDragDrop={enableDragDrop}
                  enableKeyboardNav={enableKeyboardNav}
                  size="sm"
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

            {/* Search/Filter Section */}
            {(onSearchChange || extraRow) && (
              <div className={`flex items-center gap-2 w-full ${searchWidth} shrink-0`}>
                {onSearchChange && (
                    <div className="relative flex-1 group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-text-secondary)] group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder={searchPlaceholder || "بحث..."}
                        value={localSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalSearch(val);
                          if (onSearchChange) onSearchChange(val);
                        }}
                        className="w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg py-2.5 pr-10 pl-10 text-sm font-medium outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        aria-label={searchPlaceholder || "Search"}
                      />
                    {localSearch && (
                      <button
                        onClick={() => {
                          setLocalSearch('');
                          onSearchChange('');
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 bg-[var(--app-bg)]/80 backdrop-blur-sm p-0.5 rounded-full transition-colors z-10"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
                {extraRow}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroHeader;
