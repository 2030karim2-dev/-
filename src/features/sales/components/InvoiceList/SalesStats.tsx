// ============================================
// Sales Stats Component
// Displays sales statistics
// ============================================

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Users } from 'lucide-react';

interface SalesStatsProps {
    totalSales: number;
    totalReturns: number;
    invoiceCount: number;
    averageValue: number;
    previousPeriodSales?: number;
}

const SalesStats: React.FC<SalesStatsProps> = ({
    totalSales,
    totalReturns,
    invoiceCount,
    averageValue,
    previousPeriodSales,
}) => {
    const netSales = totalSales - totalReturns;
    const changePercent = previousPeriodSales
        ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
        : 0;

    const stats = [
        {
            label: 'إجمالي المبيعات',
            value: totalSales,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            label: 'المبيعات الصافية',
            value: netSales,
            icon: DollarSign,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'المردودات',
            value: totalReturns,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
        },
        {
            label: 'عدد الفواتير',
            value: invoiceCount,
            icon: Receipt,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            label: 'متوسط قيمة الفاتورة',
            value: averageValue,
            icon: Users,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                                {stat.value.toLocaleString('ar-SA')}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            {previousPeriodSales !== undefined && (
                <div className="col-span-full mt-2 flex items-center gap-2 text-sm">
                    <span className={`${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                    </span>
                    <span className="text-gray-500">مقارنة بالفترة السابقة</span>
                </div>
            )}
        </div>
    );
};

export default SalesStats;
