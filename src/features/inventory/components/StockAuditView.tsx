
import React, { useState } from 'react';
import { ClipboardCheck, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StartAuditModal from './StartAuditModal';
import MicroListItem from '../../../ui/common/MicroListItem';
import { useAuditSessions } from '../hooks/useInventoryManagement';

const StockAuditView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: audits, isLoading } = useAuditSessions();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="space-y-3">
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-2xl p-4 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50/50 transition-colors"
      >
        <Plus size={16} strokeWidth={3} />
        <span className="text-xs font-black">بدء جلسة جرد ميداني جديدة</span>
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
  );
};

export default StockAuditView;