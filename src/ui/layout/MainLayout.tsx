import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutDashboard, ShoppingBag, Store, Wrench, WifiOff } from 'lucide-react';
import { ROUTES } from '../../core/routes/paths';
import { useI18nStore } from '../../lib/i18nStore';
import { useThemeStore } from '../../lib/themeStore';
import { ErrorBoundary } from '../base/ErrorBoundary';
import PageLoader from '../base/PageLoader';
import { cn } from '../../core/utils';
import { useBreakpoint } from '../../lib/hooks/useBreakpoint';
import { useTranslation } from '../../lib/hooks/useTranslation';
import { useNetworkStatus } from '../../lib/hooks/useNetworkStatus';

const MainLayout: React.FC = () => {
  const isDesktop = useBreakpoint('md');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isDesktop);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isOnline = useNetworkStatus();

  const { dir } = useI18nStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { initializeTheme } = useThemeStore();
  const { t } = useTranslation();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    setIsSidebarCollapsed(isDesktop);
  }, [isDesktop]);

  // تحديث تلقائي للقائمة الجانبية في الموبايل عند تغيير المسار
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutDashboard, label: t('overview'), path: ROUTES.DASHBOARD.ROOT },
    { icon: Store, label: t('pos'), path: ROUTES.DASHBOARD.POS },
    { icon: ShoppingBag, label: t('invoices'), path: ROUTES.DASHBOARD.SALES },
    { icon: Wrench, label: t('products'), path: ROUTES.DASHBOARD.INVENTORY },
  ];

  return (
    <div className="h-screen bg-[var(--app-bg)] overflow-hidden font-sans" dir={dir}>
      {/* Network Alert Overlay */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-rose-600 z-[300] animate-pulse"></div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ease-in-out",
        isDesktop && (isSidebarCollapsed
          ? (dir === 'rtl' ? 'md:mr-20' : 'md:ml-20')
          : (dir === 'rtl' ? 'md:mr-64' : 'md:ml-64'))
      )}>
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Connection Banner - Integrated into the flow */}
        {!isOnline && (
          <div className="bg-rose-500 text-white text-[9px] font-black py-1.5 flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg">
            <WifiOff size={12} />
            <span>Offline Mode Active - Data synced to neural local cache</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar relative pb-20 md:pb-4 scroll-smooth">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Tactical Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--app-surface)]/95 backdrop-blur-md border-t-2 border-[var(--app-border)] h-16 flex items-center justify-around z-[80] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-90",
                  isActive ? "text-[var(--accent)]" : "text-[var(--app-text-secondary)]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-500",
                  isActive ? "bg-[var(--accent)] text-white shadow-lg" : "hover:bg-[var(--app-surface-hover)]"
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className="text-[8px] font-black mt-1 uppercase tracking-widest leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;