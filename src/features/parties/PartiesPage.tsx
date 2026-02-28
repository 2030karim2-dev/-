import React from 'react';
import { Users, UserPlus, FileText, LayoutGrid, Edit, Trash2, ShieldAlert, LucideIcon } from 'lucide-react';
import { useParties, usePartyMutations, usePartiesView } from './hooks';
import { Party, PartyView, PartyType, PartyFormData } from './types';
import MicroHeader from '../../ui/base/MicroHeader';
import PartiesStats from './components/PartiesStats';
import MicroListItem from '../../ui/common/MicroListItem';
import PartyModal from './components/PartyModal';
import StatementView from './components/StatementView';
import CategoriesView from './components/CategoriesView';
import Button from '../../ui/base/Button';
import { formatCurrency } from '../../core/utils';
import { cn } from '../../core/utils';
import { useTranslation } from '../../lib/hooks/useTranslation';

interface PartiesPageProps {
    partyType: PartyType;
    title?: string;
    icon?: LucideIcon;
    iconColor?: string;
}

const PartiesPage: React.FC<PartiesPageProps> = ({ partyType, title, icon, iconColor }) => {
    const { t } = useTranslation();
    const {
        activeView, setActiveView,
        searchTerm, setSearchTerm,
        isModalOpen,
        editingParty,
        handleEdit,
        handleAddNew,
        handleCloseModal
    } = usePartiesView();

    const { data: parties, isLoading, stats } = useParties(partyType, searchTerm);
    const { saveParty, deleteParty, isSaving } = usePartyMutations(partyType);

    const defaultTitle = partyType === 'customer' ? t('customer_management') : t('supplier_management');
    const displayTitle = title || defaultTitle;
    const displayIcon = icon || Users;
    const displayIconColor = iconColor || (partyType === 'customer' ? 'text-emerald-600' : 'text-blue-600');

    const headerActions = (
        <Button
            onClick={handleAddNew}
            variant={partyType === 'customer' ? 'success' : 'primary'}
            size="sm"
            leftIcon={<UserPlus size={14} />}
        >
            {partyType === 'customer' ? t('new_customer') : t('new_supplier')}
        </Button>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'list':
                return (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <PartiesStats stats={stats} type={partyType} />

                        <div className="flex flex-col gap-1">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1">Database Records</h3>
                            {parties?.map((party) => (
                                <MicroListItem
                                    key={party.id}
                                    icon={Users}
                                    iconColorClass={partyType === 'customer' ? "text-emerald-500" : "text-blue-500"}
                                    title={party.name}
                                    subtitle={party.phone || "No Contact"}
                                    tags={[
                                        { label: party.category || t('general'), color: 'slate' },
                                        { label: party.status === 'active' ? t('active') : t('blocked'), color: party.status === 'active' ? 'emerald' : 'rose' }
                                    ]}
                                    actions={
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{t('balance')}</span>
                                                <span dir="ltr" className={cn("text-[11px] font-black font-mono leading-none", Number(party.balance) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                    {formatCurrency(Math.abs(Number(party.balance)))}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(party); }} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded">
                                                    <Edit size={12} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); if (confirm(t('confirm_delete'))) deleteParty(party.id); }} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    }
                                />
                            ))}
                            {isLoading && <div className="p-20 text-center font-black text-[10px] text-gray-400 animate-pulse">Querying Records...</div>}
                            {!isLoading && parties?.length === 0 && (
                                <div className="p-20 text-center border-2 border-dashed dark:border-slate-800">
                                    <ShieldAlert size={32} className="mx-auto mb-2 text-gray-200" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">No active records</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'statements': return <StatementView partyType={partyType} />;
            case 'categories': return <CategoriesView partyType={partyType} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
            <MicroHeader
                title={displayTitle}
                icon={displayIcon}
                iconColor={displayIconColor}
                actions={headerActions}
                searchPlaceholder={t('search_by_name_phone_category')}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                tabs={[
                    { id: 'list', label: t('records'), icon: Users },
                    { id: 'statements', label: t('account_statements'), icon: FileText },
                    { id: 'categories', label: t('categories'), icon: LayoutGrid }
                ]}
                activeTab={activeView}
                onTabChange={(id) => setActiveView(id as PartyView)}
            />

            <div className="flex-1 overflow-y-auto px-2 pt-2 pb-24 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </div>

            <PartyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={(data) => saveParty({ data: data as PartyFormData, id: editingParty?.id }, { onSuccess: () => handleCloseModal() })}
                isSubmitting={isSaving}
                initialData={editingParty}
                partyType={partyType}
            />
        </div>
    );
};

export default PartiesPage;