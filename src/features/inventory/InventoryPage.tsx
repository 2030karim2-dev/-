import React, { useState, useMemo } from 'react';
import { useProducts, useProductMutations } from './hooks/useProducts';
import { useInventoryView } from './hooks/useInventoryView';
import { useProductImport } from './hooks/useProductImport';
import ProductDetailModal from './components/ProductDetailModal';
import AddProductModal from './components/AddProductModal';
import ImportProductsModal from './components/ImportProductsModal';
import MicroHeader from '../../ui/base/MicroHeader';
import { Database, Plus, List, LayoutGrid, Upload, Sparkles } from 'lucide-react';
import { useBreakpoint } from '../../lib/hooks/useBreakpoint';
import { useTranslation } from '../../lib/hooks/useTranslation';
import ErrorDisplay from '../../ui/base/ErrorDisplay';
import FullscreenContainer from '../../ui/base/FullscreenContainer';
import { cn } from '../../core/utils';
import DeduplicationTool from './components/DeduplicationTool';
import InventoryViewRenderer from './components/InventoryViewRenderer';
import { getInventoryTabs } from './constants';

const InventoryPage: React.FC = () => {
    const {
        searchTerm, setSearchTerm,
        activeView, setActiveView,
        displayMode, setDisplayMode,
        selectedProduct, setSelectedProduct,
        editingProduct, isModalOpen,
        handleEdit, handleAdd, handleCloseModal
    } = useInventoryView();

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDedupeOpen, setIsDedupeOpen] = useState(false);
    const { t } = useTranslation();
    const { products, isLoading, error, refetch } = useProducts(searchTerm, { limitNum: 10000 });
    const { saveProduct, isSaving, deleteProduct } = useProductMutations();
    const { handleSmartImportConfirm: runSmartImport } = useProductImport(products);
    
    const isDesktop = useBreakpoint('lg');
    const [isMaximized, setIsMaximized] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isDetailsMaximized, setIsDetailsMaximized] = useState(false);

    const tabs = useMemo(() => getInventoryTabs(t), [t]);

    const handleSmartImportConfirm = async (data: { items: any[], currency?: string }) => {
        const success = await runSmartImport(data);
        if (success) setActiveView('products');
    };

    return (
        <FullscreenContainer 
            isMaximized={isMaximized} 
            onToggleMaximize={() => {
                setIsMaximized(false);
                setIsZenMode(false);
            }}
            isZenMode={isZenMode}
        >
            <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
                <MicroHeader
                    title={t('inventory_management')}
                    icon={Database}
                    isMaximized={isMaximized}
                    onToggleMaximize={() => {
                        setIsMaximized(!isMaximized);
                        if (isMaximized) setIsZenMode(false);
                    }}
                    isZenMode={isZenMode}
                    onToggleZen={() => setIsZenMode(!isZenMode)}
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 shadow-md shadow-emerald-500/20"
                                title="استيراد من Excel"
                            >
                                <Upload size={14} />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={() => setIsDedupeOpen(true)}
                                className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 shadow-md shadow-amber-500/20"
                                title="فحص المكررات"
                            >
                                <Sparkles size={14} />
                                <span className="hidden sm:inline">فحص المكررات</span>
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 shadow-md shadow-blue-500/20"
                            >
                                <Plus size={14} />
                                <span>{t('add_new_entity', { entity: t('product') })}</span>
                            </button>
                            {!isDesktop && activeView === 'products' && (
                                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button onClick={() => setDisplayMode('table')} className={`p-1.5 rounded-lg ${displayMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><List size={14} /></button>
                                    <button onClick={() => setDisplayMode('grid')} className={`p-1.5 rounded-lg ${displayMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><LayoutGrid size={14} /></button>
                                </div>
                            )}
                        </div>
                    }
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    tabs={tabs}
                    activeTab={activeView}
                    onTabChange={setActiveView}
                />

                <div className={cn(
                    "flex-1 overflow-hidden flex flex-col relative z-20 transition-all duration-500",
                    isZenMode ? "bg-white dark:bg-slate-900" : ""
                )}>
                    <div className="flex-1 overflow-hidden transition-all duration-500">
                        {error ? (
                            <ErrorDisplay error={error?.message || null} onRetry={refetch} variant="full" />
                        ) : (
                            <InventoryViewRenderer
                                activeView={activeView}
                                products={products}
                                isLoading={isLoading}
                                isDesktop={isDesktop}
                                displayMode={displayMode}
                                selectedProduct={selectedProduct}
                                setSearchTerm={setSearchTerm}
                                setActiveView={setActiveView}
                                setSelectedProduct={setSelectedProduct}
                                handleEdit={handleEdit}
                                deleteProduct={deleteProduct}
                                handleSmartImportConfirm={handleSmartImportConfirm}
                                onMaximizeProduct={() => setIsDetailsMaximized(true)}
                            />
                        )}
                    </div>
                </div>

                {/* Show modal if is mobile OR if desktop and explicitly maximized */}
                {(selectedProduct && (!isDesktop || isDetailsMaximized)) && (
                    <ProductDetailModal 
                        product={selectedProduct} 
                        onClose={() => {
                            setSelectedProduct(null);
                            setIsDetailsMaximized(false);
                        }} 
                        onEdit={handleEdit} 
                    />
                )}

                <AddProductModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={async (data) => {
                        try {
                            await saveProduct(editingProduct?.id ? { data, id: editingProduct.id } : { data });
                            handleCloseModal();
                        } catch (err) {
                            console.error('Validation or API error:', err);
                        }
                    }}
                    isSubmitting={isSaving}
                    initialData={editingProduct}
                />

                <ImportProductsModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                />

                <DeduplicationTool
                    isOpen={isDedupeOpen}
                    onClose={() => setIsDedupeOpen(false)}
                    onEdit={(id) => {
                        const p = products.find(prod => prod.id === id);
                        if (p) handleEdit(p);
                        setIsDedupeOpen(false);
                    }}
                />
            </div>
        </FullscreenContainer>
    );
};

export default InventoryPage;