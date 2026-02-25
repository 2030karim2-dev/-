// ============================================
// Invoice Summary Component
// Shows invoice totals and summary
// ============================================

import React from 'react';
import type { InvoiceSummary } from '../../types';

interface InvoiceSummaryProps {
    summary: InvoiceSummary;
    showDiscount?: boolean;
    onDiscountChange?: (discount: number) => void;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
    summary,
    showDiscount = true,
    onDiscountChange,
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">ملخص الفاتورة</h3>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">المجموع الفرعي</span>
                    <span className="font-medium">{summary.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-500">الضريبة (15%)</span>
                    <span className="font-medium">{summary.taxAmount.toFixed(2)}</span>
                </div>

                {showDiscount && summary.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                        <span>الخصم</span>
                        <span>-{summary.discountAmount.toFixed(2)}</span>
                    </div>
                )}

                <div className="h-px bg-gray-200 dark:bg-slate-700 my-2" />

                <div className="flex justify-between items-center text-xl font-bold">
                    <span>الإجمالي</span>
                    <span className="text-emerald-600">{summary.totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default InvoiceSummary;
