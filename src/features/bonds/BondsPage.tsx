import React, { useState, useMemo } from 'react';
import {
  FileText, Plus, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import { useBonds, useBondMutation } from './hooks';
import { BondType } from './types';
import MicroHeader from '../../ui/base/MicroHeader';
import Button from '../../ui/base/Button';
import CreateBondModal from './components/CreateBondModal';
import BondsList from './components/BondsList';
import BondsAnalyticsView from './components/BondsAnalyticsView';
import { useTranslation } from '../../lib/hooks/useTranslation';

type ViewType = 'list' | 'analytics';

const BondsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BondType>('receipt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<ViewType>('list');
  const { t } = useTranslation();

  const { data: bonds, isLoading } = useBonds(activeTab);
  const { mutate: createBond, isPending: isCreating } = useBondMutation();

  // Calculate analytics
  const analytics = useMemo(() => {
    const allBonds = bonds || [];
    const totalAmount = allBonds.reduce((sum, b) => sum + b.amount, 0);
    const count = allBonds.length;
    const avgAmount = count > 0 ? totalAmount / count : 0;

    const byDate = allBonds.reduce((acc, bond) => {
      const date = bond.date;
      if (!acc[date]) acc[date] = { date, amount: 0, count: 0 };
      acc[date].amount += bond.amount;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number }>);

    // Fill gaps for the last 30 days
    const chartData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        amount: byDate[dateStr]?.amount || 0,
        count: byDate[dateStr]?.count || 0
      });
    }

    const byAccount = allBonds.reduce((acc, bond) => {
      const name = bond.account_name;
      if (!acc[name]) acc[name] = { name, amount: 0, count: 0 };
      acc[name].amount += bond.amount;
      acc[name].count += 1;
      return acc;
    }, {} as Record<string, { name: string; amount: number; count: number }>);

    const accountData = Object.values(byAccount)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { totalAmount, count, avgAmount, chartData, accountData };
  }, [bonds]);

  const totals = useMemo(() => {
    const receipt = bonds?.filter(b => b.type === 'receipt') || [];
    const payment = bonds?.filter(b => b.type === 'payment') || [];
    return {
      receiptCount: receipt.length,
      receiptAmount: receipt.reduce((sum, b) => sum + b.amount, 0),
      paymentCount: payment.length,
      paymentAmount: payment.reduce((sum, b) => sum + b.amount, 0),
      netAmount: receipt.reduce((sum, b) => sum + b.amount, 0) - payment.reduce((sum, b) => sum + b.amount, 0)
    };
  }, [bonds]);

  // Analytics View
  if (viewType === 'analytics') {
    return (
      <BondsAnalyticsView
        analytics={analytics}
        totals={totals}
        onSwitchToList={() => setViewType('list')}
      />
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button onClick={() => setViewType('analytics')} variant="outline" size="sm">
        تحليلات
      </Button>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant={activeTab === 'receipt' ? 'success' : 'danger'}
        size="sm"
        leftIcon={<Plus size={14} />}
      >
        {activeTab === 'receipt' ? 'سند قبض' : 'سند صرف'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
      <MicroHeader
        title={t('bonds_management')}
        icon={FileText}
        iconColor={activeTab === 'receipt' ? 'text-emerald-600' : 'text-rose-600'}
        actions={headerActions}
        tabs={[
          { id: 'receipt', label: t('receipt_bonds'), icon: ArrowDownCircle },
          { id: 'payment', label: t('payment_bonds'), icon: ArrowUpCircle }
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as BondType)}
        searchPlaceholder={t('search_in_bonds')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-16 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <BondsList bonds={bonds || []} isLoading={isLoading} searchTerm={searchTerm} />
        </div>
      </div>

      <CreateBondModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={activeTab}
        onSubmit={(data) => createBond(data, { onSuccess: () => setIsModalOpen(false) })}
        isSubmitting={isCreating}
      />
    </div>
  );
};

export default BondsPage;
