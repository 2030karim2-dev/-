import React, { useState } from 'react';
import { X, ArrowLeftRight, Package, Search, Plus, Trash2, Database, AlertCircle, FileText } from 'lucide-react';
import { useWarehouses, useInventoryMutations } from '../hooks/useInventoryManagement';
import { useProducts } from '../hooks/useProducts';
import Button from '../../../ui/base/Button';
import Modal from '../../../ui/base/Modal';

interface NewTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewTransferModal: React.FC<NewTransferModalProps> = ({ isOpen, onClose }) => {
    const { data: warehouses } = useWarehouses();
    const { createTransfer, isTransferring } = useInventoryMutations();
    const [productQuery, setProductQuery] = useState('');
    const { products } = useProducts(productQuery);

    const [fromWh, setFromWh] = useState('');
    const [toWh, setToWh] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedItems, setSelectedItems] = useState<{ product: any, qty: number }[]>([]);

    if (!isOpen) return null;

    const handleAddItem = (p: any) => {
        if (selectedItems.find(i => i.product.id === p.id)) return;
        setSelectedItems([...selectedItems, { product: p, qty: 1 }]);
        setProductQuery('');
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.product.id !== id));
    };

    const handleSubmit = () => {
        if (!fromWh || !toWh || selectedItems.length === 0 || fromWh === toWh) {
            alert("يرجى التأكد من اختيار مستودعين مختلفين وإضافة أصناف.");
            return;
        }
        createTransfer({
            from_warehouse_id: fromWh,
            to_warehouse_id: toWh,
            notes: notes,
            items: selectedItems.map(i => ({ product_id: i.product.id, quantity: i.qty }))
        }, { onSuccess: onClose });
    };

    const footerContent = (
        <>
            <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button
                onClick={handleSubmit}
                isLoading={isTransferring}
                disabled={!fromWh || !toWh || selectedItems.length === 0 || fromWh === toWh}
                variant="success"
                className="flex-1"
            >
                تأكيد المناقلة
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={ArrowLeftRight}
            title="مناقلة بضاعة بين المستودعات"
            description="تحويل كميات من فرع إلى آخر وتحديث الأرصدة"
            footer={footerContent}
        >
            <div className="space-y-4">
                {/* Warehouse Picker Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800 relative">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase mr-1">من مستودع</label>
                        <select
                            value={fromWh}
                            onChange={(e) => setFromWh(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-bold outline-none"
                        >
                            <option value="">اختر المصدر...</option>
                            {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>

                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[-50%] w-8 h-8 bg-white dark:bg-slate-700 rounded-full shadow-md items-center justify-center text-emerald-600 z-10 border dark:border-slate-600">
                        <ArrowLeftRight size={14} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase mr-1">إلى مستودع</label>
                        <select
                            value={toWh}
                            onChange={(e) => setToWh(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-bold outline-none"
                        >
                            <option value="">اختر الوجهة...</option>
                            {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Product Search Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={productQuery}
                            onChange={(e) => setProductQuery(e.target.value)}
                            placeholder="ابحث بالأصناف المراد نقلها..."
                            className="w-full bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 pr-10 text-sm font-bold shadow-sm outline-none"
                        />
                        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>

                    {productQuery.length > 1 && products.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                            {products.map(p => (
                                <div key={p.id} onClick={() => handleAddItem(p)} className="p-2 border-b dark:border-slate-800 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200">{p.name}</p>
                                    </div>
                                    <Plus size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Items List */}
                <div className="space-y-2">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase mr-1 tracking-widest">الأصناف المحددة</h3>
                    {selectedItems.length === 0 ? (
                        <div className="p-8 border-2 border-dashed dark:border-slate-800 rounded-xl text-center text-gray-400">
                            <p className="text-xs font-bold">لم تضف أي أصناف بعد</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {selectedItems.map(item => (
                                <div key={item.product.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-700 flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200 line-clamp-1">{item.product.name}</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => setSelectedItems(selectedItems.map(si => si.product.id === item.product.id ? { ...si, qty: parseInt(e.target.value) || 1 } : si))}
                                            className="w-16 bg-gray-50 dark:bg-slate-700 rounded-md p-1 text-center text-xs font-bold"
                                        />
                                        <button onClick={() => handleRemoveItem(item.product.id)} className="p-1 text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase mr-1 flex items-center gap-1.5">
                        <FileText size={12} />
                        ملاحظات
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ملاحظات إضافية حول عملية المناقلة..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 text-xs font-bold"
                        rows={2}
                    ></textarea>
                </div>
            </div>
        </Modal>
    );
};

export default NewTransferModal;