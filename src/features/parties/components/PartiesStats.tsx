import React from 'react';
import { Users, CreditCard, ShoppingCart, AlertCircle } from 'lucide-react';
import StatCard from '../../../ui/common/StatCard';
import { PartyStats, PartyType } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { useTranslation } from '../../../lib/hooks/useTranslation';

interface Props {
  stats: PartyStats;
  type: PartyType;
}

const PartiesStats: React.FC<Props> = ({ stats, type }) => {
  const { t } = useTranslation();
  const isCustomer = type === 'customer';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      <StatCard
        title={isCustomer ? t('total_customers') : t('total_suppliers')}
        value={formatNumberDisplay(stats.totalCount)}
        icon={Users}
        colorClass={isCustomer ? "text-emerald-600" : "text-blue-600"}
        iconBgClass={isCustomer ? "bg-emerald-600" : "bg-blue-600"}
      />
      <StatCard
        title={t('total_balances')}
        value={formatCurrency(Math.abs(stats.totalBalance))}
        icon={CreditCard}
        colorClass="text-rose-600"
        iconBgClass="bg-rose-600"
      />
      <StatCard
        title={t('active_records')}
        value={formatNumberDisplay(stats.activeCount)}
        icon={ShoppingCart}
        colorClass={isCustomer ? "text-emerald-600" : "text-blue-600"}
        iconBgClass={isCustomer ? "bg-emerald-600" : "bg-blue-600"}
      />
      <StatCard
        title={t('blocked_records')}
        value={formatNumberDisplay(stats.blockedCount)}
        icon={AlertCircle}
        colorClass="text-orange-600"
        iconBgClass="bg-orange-600"
      />
    </div>
  );
};

export default PartiesStats;
