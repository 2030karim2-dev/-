
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingDown, Package, Users, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../core/utils';

interface SmartAlert {
    type: 'warning' | 'danger' | 'info';
    icon: string;
    title: string;
    description: string;
}

interface AISmartNotificationsProps {
    stats?: {
        sales: string;
        expenses: string;
        debts: string;
    };
    lowStockProducts?: any[];
    alerts?: any[];
}

const AISmartNotifications: React.FC<AISmartNotificationsProps> = ({ stats, lowStockProducts, alerts: dashAlerts }) => {
    const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    const parseValue = (str?: string) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    };

    // Auto-generate smart alerts from props data
    useEffect(() => {
        const localAlerts: SmartAlert[] = [];
        const sales = parseValue(stats?.sales);
        const expenses = parseValue(stats?.expenses);
        const debts = parseValue(stats?.debts);
        const lowStockCount = lowStockProducts?.length || 0;

        // Low stock alert
        if (lowStockCount > 0) {
            localAlerts.push({
                type: 'warning',
                icon: '📦',
                title: `${lowStockCount} منتج منخفض المخزون`,
                description: 'يجب طلب بضاعة قبل النفاد — افتح المخزون للتفاصيل'
            });
        }

        // High debt alert
        if (debts > 50000) {
            localAlerts.push({
                type: 'danger',
                icon: '💸',
                title: `ديون عملاء: ${formatCurrency(debts)}`,
                description: 'ديون مرتفعة — تفعيل التحصيل مطلوب'
            });
        }

        // Loss alert
        const netProfit = sales - expenses;
        if (sales > 0 && netProfit < 0) {
            localAlerts.push({
                type: 'danger',
                icon: '📉',
                title: `خسارة: ${formatCurrency(Math.abs(netProfit))}`,
                description: 'النفقات تتجاوز الإيرادات — راجع المصروفات'
            });
        }

        // Low margin alert
        if (sales > 0) {
            const margin = ((sales - expenses) / sales) * 100;
            if (margin < 15 && margin > 0) {
                localAlerts.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: `هامش ربح منخفض: ${margin.toFixed(1)}%`,
                    description: 'الهامش أقل من 15% — راجع التسعير'
                });
            }
        }

        // Good performance
        if (netProfit > 0 && localAlerts.length === 0) {
            localAlerts.push({
                type: 'info',
                icon: '✅',
                title: 'الأداء جيد',
                description: `صافي ربح ${formatCurrency(netProfit)} — استمر بالعمل الممتاز!`
            });
        }

        setSmartAlerts(localAlerts);
    }, [stats, lowStockProducts]);

    if (dismissed || smartAlerts.length === 0) return null;

    const current = smartAlerts[currentIndex];
    const colorMap = {
        warning: 'from-amber-500/10 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30',
        danger: 'from-rose-500/10 to-red-500/5 border-rose-200/50 dark:border-rose-800/30',
        info: 'from-emerald-500/10 to-teal-500/5 border-emerald-200/50 dark:border-emerald-800/30',
    };

    return (
        <div className={`bg-gradient-to-r ${colorMap[current.type]} border rounded-2xl p-3 flex items-center gap-3 transition-all`}>
            <span className="text-xl flex-shrink-0">{current.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[var(--app-text)] truncate">{current.title}</p>
                <p className="text-[10px] text-[var(--app-text-secondary)] truncate">{current.description}</p>
            </div>
            {smartAlerts.length > 1 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setCurrentIndex(i => i > 0 ? i - 1 : smartAlerts.length - 1)} className="p-1 rounded-lg hover:bg-[var(--app-surface-hover)] transition-colors">
                        <ChevronRight size={12} className="text-[var(--app-text-secondary)]" />
                    </button>
                    <span className="text-[9px] font-bold text-[var(--app-text-secondary)]">{currentIndex + 1}/{smartAlerts.length}</span>
                    <button onClick={() => setCurrentIndex(i => i < smartAlerts.length - 1 ? i + 1 : 0)} className="p-1 rounded-lg hover:bg-[var(--app-surface-hover)] transition-colors">
                        <ChevronLeft size={12} className="text-[var(--app-text-secondary)]" />
                    </button>
                </div>
            )}
            <button onClick={() => setDismissed(true)} className="p-1 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                <X size={12} />
            </button>
        </div>
    );
};

export default AISmartNotifications;

