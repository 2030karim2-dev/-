// ============================================
// Invoice Items Grid Component
// Grid view of invoice line items
// ============================================

import React from 'react';
import { CartItem } from '../../types';

interface InvoiceItemsGridProps {
    items: CartItem[];
    onSelectItem?: (item: CartItem) => void;
}

const InvoiceItemsGrid: React.FC<InvoiceItemsGridProps> = ({ items, onSelectItem }) => {
    if (items.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                <p className="col-span-full text-center text-gray-400 py-8">
                    لا توجد عناصر في الفاتورة
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {items.map((item) => (
                <div
                    key={item.productId}
                    onClick={() => onSelectItem?.(item)}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {item.sku}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">السعر:</span>
                            <span className="font-medium">{item.unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">الكمية:</span>
                            <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                            <span className="text-gray-500">المجموع:</span>
                            <span className="font-bold text-blue-600">
                                {(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InvoiceItemsGrid;
