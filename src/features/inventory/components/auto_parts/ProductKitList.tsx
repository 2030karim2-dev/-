import React, { useState } from 'react';
import { Product } from '../../types';
import { useKitComponents, useKitMutations } from '../../hooks';
import { Plus, Package, Trash2, Box, Layers } from 'lucide-react';
import ProductSearch from '../../../../features/sales/components/CreateInvoice/ProductSearch';

interface ProductKitListProps {
    product: Product;
}

export const ProductKitList: React.FC<ProductKitListProps> = ({ product }) => {
    const { data: kitItems, isLoading } = useKitComponents(product.id);
    const { addKitComponent, removeKitComponent, isAdding: isSaving } = useKitMutations(product.id);

    const [isAdding, setIsAdding] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState<number>(1);

    const handleSave = async () => {
        if (!selectedProduct || quantity <= 0) return;
        await addKitComponent({
            component_product_id: selectedProduct.productId,
            quantity: quantity
        });
        setIsAdding(false);
        setSelectedProduct(null);
        setQuantity(1);
    }

    // Determine if this product feels like a kit/package based on it having kit components
    const isAKit = kitItems && kitItems.length > 0;

    if (isLoading) {
        return <div className="animate-pulse space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 border-r-4 border-indigo-500 pr-3">مكونات الباقة (Kit)</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    إضافة قطعة
                </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                يُستخدم هذا التبويب لتجميع عدة قطع في منتج واحد للبيع (مثل مجموعة صيانات 10 آلاف كيلو).
            </p>

            {isAKit ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم القطعة (المكون)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية في الباقة</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {kitItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Layers className="h-5 w-5 text-indigo-400 ml-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{item.component_product?.name_ar || item.component_product?.name || 'منتج غير معروف'}</div>
                                                <div className="text-xs text-gray-500">SKU: {item.component_product?.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {item.quantity} ×
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('هل أنت متأكد من إزالة هذا المكون من الباقة؟')) {
                                                    removeKitComponent(item.id)
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                            title="حذف المكون"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">ليس منتجاً تجميعياً</h3>
                    <p className="text-sm text-gray-500">
                        أضف قطع غيار داخل هذا المنتج لتحويله إلى باقة متكاملة.
                    </p>
                </div>
            )}

            {isAdding && (
                <div className="mt-6 p-5 border border-indigo-200 bg-indigo-50 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                        <h4 className="font-semibold text-indigo-900">إضافة قطعة للباقة</h4>
                        <button onClick={() => { setIsAdding(false); setSelectedProduct(null); }} className="text-gray-500 hover:text-gray-700">إلغاء</button>
                    </div>

                    {!selectedProduct ? (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">البحث عن القطعة</label>
                            <ProductSearch onSelectProduct={setSelectedProduct} />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <Box className="w-10 h-10 p-2 bg-indigo-50 text-indigo-600 rounded" />
                                    <div>
                                        <p className="font-bold text-gray-900">{selectedProduct.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="text-sm text-red-500 font-medium">تغيير</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المطلوبة في الباقة</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                    />
                                </div>
                                <div>
                                    <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full">
                                        {isSaving ? 'جاري الإضافة...' : 'اعتماد الكمية وإضافة القطعة'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
