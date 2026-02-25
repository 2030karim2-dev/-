import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, Merge, ShieldCheck, X, Search, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import productService from '../services/productService';
import Button from '../../../ui/base/Button';
import { formatCurrency } from '../../../core/utils';
import Modal from '../../../ui/base/Modal';
import { cn } from '../../../core/utils';

interface DuplicatePair {
    product_a_id: string;
    product_a_name: string;
    product_a_sku: string;
    product_a_brand: string;
    product_a_stock: number;
    product_a_price: number;
    product_b_id: string;
    product_b_name: string;
    product_b_sku: string;
    product_b_brand: string;
    product_b_stock: number;
    product_b_price: number;
    similarity: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: string) => void;
}

const DeduplicationTool: React.FC<Props> = ({ isOpen, onClose, onEdit }) => {
    const { user } = useAuthStore();
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const scanInventory = async () => {
        if (!user?.company_id) return;
        setIsScanning(true);
        try {
            const results = await productService.getPotentialDuplicates(user.company_id);
            setDuplicates(results);
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            scanInventory();
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="فحص جودة الأسماء والمكررات"
            icon={Sparkles}
            description="نقوم بمقارنة جميع الأصناف في مخزنك لاكتشاف الأسماء المتشابهة التي قد تكون مكررة بنفس المنتج."
            footer={
                <div className="p-1 w-full flex justify-end">
                    <Button variant="outline" className="w-full" onClick={onClose}>إغلاق</Button>
                </div>
            }
        >
            <div className="flex flex-col min-h-[400px]">
                {isScanning ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                            <Search className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-500 animate-pulse">جاري فحص المخزن... فضلاً انتظر</p>
                    </div>
                ) : duplicates.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-center">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full text-emerald-600">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-gray-800 dark:text-white">مخزنك نظيف تماماً!</h4>
                            <p className="text-sm text-gray-500 mt-2">لم نجد أي أصناف بأسماء متشابهة بشكل يدعو للقلق.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                                تم العثور على {duplicates.length} زوج من المنتجات بأسماء متشابهة جداً.
                                نوصي بمراجعتها والتأكد من أنها ليست لنفس المنتج لتجنب تشتت المخزون.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {duplicates.map((pair, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl flex flex-col gap-4 hover:shadow-lg hover:border-blue-100 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 opacity-20"></div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">المنتج الأول</span>
                                                    <h6 className="text-sm font-black text-gray-800 dark:text-white leading-tight">{pair.product_a_name}</h6>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <span className="text-[10px] font-mono bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border dark:border-slate-700">{pair.product_a_sku || 'بدون SKU'}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold">{pair.product_a_brand || 'بدون ماركة'}</span>
                                                        <span className={cn("text-[10px] font-bold", pair.product_a_stock > 0 ? "text-emerald-600" : "text-rose-500")}>
                                                            المخزن: {pair.product_a_stock}
                                                        </span>
                                                        <span className="text-[10px] text-blue-600 font-black">{formatCurrency(pair.product_a_price || 0)}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-1 h-7 w-7 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    onClick={() => onEdit(pair.product_a_id)}
                                                >
                                                    <Edit2 size={12} />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center px-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm border dark:border-slate-700">
                                                <ArrowRight size={16} />
                                            </div>
                                            <div className="mt-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/20">
                                                {(pair.similarity * 100).toFixed(0)}%
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3 text-right">
                                            <div className="flex justify-between items-start flex-row-reverse">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">المنتج الثاني</span>
                                                    <h6 className="text-sm font-black text-gray-800 dark:text-white leading-tight">{pair.product_b_name}</h6>
                                                    <div className="flex flex-wrap gap-2 mt-1 justify-end">
                                                        <span className="text-[10px] text-blue-600 font-black">{formatCurrency(pair.product_b_price || 0)}</span>
                                                        <span className={cn("text-[10px] font-bold", pair.product_b_stock > 0 ? "text-emerald-600" : "text-rose-500")}>
                                                            المخزن: {pair.product_b_stock}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-bold">{pair.product_b_brand || 'بدون ماركة'}</span>
                                                        <span className="text-[10px] font-mono bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border dark:border-slate-700">{pair.product_b_sku || 'بدون SKU'}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-1 h-7 w-7 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                    onClick={() => onEdit(pair.product_b_id)}
                                                >
                                                    <Edit2 size={12} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] font-black gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Merge size={14} />
                                            دمج الصنفين (قريباً)
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DeduplicationTool;
