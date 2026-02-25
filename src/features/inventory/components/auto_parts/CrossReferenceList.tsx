import React, { useState } from 'react';
import { Product } from '../../types';
import { useCrossReferences, useCrossReferenceMutations } from '../../hooks';
import { Plus, Link as LinkIcon, Trash2, Box, AlertTriangle, CheckCircle } from 'lucide-react';
import ProductSearch from '../../../../features/sales/components/CreateInvoice/ProductSearch';

interface CrossReferenceListProps {
    product: Product;
}

export const CrossReferenceList: React.FC<CrossReferenceListProps> = ({ product }) => {
    const { data: references, isLoading } = useCrossReferences(product.id);
    const { addCrossReference, removeCrossReference, isAdding: isSaving } = useCrossReferenceMutations(product.id);

    const [isAdding, setIsAdding] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [matchQuality, setMatchQuality] = useState('exact');
    const [notes, setNotes] = useState('');

    const getMatchQualityDetails = (quality: string) => {
        switch (quality) {
            case 'exact': return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'مطابق تماماً' };
            case 'partial': return { color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle, label: 'جزئي / يتطلب تعديل' };
            case 'interchangeable': return { color: 'text-blue-600 bg-blue-50', icon: Box, label: 'تبادلي' };
            default: return { color: 'text-gray-600 bg-gray-50', icon: LinkIcon, label: quality };
        }
    }

    const handleSave = async () => {
        if (!selectedProduct) return;
        await addCrossReference({
            alternative_product_id: selectedProduct.productId, // ProductSearch outputs CartItem format
            match_quality: matchQuality,
            notes: notes
        });
        setIsAdding(false);
        setSelectedProduct(null);
        setNotes('');
    }

    if (isLoading) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 border-r-4 border-primary-500 pr-3">البدائل والتوافق المتقاطع</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    إضافة بديل
                </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                الأرقام البديلة للمنتج ({product.sku}): {product.alternative_numbers || 'لا توجد أرقام مسجلة'}
            </p>

            {references && references.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج البديل</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">درجة التوافق</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات الفني</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {references.map((ref) => {
                                const QualityInfo = getMatchQualityDetails(ref.match_quality);
                                const Icon = QualityInfo.icon;
                                return (
                                    <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                                                    <Box className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm border-b pb-1 font-medium text-gray-900">{ref.alternative_product?.name_ar || ref.alternative_product?.name || 'منتج غير معروف'}</div>
                                                    <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                                        <span><span className="text-gray-400">SKU:</span> {ref.alternative_product?.sku}</span>
                                                        {ref.alternative_product?.part_number && <span><span className="text-gray-400">PN:</span> {ref.alternative_product?.part_number}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${QualityInfo.color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {QualityInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {ref.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('هل أنت متأكد من فك ارتباط هذا المنتج؟')) {
                                                        removeCrossReference(ref.id)
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                                title="فك الارتباط"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">لا توجد بدائل مرتبطة</h3>
                    <p className="text-sm text-gray-500">
                        يمكنك ربط هذا المنتج بمنتجات أخرى مشابهة لتسهيل عملية البيع للموظفين.
                    </p>
                </div>
            )}

            {isAdding && (
                <div className="mt-6 p-5 border border-primary-200 bg-primary-50 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-primary-100 pb-3">
                        <h4 className="font-semibold text-primary-900">ربط منتج جديد كبديل</h4>
                        <button onClick={() => { setIsAdding(false); setSelectedProduct(null); }} className="text-gray-500 hover:text-gray-700">إلغاء</button>
                    </div>

                    {!selectedProduct ? (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">البحث عن المنتج البديل</label>
                            <ProductSearch onSelectProduct={setSelectedProduct} />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-primary-100">
                                <div className="flex items-center gap-3">
                                    <Box className="w-10 h-10 p-2 bg-primary-50 text-primary-600 rounded" />
                                    <div>
                                        <p className="font-bold text-gray-900">{selectedProduct.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="text-sm text-red-500 font-medium">تغيير</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع المطابقة (التوافق)</label>
                                    <select
                                        value={matchQuality}
                                        onChange={(e) => setMatchQuality(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                    >
                                        <option value="exact">مطابق تماماً (Exact Fit)</option>
                                        <option value="partial">تعديل بسيط مطلوب (Partial)</option>
                                        <option value="interchangeable">تبادلي (Interchangeable)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات لفني التركيب (اختياري)</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="مثال: يحتاج لتغيير الفيش"
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full md:w-auto">
                                    {isSaving ? 'جاري الحفظ...' : 'اعتماد و ربط المنتج'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
