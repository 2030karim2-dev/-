import React, { useState } from 'react';
import { ShoppingBag, Plus, History, RefreshCw, BarChart3 } from 'lucide-react';
import MicroHeader from '../../../ui/base/MicroHeader';
import CreateInvoiceView from '../components/create/CreateInvoiceView';
import InvoiceListView from '../components/list/InvoiceListView';
import SalesReturnsView from '../components/Returns/SalesReturnsView';
import SalesAnalyticsView from '../components/Analytics/SalesAnalyticsView';
import InvoiceDetailsModal from '../components/details/InvoiceDetailsModal';
import { useTranslation } from '../../../lib/hooks/useTranslation';

type SalesViewTab = 'create' | 'list' | 'returns' | 'analytics';

const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesViewTab>('list');
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const TABS = [
    { id: 'list' as const, label: t('sales_log'), icon: History },
    { id: 'create' as const, label: t('new_sale'), icon: Plus },
    { id: 'returns' as const, label: t('returns'), icon: RefreshCw },
    { id: 'analytics' as const, label: t('analytics'), icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateInvoiceView onSuccess={() => setActiveTab('list')} />;
      case 'list':
        return <InvoiceListView
          viewType="sale"
          searchTerm={searchTerm}
          onViewDetails={setViewInvoiceId}
        />;
      case 'returns':
        return <SalesReturnsView
          searchTerm={searchTerm}
          onViewDetails={setViewInvoiceId}
        />;
      case 'analytics':
        return <SalesAnalyticsView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
      <MicroHeader
        title={t('sales_management')}
        icon={ShoppingBag}
        iconColor="text-emerald-600"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as SalesViewTab)}
        searchPlaceholder={t('search_in_sales_or_customers')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-16 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
      <InvoiceDetailsModal
        invoiceId={viewInvoiceId}
        onClose={() => setViewInvoiceId(null)}
      />
    </div>
  );
};

export default SalesPage;
