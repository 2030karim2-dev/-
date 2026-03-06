// ============================================
// Invoice Cart Component
// Displays items in the current invoice
// ============================================

import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem, InvoiceSummary } from '../../types';
import { useTranslation } from '../../../../lib/hooks/useTranslation';

interface InvoiceCartProps {
    items: CartItem[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemoveItem: (productId: string) => void;
    summary: InvoiceSummary;
}

const InvoiceCart: React.FC<InvoiceCartProps> = ({
    items,
    onUpdateQuantity,
    onRemoveItem,
    summary,
}) => {
    const { t } = useTranslation();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-lg">{t('no_items_in_cart') || 'السلة فارغة'}</p>
                <p className="text-sm mt-2">{t('add_products_hint') || 'أضف منتجات للبدء'}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm">
                        <tr className="text-right text-xs text-gray-500 dark:text-slate-400">
                            <th className="p-3 font-medium">{t('product') || 'المنتج'}</th>
                            <th className="p-3 font-medium">{t('price') || 'السعر'}</th>
                            <th className="p-3 font-medium">{t('quantity') || 'الكمية'}</th>
                            <th className="p-3 font-medium">{t('total') || 'المجموع'}</th>
                            <th className="p-3 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr
                                key={item.productId}
                                className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                            >
                                <td className="p-3">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {item.name}
                                            {item.isCoreReturn && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="يجب استلام القطعة القديمة (الرجيع) من العميل">
                                                    يتطلب رجيع
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">{item.sku}</p>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-slate-300">
                                    {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                            disabled={item.quantity >= item.maxStock}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3 font-medium text-gray-900 dark:text-white">
                                    {(item.quantity * item.unitPrice).toFixed(2)}
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => onRemoveItem(item.productId)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('subtotal') || 'المجموع الفرعي'}</span>
                        <span className="font-medium">{summary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('tax') || 'الضريبة'}</span>
                        <span className="font-medium">{summary.taxAmount.toFixed(2)}</span>
                    </div>
                    {summary.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>{t('discount') || 'الخصم'}</span>
                            <span>-{summary.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-slate-700">
                        <span>{t('total') || 'الإجمالي'}</span>
                        <span className="text-emerald-600">{summary.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceCart;
