
import React from 'react';
import { Users, UserPlus, FileText, LayoutGrid } from 'lucide-react';
import { useCustomers, useCustomerMutations, useCustomersView } from './hooks';
import { Customer, CustomerView, CustomerFormData } from './types';
import MicroHeader from '../../ui/base/MicroHeader';
import CustomerStats from './components/CustomerStats';
import CustomerList from './components/CustomerList';
import PartyModal from '../parties/components/PartyModal'; // Use generic PartyModal
import StatementView from './components/StatementView';
import CategoriesView from './components/CategoriesView';
import Button from '../../ui/base/Button';
import TableSkeleton from '../../ui/base/TableSkeleton';
import { useTranslation } from '../../lib/hooks/useTranslation';

const CustomersPage: React.FC = () => {
  const {
    activeView, setActiveView,
    searchTerm, setSearchTerm,
    isModalOpen,
    editingCustomer,
    handleEdit,
    handleAddNew,
    handleCloseModal
  } = useCustomersView();
  const { t } = useTranslation();

  const { customers, isLoading, stats } = useCustomers(searchTerm);
  const { saveCustomer, deleteCustomer, isSaving } = useCustomerMutations();

  const headerActions = (
    <Button
      onClick={handleAddNew}
      variant="success"
      size="sm"
      leftIcon={<UserPlus size={14} />}
    >
      {t('new_customer')}
    </Button>
  );

  const renderContent = () => {
    if (isLoading) return <TableSkeleton />;

    switch (activeView) {
      case 'list':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <CustomerStats stats={stats} />
            <CustomerList
              customers={customers}
              onEdit={handleEdit}
              onDelete={(id) => { if (window.confirm(t('confirm_delete'))) deleteCustomer(id); }}
            />
          </div>
        );
      case 'statements': return <StatementView type="customer" />;
      case 'categories': return <CategoriesView />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
      <MicroHeader
        title={t('customer_management')}
        icon={Users}
        iconColor="text-emerald-600"
        actions={headerActions}
        searchPlaceholder={t('search_by_name_phone_category')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        tabs={[
          { id: 'list', label: t('customer_list'), icon: Users },
          { id: 'statements', label: t('account_statements'), icon: FileText },
          { id: 'categories', label: t('customer_categories'), icon: LayoutGrid }
        ]}
        activeTab={activeView}
        onTabChange={(id) => setActiveView(id as CustomerView)}
      />

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-24 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>

      <PartyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={(data) => saveCustomer({ data: data as CustomerFormData, id: editingCustomer?.id }, { onSuccess: handleCloseModal })}
        isSubmitting={isSaving}
        initialData={editingCustomer}
        partyType="customer"
      />
    </div>
  );
};

export default CustomersPage;