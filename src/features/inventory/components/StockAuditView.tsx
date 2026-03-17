
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
    <FullscreenContainer isMaximized={isMaximized} onToggleMaximize={() => { setIsMaximized(false); }}>
    <div className={cn(
        "space-y-3 flex flex-col h-full",
        isMaximized && "bg-[var(--app-bg)] p-4 md:p-8"
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-blue-600/10 text-blue-600 rounded-lg">
              <ClipboardCheck size={16} />
           </div>
           <h3 className="font-black text-gray-800 dark:text-white text-[11px] uppercase tracking-tighter">
              سجلات الجرد الميداني
           </h3>
        </div>
        {!isMaximized && (
            <button 
               onClick={() => { setIsMaximized(true); }}
               className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-all"
            >
                <Maximize2 size={14} />
            </button>
        )}
      </div>

      <button 
        onClick={() => { setIsModalOpen(true); }}
        className="w-full bg-white dark:bg-slate-900 border border-dashed border-blue-200 dark:border-blue-900/30 rounded-xl p-3 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50/50 transition-colors shadow-sm"
      >
        <Plus size={14} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-widest">بدء جلسة جرد ميداني</span>
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

      <StartAuditModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); }} />
    </div>
    </FullscreenContainer>
  );
};

export default StockAuditView;