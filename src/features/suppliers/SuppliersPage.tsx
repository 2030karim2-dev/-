
import React from 'react';
import { Users, UserPlus, FileText, LayoutGrid } from 'lucide-react';
import { useSuppliers, useSupplierMutations, useSuppliersView } from './hooks';
import { Supplier, SupplierView, SupplierFormData } from './types';
import MicroHeader from '../../ui/base/MicroHeader';
import SupplierStats from './components/SupplierStats';
import SupplierList from './components/SupplierList';
import PartyModal from '../parties/components/PartyModal';
import StatementView from './components/StatementView';
import CategoriesView from './components/CategoriesView';
import Button from '../../ui/base/Button';
import TableSkeleton from '../../ui/base/TableSkeleton';
import { useTranslation } from '../../lib/hooks/useTranslation';

const SuppliersPage: React.FC = () => {
  const {
    activeView, setActiveView,
    searchTerm, setSearchTerm,
    isModalOpen,
    editingSupplier,
    handleEdit,
    handleAddNew,
    handleCloseModal
  } = useSuppliersView();
  const { t } = useTranslation();

  const { suppliers, isLoading, stats } = useSuppliers(searchTerm);
  const { saveSupplier, deleteSupplier, isSaving } = useSupplierMutations();

  const headerActions = (
    <Button 
        onClick={handleAddNew}
        variant="primary"
        size="sm"
        leftIcon={<UserPlus size={14} />}
    >
        {t('new_supplier')}
    </Button>
  );

  const renderContent = () => {
    if (isLoading) return <TableSkeleton />;

    switch (activeView) {
        case 'list': 
            return (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <SupplierStats stats={stats} />
                    <SupplierList 
                        suppliers={suppliers} 
                        onEdit={handleEdit} 
                        onDelete={(id) => { if(window.confirm(t('confirm_delete'))) deleteSupplier(id); }}
                    />
                </div>
            );
        case 'statements': return <StatementView />;
        case 'categories': return <CategoriesView />;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
      <MicroHeader 
        title={t('supplier_management')}
        icon={Users}
        iconColor="text-blue-600"
        actions={headerActions}
        searchPlaceholder={t('search_by_name_phone_category')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        tabs={[
            { id: 'list', label: t('supplier_list'), icon: Users },
            { id: 'statements', label: t('account_statements'), icon: FileText },
            { id: 'categories', label: t('supplier_categories'), icon: LayoutGrid }
        ]}
        activeTab={activeView}
        onTabChange={(id) => setActiveView(id as SupplierView)}
      />

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-24 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </div>

      <PartyModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={(data) => saveSupplier({ data: data as SupplierFormData, id: editingSupplier?.id }, { onSuccess: handleCloseModal })} 
        isSubmitting={isSaving} 
        initialData={editingSupplier}
        partyType="supplier"
      />
    </div>
  );
};

export default SuppliersPage;