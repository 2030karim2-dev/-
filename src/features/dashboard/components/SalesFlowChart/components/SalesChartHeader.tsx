import React from 'react';
import { Activity, BarChart3, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../core/utils';
import { ChartType, PeriodType, SeriesType } from '../hooks/useSalesFlowChart';

interface SalesChartHeaderProps {
    seriesConfig: Record<SeriesType, { label: string; color: string }>;
    visibleSeries: Record<SeriesType, boolean>;
    toggleSeries: (series: SeriesType) => void;
    showPeriodSelector: boolean;
    period: PeriodType;
    handlePeriodChange: (p: PeriodType) => void;
    chartType: ChartType;
    setChartType: (c: ChartType) => void;
}

const periodLabels: Record<PeriodType, string> = {
    week: 'أسبوع',
    month: 'شهر',
    quarter: '3 أشهر',
    year: 'سنة',
    all: 'الكل'
};

export const SalesChartHeader: React.FC<SalesChartHeaderProps> = ({
    seriesConfig,
    visibleSeries,
    toggleSeries,
    showPeriodSelector,
    period,
    handlePeriodChange,
    chartType,
    setChartType
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            {/* Series Toggles */}
            <div className="flex gap-2 mr-auto order-last lg:order-first overflow-x-auto pb-1 max-w-full no-scrollbar">
                {(Object.keys(seriesConfig) as SeriesType[]).map(s => (
                    <button
                        key={s}
                        onClick={() => toggleSeries(s)}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap",
                            visibleSeries[s]
                                ? `bg-opacity-10 dark:bg-opacity-20 border-opacity-20`
                                : "opacity-60 grayscale border-transparent bg-slate-50 dark:bg-slate-800"
                        )}
                        style={{
                            backgroundColor: visibleSeries[s] ? seriesConfig[s].color + '20' : undefined,
                            borderColor: visibleSeries[s] ? seriesConfig[s].color : undefined,
                            color: visibleSeries[s] ? seriesConfig[s].color : undefined
                        }}
                    >
                        {visibleSeries[s] ? <CheckCircle2 size={12} /> : <div className="w-3" />}
                        {seriesConfig[s].label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                {/* Period Selector */}
                {showPeriodSelector && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['week', 'month', 'quarter', 'year', 'all'] as PeriodType[]).map(p => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-lg transition-all",
                                    period === p
                                        ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm scale-105"
                                        : "text-[var(--app-text-secondary)] hover:text-[var(--app-text)]"
                                )}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chart Type Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setChartType('area')} className={cn("p-1.5 rounded-lg transition-all", chartType === 'area' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "opacity-50")}><Activity size={14} /></button>
                    <button onClick={() => setChartType('bar')} className={cn("p-1.5 rounded-lg transition-all", chartType === 'bar' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "opacity-50")}><BarChart3 size={14} /></button>
                    <button onClick={() => setChartType('composed')} className={cn("p-1.5 rounded-lg transition-all", chartType === 'composed' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "opacity-50")}><Zap size={14} /></button>
                </div>
            </div>
        </div>
    );
};
