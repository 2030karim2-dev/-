import React, { useState, useMemo } from 'react';
import { useProductsPaginated } from './hooks/useProductsPaginated';
import { useProductMutations } from './hooks/useProducts';
import { useInventoryView } from './hooks/useInventoryView';
import { useProductImport } from './hooks/useProductImport';
import ProductDetailModal from './components/ProductDetailModal';
import AddProductModal from './components/AddProductModal';
import MicroHeader from '../../ui/base/MicroHeader';
import { Database, Plus, List, LayoutGrid, CheckCircle, AlertTriangle } from 'lucide-react';
import { useBreakpoint } from '../../lib/hooks/useBreakpoint';
import { useTranslation } from '../../lib/hooks/useTranslation';
import ErrorDisplay from '../../ui/base/ErrorDisplay';
import FullscreenContainer from '../../ui/base/FullscreenContainer';
import { cn } from '../../core/utils';
import InventoryViewRenderer from './components/InventoryViewRenderer';
import { getInventoryTabs } from './constants';
import ServerPaginationBar from '../../ui/common/ServerPaginationBar';

const InventoryPage: React.FC = () => {
    const {
        searchTerm, setSearchTerm,
        activeView, setActiveView,
        displayMode, setDisplayMode,
        selectedProduct, setSelectedProduct,
        editingProduct, isModalOpen,
        handleEdit, handleAdd, handleCloseModal
    } = useInventoryView();

    const [pageSize, setPageSize] = useState(50);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isDetailsMaximized, setIsDetailsMaximized] = useState(false);

    const { t } = useTranslation();
    const isDesktop = useBreakpoint('lg');

    const {
        products, totalCount, totalPages, page, isFetching,
        isLoading, isError, error, handleSearchChange, goToPage
    } = useProductsPaginated({ pageSize, initialSearch: searchTerm });

    // Bridge: MicroHeader sets searchTerm in useInventoryView;
    // useProductsPaginated handles debounced server search.
    const handleSearch = (v: string) => {
        setSearchTerm(v);
        handleSearchChange(v);
    };

    const { saveProduct, isSaving, deleteProduct } = useProductMutations();
    const { handleSmartImportConfirm: runSmartImport } = useProductImport(products);

    const tabs = useMemo(() => getInventoryTabs(t), [t]);

    const handleSmartImportConfirm = async (data: { items: unknown[], currency?: string }) => {
        const success = await runSmartImport(data as { items: Parameters<typeof runSmartImport>[0]['items'], currency?: string });
        if (success) setActiveView('products');
    };

    // Stats from current page (server delivers totalCount for the badge)
    const { availableProducts, outOfStockProducts } = useMemo(() => ({
        availableProducts: products.filter(p => p.stock_quantity > 0).length,
        outOfStockProducts: products.filter(p => p.stock_quantity <= 0).length,
    }), [products]);



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
                        <div className="flex items-center gap-3">
                            {activeView === 'products' && (
                                <div className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-bold shadow-sm" title="إحصائيات المنتجات">
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400" title="إجمالي المنتجات">
                                        <Database size={12} /> {totalCount.toLocaleString('ar-SA')}
                                    </span>
                                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="منتجات متوفرة">
                                        <CheckCircle size={12} /> {availableProducts}
                                    </span>
                                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title="منتجات ناقصة">
                                        <AlertTriangle size={12} /> {outOfStockProducts}
                                    </span>
                                </div>
                            )}
                            <div className="flex gap-2">
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
                        </div>
                    }
                    searchValue={searchTerm}
                    onSearchChange={handleSearch}
                    tabs={tabs}
                    activeTab={activeView}
                    onTabChange={setActiveView}
                />

                <div className={cn(
                    "flex-1 overflow-hidden flex flex-col relative z-20 transition-all duration-500",
                    isZenMode ? "bg-white dark:bg-slate-900" : ""
                )}>
                    <div className="flex-1 overflow-hidden flex flex-col transition-all duration-500">
                        {isError ? (
                            <ErrorDisplay error={error?.message || null} onRetry={() => goToPage(page)} variant="full" />
                        ) : (
                            <>
                                <InventoryViewRenderer
                                    activeView={activeView}
                                    products={products}
                                    isLoading={isLoading}
                                    isDesktop={isDesktop}
                                    displayMode={displayMode}
                                    selectedProduct={selectedProduct}
                                    searchTerm={searchTerm}
                                    setSearchTerm={handleSearch}
                                    setActiveView={setActiveView}
                                    setSelectedProduct={setSelectedProduct}
                                    handleEdit={handleEdit}
                                    deleteProduct={deleteProduct}
                                    handleSmartImportConfirm={handleSmartImportConfirm}
                                    onMaximizeProduct={() => setIsDetailsMaximized(true)}
                                />
                                {activeView === 'products' && (
                                    <ServerPaginationBar
                                        page={page}
                                        totalPages={totalPages}
                                        totalCount={totalCount}
                                        pageSize={pageSize}
                                        isFetching={isFetching}
                                        onPageChange={goToPage}
                                        onPageSizeChange={setPageSize}
                                        pageSizeOptions={[25, 50, 100, 200]}
                                    />
                                )}
                            </>
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

            </div>
        </FullscreenContainer>
    );
};

export default InventoryPage;