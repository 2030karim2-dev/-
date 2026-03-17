import React from 'react';
import SmartImportView from '../../smart-import/components/SmartImportView';
import InventoryAnalyticsView from '../../reports/components/InventoryAnalyticsView';
import TransfersView from './TransfersView';
import StockAuditView from './StockAuditView';
import WarehousesView from './WarehousesView';
import VehiclesPage from '../../vehicles/VehiclesPage';
import DeadStockPage from '../pages/DeadStockPage';
import AuditLogView from './AuditLogView';
import CategoriesManagementView from './CategoriesManagementView';
import ProductExcelGrid from './ProductExcelGrid';
import ProductMicroCard from './ProductMicroCard';
import ProductDetailPane from './ProductDetailPane';
import { Activity } from 'lucide-react';
import { Product } from '../types';

interface InventoryViewRendererProps {
    activeView: string;
    products: Product[];
    isLoading: boolean;
    isDesktop: boolean;
    displayMode: 'table' | 'grid';
    selectedProduct: Product | null;
    setSearchTerm: (term: string) => void;
    setActiveView: (view: string) => void;
    setSelectedProduct: (product: Product | null) => void;
    handleEdit: (product: Product) => void;
    deleteProduct: (id: string) => void;
    handleSmartImportConfirm: (data: { items: any[], currency?: string }) => Promise<void>;
    onMaximizeProduct?: () => void;
}

const InventoryViewRenderer: React.FC<InventoryViewRendererProps> = ({
    activeView,
    products,
    isLoading,
    isDesktop,
    displayMode,
    selectedProduct,
    setSearchTerm,
    setActiveView,
    setSelectedProduct,
    handleEdit,
    deleteProduct,
    handleSmartImportConfirm,
    onMaximizeProduct
}) => {
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
            const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_level || 0) && (p.min_stock_level || 0) > 0);
            return (
                <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 text-rose-800">
                            <Activity className="animate-pulse" />
                            <div>
                                <h3 className="font-bold">تنبيهات انخفاض المخزون</h3>
                                <p className="text-sm opacity-80">يوجد {lowStockProducts.length} منتج وصل للحد الأدنى</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ProductExcelGrid
                            products={lowStockProducts}
                            isLoading={isLoading}
                            onDelete={deleteProduct}
                            onViewDetails={setSelectedProduct}
                            onEdit={handleEdit}
                        />
                    </div>
                </div>
            );
        default: // Products View
            if (isDesktop) {
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
                        <div className={`h-full overflow-hidden flex flex-col transition-all duration-300 ${selectedProduct ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                            <ProductExcelGrid
                                products={products}
                                isLoading={isLoading}
                                onDelete={deleteProduct}
                                onViewDetails={setSelectedProduct}
                                onEdit={handleEdit}
                            />
                        </div>
                        {selectedProduct && (
                            <div className="lg:col-span-4 h-full overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
                                <ProductDetailPane
                                    product={selectedProduct}
                                    onEdit={handleEdit}
                                    onDelete={deleteProduct}
                                    onClose={() => setSelectedProduct(null)}
                                    onMaximize={onMaximizeProduct}
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

export default InventoryViewRenderer;
