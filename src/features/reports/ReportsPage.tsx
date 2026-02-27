import React, { useState } from 'react';
import { BarChart3, Scale, Users, RefreshCw, PieChart, Landmark, Wallet, History, FileText, Activity, BrainCircuit, Package, RotateCcw } from 'lucide-react';
import MicroHeader from '../../ui/base/MicroHeader';
import { ReportTab } from './types';
import DebtReportView from './components/DebtReportView';
import TrialBalanceView from './components/TrialBalanceView';
import ProfitLossView from './components/ProfitLossView';
import BalanceSheetView from './components/BalanceSheetView';
import CurrencyDiffView from './components/CurrencyDiffView';
import InventoryMovementView from './components/InventoryMovementView';
import TaxReportView from './components/TaxReportView';
import AIInsightsView from './components/AIInsightsView';
import DeadStockReport from './components/DeadStockReport';
import ReturnsReportView from './components/ReturnsReportView';
import { useTranslation } from '../../lib/hooks/useTranslation';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('ai_insights');
  const { t } = useTranslation();

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'ai_insights', label: t('ai_auditor'), icon: BrainCircuit },
    { id: 'returns_report', label: 'تقرير المرتجعات', icon: RotateCcw },
    { id: 'tax_report', label: t('tax_center'), icon: FileText },
    { id: 'dead_stock', label: 'المخزون الراكد', icon: Package },
    { id: 'trial_balance', label: t('trial_balance'), icon: Scale },
    { id: 'item_movement', label: t('item_movement'), icon: History },
    { id: 'debt_report', label: t('debt_report'), icon: Wallet },
    { id: 'currency_diff', label: t('currency_differences'), icon: RefreshCw },
    { id: 'p_and_l', label: t('profit_and_loss'), icon: PieChart },
    { id: 'balance_sheet', label: t('balance_sheet'), icon: Landmark },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'ai_insights': return <AIInsightsView />;
      case 'returns_report': return <ReturnsReportView />;
      case 'tax_report': return <TaxReportView />;
      case 'dead_stock': return <DeadStockReport />;
      case 'debt_report': return <DebtReportView />;
      case 'trial_balance': return <TrialBalanceView />;
      case 'p_and_l': return <ProfitLossView />;
      case 'balance_sheet': return <BalanceSheetView />;
      case 'currency_diff': return <CurrencyDiffView />;
      case 'item_movement': return <InventoryMovementView />;
      default: return <AIInsightsView />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      <MicroHeader
        title={t('reports_center_title')}
        icon={BarChart3}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ReportTab)}
      />

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-24 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
