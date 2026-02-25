import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '../../../core/utils';

interface Alert {
    id: string;
    type: 'urgent' | 'warning' | 'info';
    message: string;
    time?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface AlertsPanelProps {
    alerts?: Alert[];
    className?: string;
}

type FilterType = 'all' | 'urgent' | 'info';

const AlertsPanel: React.FC<AlertsPanelProps> = ({
    alerts,
    className
}) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [isExpanded, setIsExpanded] = useState(true);

    const hasAlerts = alerts && alerts.length > 0;

    const filteredAlerts = hasAlerts ? alerts.filter(alert => {
        if (filter === 'all') return true;
        if (filter === 'urgent') return alert.type === 'urgent';
        if (filter === 'info') return alert.type === 'info' || alert.type === 'warning';
        return true;
    }) : [];

    const urgentCount = hasAlerts ? alerts.filter(a => a.type === 'urgent').length : 0;

    const getIcon = (type: Alert['type']) => {
        switch (type) {
            case 'urgent':
                return <XCircle size={14} className="text-rose-500" />;
            case 'warning':
                return <AlertTriangle size={14} className="text-amber-500" />;
            case 'info':
                return <Info size={14} className="text-blue-500" />;
        }
    };

    const getBgClass = (type: Alert['type']) => {
        switch (type) {
            case 'urgent':
                return 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800';
        }
    };

    return (
        <div className={cn(
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden",
            className
        )}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <Bell size={14} className="text-rose-500" />
                        </div>
                        {urgentCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                {urgentCount}
                            </span>
                        )}
                    </div>
                    <h3 className="text-xs font-black text-[var(--app-text)]">
                        التنبيهات
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        {(['all', 'urgent', 'info'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilter(f);
                                }}
                                className={cn(
                                    "px-2 py-1 text-[9px] font-bold rounded-md transition-all",
                                    filter === f
                                        ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm"
                                        : "text-[var(--app-text-secondary)]"
                                )}
                            >
                                {f === 'all' ? 'الكل' : f === 'urgent' ? 'عاجل' : 'معلومات'}
                            </button>
                        ))}
                    </div>

                    <ChevronDown
                        size={14}
                        className={cn(
                            "text-slate-400 transition-transform",
                            isExpanded ? "rotate-180" : ""
                        )}
                    />
                </div>
            </div>

            {/* Alerts List */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {!hasAlerts ? (
                        <div className="text-center py-6">
                            <CheckCircle size={24} className="mx-auto text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-slate-400">لا توجد تنبيهات</p>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="text-center py-6">
                            <Info size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-400">لا توجد تنبيهات من هذا النوع</p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                                    getBgClass(alert.type)
                                )}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(alert.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[var(--app-text)] leading-relaxed">
                                        {alert.message}
                                    </p>
                                    {alert.time && (
                                        <p className="text-[9px] text-slate-400 mt-0.5">{alert.time}</p>
                                    )}
                                </div>
                                {alert.action && (
                                    <button
                                        onClick={alert.action.onClick}
                                        className="flex-shrink-0 px-2 py-1 text-[9px] font-bold bg-white dark:bg-slate-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {alert.action.label}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AlertsPanel;
