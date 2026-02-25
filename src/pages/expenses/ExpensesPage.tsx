import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Search, PieChart as PieIcon, List } from 'lucide-react';
import ExpenseStats from '../../features/expenses/components/ExpenseStats';
import ExpenseTable from '../../features/expenses/components/ExpenseTable';
import CreateExpenseModal from '../../features/expenses/components/CreateExpenseModal';
import ExpenseBreakdownChart from '../../features/expenses/components/ExpenseBreakdownChart';
import { useExpensesData, useExpenseActions } from '../../features/expenses/hooks';
import { expensesService } from '../../features/expenses/service';
import Card from '../../ui/base/Card';
import { formatCurrency } from '../../core/utils';
import TableSkeleton from '../../ui/base/TableSkeleton';
import EmptyState from '../../ui/base/EmptyState';
import MicroHeader from '../../ui/base/MicroHeader';

const ExpensesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');
  
  const { expenses, isLoading, isError, stats } = useExpensesData(searchTerm);
  const { createExpense, isCreating, deleteExpense } = useExpenseActions();
  const breakdownData = useMemo(() => expensesService.getCategoryBreakdown(expenses), [expenses]);

  const handleDelete = (id: string) => {
    deleteExpense(id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
      <MicroHeader
        title="مركز إدارة المصروفات"
        icon={Receipt}
        iconColor="text-rose-600"
        searchPlaceholder="البحث في الوصف، الفئة، أو رقم السند..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        actions={
          <div className="flex gap-2">
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                 <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                   <List size={14} />
                 </button>
                 <button onClick={() => setViewMode('analytics')} className={`p-1.5 rounded-lg ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                   <PieIcon size={14} />
                 </button>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black active:scale-95 flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                  <Plus size={14}/> إضافة مصروف
              </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-24 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-2">
          <ExpenseStats customStats={stats} />
          
          {viewMode === 'analytics' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-in fade-in duration-500">
               <Card className="p-4">
                  <h3 className="text-xs font-black text-gray-700 dark:text-slate-300 mb-4">توزيع المصاريف</h3>
                  <ExpenseBreakdownChart data={breakdownData} />
               </Card>
               <Card className="p-4">
                  <h3 className="text-xs font-black text-gray-700 dark:text-slate-300 mb-4">ملخص مالي</h3>
                  <div className="space-y-2">
                     {breakdownData.map(item => (
                       <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                             <span className="text-[10px] font-bold">{item.name}</span>
                          </div>
                          <span dir="ltr" className="text-[10px] font-black font-mono">{formatCurrency(item.value)}</span>
                       </div>
                     ))}
                  </div>
               </Card>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2">
               {isLoading ? <TableSkeleton rows={6} cols={5} /> : (
                 <ExpenseTable expenses={expenses} isLoading={false} onDelete={handleDelete} />
               )}
            </div>
          )}
        </div>
      </div>

      <CreateExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => createExpense(data, { onSuccess: () => setIsModalOpen(false) })} 
        isSubmitting={isCreating} 
      />
    </div>
  );
};

export default ExpensesPage;