
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Users, Truck, Building2, UserPlus, FileText, LayoutGrid, Package, ShoppingCart, Receipt, Wallet, PiggyBank, Settings, Palette, Link2, BarChart3 } from 'lucide-react';
import MainLayout from '../ui/layout/MainLayout';
import { ROUTES } from '../core/routes/paths';
import PageLoader from '../ui/base/PageLoader';
import { useTranslation } from '../lib/hooks/useTranslation';
import { AuthGuard } from '../features/auth/components/AuthGuard';
import { GuestGuard } from '../features/auth/components/GuestGuard';

// Auth Pages (Eager Loading)
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import UpdatePasswordPage from '../features/auth/UpdatePasswordPage';

// Critical Dashboard Page
import DashboardPage from '../features/dashboard/DashboardPage';

// Lazy Loaded Features
const InventoryPage = lazy(() => import('../features/inventory/InventoryPage'));
const AuditSessionPage = lazy(() => import('../features/inventory/pages/AuditSessionPage'));
const DeadStockPage = lazy(() => import('../features/inventory/pages/DeadStockPage'));
const POSPage = lazy(() => import('../features/pos/pages/POSPage'));
const SalesPage = lazy(() => import('../features/sales/pages/SalesPage'));
const AccountingPage = lazy(() => import('../features/accounting/AccountingPage'));
const PurchasesPage = lazy(() => import('../features/purchases/pages/PurchasesPage'));
const VehiclesPage = lazy(() => import('../features/vehicles/VehiclesPage'));
const ExpensesPage = lazy(() => import('../features/expenses/pages/ExpensesPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const AppearancePage = lazy(() => import('../features/appearance/AppearancePage'));
const BondsPage = lazy(() => import('../features/bonds/BondsPage'));
const SuppliersPage = lazy(() => import('../features/suppliers/SuppliersPage'));
const CustomersPage = lazy(() => import('../features/customers/CustomersPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const PartiesPage = lazy(() => import('../features/parties/PartiesPage'));
const AICommandCenter = lazy(() => import('../features/ai/AICommandCenter'));
const AIBrainPage = lazy(() => import('../features/ai/AIBrainPage'));

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-600 bg-[#f8fafc] dark:bg-slate-950 py-20">
      <div className="text-6xl mb-4 opacity-20">🧭</div>
      <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-400">{t('page_not_found_title')}</h2>
      <p className="mt-2 text-sm">{t('page_not_found_desc')}</p>
      <button onClick={() => window.location.href = '/'} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
        {t('back_to_home')}
      </button>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path={ROUTES.AUTH.LOGIN} element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path={ROUTES.AUTH.REGISTER} element={<GuestGuard><RegisterPage /></GuestGuard>} />
      <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
      <Route path={ROUTES.AUTH.UPDATE_PASSWORD} element={<GuestGuard><UpdatePasswordPage /></GuestGuard>} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path={ROUTES.DASHBOARD.INVENTORY} element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />
        <Route path="/inventory/dead-stock" element={<Suspense fallback={<PageLoader />}><DeadStockPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.INVENTORY_AUDIT_SESSION} element={<Suspense fallback={<PageLoader />}><AuditSessionPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.SALES} element={<Suspense fallback={<PageLoader />}><SalesPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.POS} element={<Suspense fallback={<PageLoader />}><POSPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.ACCOUNTING} element={<Suspense fallback={<PageLoader />}><AccountingPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.PURCHASES} element={<Suspense fallback={<PageLoader />}><PurchasesPage /></Suspense>} />
        <Route path="/vehicles" element={<Suspense fallback={<PageLoader />}><VehiclesPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.EXPENSES} element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.SETTINGS} element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.APPEARANCE} element={<Suspense fallback={<PageLoader />}><AppearancePage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.BONDS} element={<Suspense fallback={<PageLoader />}><BondsPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.SUPPLIERS} element={<Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.CLIENTS} element={<Suspense fallback={<PageLoader />}><CustomersPage /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.PARTIES} element={<Suspense fallback={<PageLoader />}><PartiesPage partyType="customer" title="العملاء والموردون" icon={Users} iconColor="indigo" /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.PARTIES_CUSTOMERS} element={<Suspense fallback={<PageLoader />}><PartiesPage partyType="customer" title="العملاء" icon={Users} iconColor="indigo" /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.PARTIES_SUPPLIERS} element={<Suspense fallback={<PageLoader />}><PartiesPage partyType="supplier" title="الموردين" icon={Truck} iconColor="teal" /></Suspense>} />
        <Route path={ROUTES.DASHBOARD.REPORTS} element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="/ai-center" element={<Suspense fallback={<PageLoader />}><AICommandCenter /></Suspense>} />
        <Route path="/ai-brain" element={<Suspense fallback={<PageLoader />}><AIBrainPage /></Suspense>} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
