
import React, { useState, useMemo } from 'react';
import { Brain, Calculator, Shield, Sparkles, Activity, RefreshCw, Clock } from 'lucide-react';
import MicroHeader from '../../ui/base/MicroHeader';
import BrainOverview from './components/BrainOverview';
import StrategicAdvisor from './components/StrategicAdvisor';
import ProfitOptimizer from './components/ProfitOptimizer';
import FinancialDashboard from './components/FinancialDashboard';
import SmartLedger from './components/SmartLedger';
import LiveMonitor from './components/LiveMonitor';
import RiskRadar from './components/RiskRadar';
import { useProfitAndLoss, useDebtReport, useCashFlow, useTrialBalance } from '../reports/hooks';
import { useProducts } from '../inventory/hooks';

const TABS = [
    { id: 'brain', label: 'العقل', icon: Brain, gradient: 'from-violet-600 to-indigo-600', shadow: 'shadow-violet-500/20', desc: 'تحليل واستراتيجيات' },
    { id: 'accountant', label: 'المحاسب', icon: Calculator, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', desc: 'تحليل مالي وتدقيق' },
    { id: 'monitor', label: 'المراقب', icon: Shield, gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20', desc: 'رقابة وتنبيهات' },
] as const;

type TabId = typeof TABS[number]['id'];

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙 مساء الخير';
    if (hour < 12) return '☀️ صباح الخير';
    if (hour < 17) return '🌤️ مساك بالنور';
    return '🌙 مساء الخير';
};

const AIBrainPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('brain');

    const { data: pl, refetch } = useProfitAndLoss();
    const { data: debt } = useDebtReport();
    const { data: cashFlow } = useCashFlow();
    const { data: trial } = useTrialBalance();
    const { stats } = useProducts('');

    const businessData = useMemo(() => ({
        revenue: pl?.totalRevenues || 0,
        expenses: pl?.totalExpenses || 0,
        netProfit: pl?.netProfit || 0,
        receivables: debt?.summary?.receivables || 0,
        payables: debt?.summary?.payables || 0,
        liquidity: cashFlow?.currentLiquidity || 0,
        lowStockCount: stats?.lowStockCount || 0,
        totalProducts: stats?.count || 0,
        margin: pl && pl.totalRevenues > 0 ? ((pl.totalRevenues - pl.totalExpenses) / pl.totalRevenues) * 100 : 0,
        revenues: pl?.revenues || [],
        expenses_list: pl?.expenses || [],
        debtors: (debt as any)?.debtors || [],
        creditors: (debt as any)?.creditors || [],
        trialBalance: trial || [],
    }), [pl, debt, cashFlow, trial, stats]);

    // Calculate health score locally
    const healthScore = useMemo(() => {
        let score = 50;
        if (businessData.netProfit > 0) score += 15;
        if (businessData.margin > 15) score += 10;
        if (businessData.margin > 25) score += 5;
        if (businessData.lowStockCount === 0) score += 5;
        if (businessData.lowStockCount > 5) score -= 10;
        if (businessData.receivables > businessData.revenue * 0.3) score -= 15;
        if (businessData.liquidity > businessData.payables) score += 10;
        if (businessData.netProfit < 0) score -= 20;
        return Math.max(0, Math.min(100, score));
    }, [businessData]);

    const activeTabData = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
            <MicroHeader
                title="عقل الجعفري الذكي"
                icon={Brain}
                iconColor="text-violet-500"
                actions={
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 hidden sm:flex items-center gap-1.5">
                            <Clock size={10} />
                            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">متصل</span>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="p-2 text-gray-400 hover:text-blue-500 active:scale-90 transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar pb-24">
                {/* Greeting + Health Score Strip */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Brain size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-800 dark:text-white">{getGreeting()}</h2>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">المحاسب والمراقب والمستشار — يعمل بالذكاء الاصطناعي</p>
                            </div>
                        </div>

                        {/* Mini Health Score */}
                        <div className="flex items-center gap-3">
                            <div className="text-left">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">صحة الأعمال</p>
                                <p className={`text-xl font-black font-mono ${healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {healthScore}<span className="text-[10px] text-gray-400">/100</span>
                                </p>
                            </div>
                            <div className="w-12 h-12">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.5" fill="none"
                                        stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="3" strokeLinecap="round"
                                        strokeDasharray={`${healthScore * 0.974} 100`}
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 whitespace-nowrap ${isActive
                                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg ${tab.shadow}`
                                        : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border dark:border-slate-800'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                                <span className={`text-[8px] font-bold ${isActive ? 'text-white/60' : 'text-gray-400'} hidden sm:inline`}>{tab.desc}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'brain' && (
                    <div className="space-y-4">
                        <BrainOverview data={businessData} healthScore={healthScore} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <StrategicAdvisor data={businessData} />
                            <ProfitOptimizer data={businessData} />
                        </div>
                    </div>
                )}

                {activeTab === 'accountant' && (
                    <div className="space-y-4">
                        <FinancialDashboard data={businessData} />
                        <SmartLedger data={businessData} />
                    </div>
                )}

                {activeTab === 'monitor' && (
                    <div className="space-y-4">
                        <LiveMonitor data={businessData} />
                        <RiskRadar data={businessData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIBrainPage;
