import React, { useMemo } from 'react';
import ExpenseStats from '../components/ExpenseStats';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import Card from '../../../ui/base/Card';
import { formatCurrency } from '../../../core/utils';
import { expensesService } from '../service';
import type { Expense } from '../types';

interface ExpensesListViewProps {
    expenses: Expense[];
    isLoading: boolean;
    stats: any;
    onDelete: (id: string) => void;
}

const ExpensesListView: React.FC<ExpensesListViewProps> = ({ expenses, isLoading, stats, onDelete }) => {
    const breakdownData = useMemo(() => expensesService.getCategoryBreakdown(expenses), [expenses]);

    return (
        <div className="flex-1 flex flex-col min-h-0 h-full max-w-none mx-auto gap-3">
            <div className="shrink-0"><ExpenseStats customStats={stats} /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-500 shrink-0">
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        توزيع المصاريف حسب الفئة
                    </h3>
                    <ExpenseBreakdownChart data={breakdownData} />
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-4">ملخص مالي</h3>
                    <div className="space-y-2">
                        {breakdownData.map(item => (
                            <div key={item.name} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-bold">{item.name}</span>
                                </div>
                                <span dir="ltr" className="text-xs font-bold font-mono">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 flex flex-col">
                <ExpenseTable expenses={expenses} isLoading={isLoading} onDelete={onDelete} />
            </div>
        </div>
    );
};

export default ExpensesListView;
