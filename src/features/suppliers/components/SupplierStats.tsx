
import React from 'react';
import { Users, CreditCard, ShoppingCart, AlertCircle } from 'lucide-react';
import StatCard from '../../../ui/common/StatCard';
import { SupplierStats } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';

interface Props {
  stats: SupplierStats;
}

const SupplierStatsComponent: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      <StatCard 
        title="إجمالي الموردين"
        value={formatNumberDisplay(stats.totalCount)} 
        icon={Users} 
        colorClass="text-blue-600" 
        iconBgClass="bg-blue-600" 
      />
      <StatCard 
        title="إجمالي المديونية"
        value={formatCurrency(Math.abs(stats.totalBalance))} 
        icon={CreditCard} 
        colorClass="text-rose-600" 
        iconBgClass="bg-rose-600" 
      />
      <StatCard 
        title="موردين نشطين"
        value={formatNumberDisplay(stats.activeCount)} 
        icon={ShoppingCart} 
        colorClass="text-emerald-600" 
        iconBgClass="bg-emerald-600" 
      />
      <StatCard 
        title="موردين محظورين"
        value={formatNumberDisplay(stats.blockedCount)} 
        icon={AlertCircle} 
        colorClass="text-orange-600" 
        iconBgClass="bg-orange-600" 
      />
    </div>
  );
};

export default SupplierStatsComponent;
