
import React, { useState } from 'react';
import { ClipboardCheck, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StartAuditModal from './StartAuditModal';
import MicroListItem from '../../../ui/common/MicroListItem';
import { useAuditSessions } from '../hooks/useInventoryManagement';
import FullscreenContainer from '../../../ui/base/FullscreenContainer';
import { Maximize2 } from 'lucide-react';
import { cn } from '../../../core/utils';

const StockAuditView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: audits, isLoading } = useAuditSessions();
  const [isMaximized, setIsMaximized] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin text-blue-500"/></div>;
  }

  return (
    <FullscreenContainer isMaximized={isMaximized} onToggleMaximize={() => setIsMaximized(false)}>
    <div className={cn(
        "space-y-3 flex flex-col h-full",
        isMaximized && "bg-[var(--app-bg)] p-4 md:p-8"
    )}>
      <div className="flex items-center justify-between mb-1">
        <h3 className={cn("font-black text-gray-800 dark:text-white", isMaximized ? "text-xl" : "text-sm")}>
            سجلات الجرد الميداني
        </h3>
        {!isMaximized && (
            <button 
               onClick={() => setIsMaximized(true)}
               className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
            >
                <Maximize2 size={18} />
            </button>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-2xl p-4 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50/50 transition-colors"
      >
        <Plus size={16} strokeWidth={3} />
        <span className="text-xs font-bold">بدء جلسة جرد ميداني جديدة</span>
      </button>

      {audits?.map((ad: any) => (
        <MicroListItem
          key={ad.id}
          onClick={() => navigate(`/inventory/audit/${ad.id}`)}
          icon={ClipboardCheck}
          iconColorClass="text-blue-500"
          title={ad.title}
          subtitle={`المستودع: ${ad.warehouse_name} | تاريخ البدء: ${new Date(ad.created_at).toLocaleDateString('ar-SA')}`}
          tags={[
            { label: ad.status === 'completed' ? 'مؤرشف' : 'نشط', color: ad.status === 'completed' ? 'slate' : 'blue' },
            ...(ad.accuracy ? [{ label: `دقة ${ad.accuracy}%`, color: 'emerald' as const }] : []),
          ]}
          progress={ad.progress}
        />
      ))}

      <StartAuditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
    </FullscreenContainer>
  );
};

export default StockAuditView;