import React, { useState } from 'react';
import { useProducts, useProductMutations, useInventoryView } from './hooks';
import ProductExcelGrid from './components/ProductExcelGrid';
import ProductMicroCard from './components/ProductMicroCard';
import ProductDetailModal from './components/ProductDetailModal';
import AddProductModal from './components/AddProductModal';
import ImportProductsModal from './components/ImportProductsModal';
import MicroHeader from '../../ui/base/MicroHeader';
import InventoryAnalyticsView from '../reports/components/InventoryAnalyticsView';
import TransfersView from './components/TransfersView';
import StockAuditView from './components/StockAuditView';
import { useCurrencies } from '../settings/hooks';
import WarehousesView from './components/WarehousesView';
import AuditLogView from './components/AuditLogView';
import CategoriesManagementView from './components/CategoriesManagementView';
import SmartImportView from '../smart-import/components/SmartImportView';
import VehiclesPage from '../vehicles/VehiclesPage';
import DeadStockPage from './pages/DeadStockPage';
import { Plus, Box, LayoutGrid, List, Database, Zap, ArrowLeftRight, History, Warehouse, FileSearch, Layers, Upload, Sparkles, TrendingUp, Activity, Car, Archive } from 'lucide-react';
import { useBreakpoint } from '../../lib/hooks/useBreakpoint';
import ProductDetailPane from './components/ProductDetailPane';
import { useTranslation } from '../../lib/hooks/useTranslation';
import { useFeedbackStore } from '../feedback/store';
import ErrorDisplay from '../../ui/base/ErrorDisplay';
import { cn } from '../../core/utils';
import DeduplicationTool from './components/DeduplicationTool';

const InventoryPage: React.FC = () => {
    const {
        searchTerm,
        setSearchTerm,
        activeView,
        setActiveView,
        displayMode,
        setDisplayMode,
        selectedProduct,
        setSelectedProduct,
        editingProduct,
        isModalOpen,
        setIsModalOpen,
        handleEdit,
        handleAdd,
        handleCloseModal
    } = useInventoryView();

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDedupeOpen, setIsDedupeOpen] = useState(false);
    const { t } = useTranslation();
    const { products, isLoading, error, refetch, stats } = useProducts(searchTerm);
    const { deleteProduct, saveProduct, isSaving } = useProductMutations();
    const isDesktop = useBreakpoint('lg');
    const { showToast } = useFeedbackStore();

    const { currencies, rates } = useCurrencies();

    const handleSmartImportConfirm = async (data: { items: any[], currency?: string }) => {
        const { items, currency } = data;
        try {
            let successCount = 0;
            const rate = currency ? (rates.data?.[currency] || 1) : 1;

            for (const item of items) {
                // Check for duplicate name in current products list to avoid DB errors
                const isDuplicate = products.some(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
                if (isDuplicate) {
                    console.warn(`Skipping duplicate product: ${item.name}`);
                    continue;
                }

                // Map AI result to Product Form structure
                // Multiply costs with currency rate so they are stored in SAR properly
                const rawCost = Number(item.cost_price || item.unitPrice) || 0;
                const convertedCost = rawCost * rate;

                await saveProduct({
                    data: {
                        name: item.name,
                        part_number: item.partNumber || item.part_number || '',
                        brand: item.brand || '',
                        stock_quantity: Number(item.stock_quantity || item.quantity) || 0,
                        cost_price: convertedCost,
                        selling_price: convertedCost * 1.3, // Automatic margin for bulk import
                        category: 'عام',
                        unit: 'piece',
                        min_stock_level: 5,
                        sku: `AZ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                    }
                });
                successCount++;
            }
            showToast(`تم استيراد ${successCount} صنف بنجاح إلى المخزن${rate !== 1 ? ` بسعر صرف ${rate}` : ''}`, 'success');
            setActiveView('products');
        } catch (e) {
            showToast('حدث خطأ أثناء حفظ بعض الأصناف المستوردة', 'error');
        }
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'smart_import': return <SmartImportView mode="inventory" onConfirm={handleSmartImportConfirm} />;
            case 'analysis': return <InventoryAnalyticsView />;
            case 'transfers': return <TransfersView />;
            case 'audit': return <StockAuditView />;
            case 'warehouses': return <WarehousesView />;

            case 'vehicles': return <VehiclesPage />;
            case 'dead_stock': return <DeadStockPage />;
            case 'history': return <AuditLogView />;
            case 'categories': return <CategoriesManagementView onFilterProduct={(catName) => {
                setActiveView('products');
                setSearchTerm(catName);
            }} />;
            case 'low_stock':
                // Filter products locally for now as RPC might not be applied
                const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_level || 0) && (p.min_stock_level || 0) > 0);
                return (
                    <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 text-rose-800">
                                <Activity className="animate-pulse" />
                                <div>
                                    <h3 className="font-bold">تنبيهات انخفاض المخزون</h3>
                                    <p className="text-sm opacity-80">يوجد {lowStockProducts.length} منتج وصل للحد الأدنى</p>
                                </div>
                            </div>
                        </div>
                        <ProductExcelGrid
                            products={lowStockProducts}
                            isLoading={isLoading}
                            onDelete={deleteProduct}
                            onViewDetails={setSelectedProduct}
                            onEdit={handleEdit}
                        />
                    </div>
                );
            default: // Products View
                if (isDesktop) {
                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                            <div className={`h-full overflow-hidden flex flex-col transition-all duration-300 ${selectedProduct ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                                <ProductExcelGrid
                                    products={products}
                                    isLoading={isLoading}
                                    onDelete={deleteProduct}
                                    onViewDetails={setSelectedProduct}
                                    onEdit={handleEdit}
                                />
                            </div>
                            {selectedProduct && (
                                <div className="lg:col-span-5 h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 fade-in duration-300">
                                    <ProductDetailPane
                                        product={selectedProduct}
                                        onEdit={handleEdit}
                                        onDelete={deleteProduct}
                                        onClose={() => setSelectedProduct(null)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }
                // Mobile View
                return displayMode === 'table' ? (
                    <ProductExcelGrid
                        products={products}
                        isLoading={isLoading}
                        onDelete={deleteProduct}
                        onViewDetails={setSelectedProduct}
                        onEdit={handleEdit}
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {products.map(p => (
                            <ProductMicroCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
            <MicroHeader
                title={t('inventory_management')}
                icon={Database}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black active:scale-95 shadow-md shadow-emerald-500/20"
                            title="استيراد من Excel"
                        >
                            <Upload size={14} />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={() => setIsDedupeOpen(true)}
                            className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black active:scale-95 shadow-md shadow-amber-500/20"
                            title="فحص المكررات"
                        >
                            <Sparkles size={14} />
                            <span className="hidden sm:inline">فحص المكررات</span>
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black active:scale-95 shadow-md shadow-blue-500/20"
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
                tabs={[
                    { id: 'products', label: t('products'), icon: Box },
                    { id: 'low_stock', label: 'منخفض المخزون', icon: Activity },
                    { id: 'smart_import', label: 'إدخال ذكي (AI)', icon: Sparkles },
                    { id: 'categories', label: t('categories'), icon: Layers },
                    { id: 'history', label: t('history'), icon: FileSearch },
                    { id: 'warehouses', label: t('warehouses'), icon: Warehouse },

                    { id: 'vehicles', label: t('common_vehicles'), icon: Car },
                    { id: 'transfers', label: t('transfers'), icon: ArrowLeftRight },
                    { id: 'dead_stock', label: t('dead_stock'), icon: Archive },
                    { id: 'analysis', label: t('intelligence'), icon: TrendingUp },
                    { id: 'audit', label: t('audit'), icon: History },
                ]}
                activeTab={activeView}
                onTabChange={setActiveView}
            />

            <div className="flex-1 overflow-y-auto p-2 pb-16 custom-scrollbar">
                <div className="max-w-7xl mx-auto h-full">
                    {error ? <ErrorDisplay error={error as any} onRetry={refetch} variant="full" /> : renderActiveView()}
                </div>
            </div>

            {!isDesktop && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onEdit={handleEdit} />}

            <AddProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={(data) => {
                    saveProduct({ data, id: editingProduct?.id }).then(() => {
                        handleCloseModal();
                    });
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
    );
};

export default InventoryPage;