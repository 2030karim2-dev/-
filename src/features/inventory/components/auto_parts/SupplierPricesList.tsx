import React, { useState } from 'react';
import { Product } from '../../types';
import { useSupplierPrices, useSupplierPriceMutations } from '../../hooks';
import { Plus, Building2, Truck, DollarSign, Calendar } from 'lucide-react';

interface SupplierPricesListProps {
    product: Product;
}

export const SupplierPricesList: React.FC<SupplierPricesListProps> = ({ product }) => {
    const { data: prices, isLoading } = useSupplierPrices(product.id);
    const { addSupplierPrice, isAdding: isSaving } = useSupplierPriceMutations(product.id);

    const [isAdding, setIsAdding] = useState(false);
    // Add form state
    const [supplierId, setSupplierId] = useState('');
    const [costPrice, setCostPrice] = useState<number>(0);
    const [leadTime, setLeadTime] = useState<number | ''>('');
    const [partNumber, setPartNumber] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = async () => {
        if (!supplierId || costPrice <= 0) {
            alert("الرجاء تحديد المورد وإدخال سعر التكلفة بشكل صحيح");
            return;
        }

        await addSupplierPrice({
            supplier_id: supplierId,
            cost_price: Number(costPrice),
            lead_time_days: typeof leadTime === 'number' ? leadTime : undefined,
            supplier_part_number: partNumber,
            notes: notes
        });
        setIsAdding(false);
        resetForm();
    }

    const resetForm = () => {
        setSupplierId('');
        setCostPrice(0);
        setLeadTime('');
        setPartNumber('');
        setNotes('');
    }

    if (isLoading) {
        return <div className="animate-pulse space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 border-r-4 border-emerald-500 pr-3">أسعار الموردين (التوريد)</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    إضافة تسعيرة جديدة
                </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                أفضل الأسعار المسجلة لهذا المنتج من مختلف الموردين وتجار الجملة.
            </p>

            {prices && prices.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التكلفة (السعر)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم القطعة لدى المورد</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت التوريد</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {prices.map((price) => (
                                <tr key={price.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Building2 className="h-5 w-5 text-gray-400 ml-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{price.supplier_name || 'مورد غير معروف'}</div>
                                                <div className="text-xs text-gray-500">تم التحديث: {new Date(price.last_updated).toLocaleDateString('ar-SA')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-emerald-600 font-bold">
                                            <DollarSign className="w-4 h-4 ml-1" />
                                            {price.cost_price.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                        {price.supplier_part_number || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {price.lead_time_days ? (
                                            <div className="flex items-center text-sm text-orange-600">
                                                <Truck className="w-4 h-4 ml-1.5" />
                                                {price.lead_time_days} أيام
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">لا يوجد سجل أسعار</h3>
                    <p className="text-sm text-gray-500">
                        أضف الموردين المعتمدين لتسهيل طلب القطع لاحقاً.
                    </p>
                </div>
            )}

            {isAdding && (
                <div className="mt-6 p-5 border border-emerald-200 bg-emerald-50 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                        <h4 className="font-semibold text-emerald-900">إضافة أو تحديث سعر مورد</h4>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">إلغاء</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">معرف المورد (مؤقت حتى ربط القائمة)</label>
                            <input
                                type="text"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                placeholder="أدخل ID المورد"
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة (شامل الضريبة)</label>
                            <div className="relative">
                                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={costPrice || ''}
                                    onChange={(e) => setCostPrice(parseFloat(e.target.value))}
                                    className="w-full pr-10 pl-3 py-2 border rounded-lg bg-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم القطعة لدى المورد</label>
                            <input
                                type="text"
                                value={partNumber}
                                onChange={(e) => setPartNumber(e.target.value)}
                                placeholder="مثال: TY-48291"
                                className="w-full px-3 py-2 border rounded-lg bg-white font-mono text-left"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">مدة التوريد (بالأيام)</label>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="number"
                                    min="1"
                                    value={leadTime}
                                    onChange={(e) => setLeadTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    placeholder="عدد الأيام المتوقع"
                                    className="w-full pr-10 pl-3 py-2 border rounded-lg bg-white"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="خصم كميات، عرض مؤقت، الخ..."
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto">
                            {isSaving ? 'جاري الحفظ...' : 'حفظ الأسعار'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
