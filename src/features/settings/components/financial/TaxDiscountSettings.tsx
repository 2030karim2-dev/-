
import React from 'react';
import { useTaxDiscountStore } from '../../taxDiscountStore';
import { Receipt, Percent, Tag } from 'lucide-react';

const TaxDiscountSettings: React.FC = () => {
    const { taxEnabled, defaultTaxRate, discountEnabled, setTaxEnabled, setDefaultTaxRate, setDiscountEnabled } = useTaxDiscountStore();

    return (
        <div className="space-y-6">
            {/* Tax Toggle */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                            <Receipt size={18} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">ضريبة القيمة المضافة</h4>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">تفعيل حساب الضريبة على الفواتير</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={taxEnabled}
                            onChange={(e) => setTaxEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                    </label>
                </div>

                {/* Tax Rate - only visible when tax is enabled */}
                {taxEnabled && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Percent size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <label className="text-xs font-bold text-gray-600 dark:text-slate-400">نسبة الضريبة الافتراضية (%)</label>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={defaultTaxRate}
                                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                                className="w-28 text-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none"
                            />
                            <span className="text-xs text-gray-400">%</span>
                            {/* Quick presets */}
                            <div className="flex gap-1.5">
                                {[5, 10, 15].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => setDefaultTaxRate(rate)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${defaultTaxRate === rate
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200 dark:shadow-amber-900/30'
                                                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                                            }`}
                                    >
                                        {rate}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Discount Toggle */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Tag size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">الخصومات</h4>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">إظهار عمود الخصم في الفواتير</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={discountEnabled}
                            onChange={(e) => setDiscountEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                </div>
            </div>

            {/* Info Notice */}
            {!taxEnabled && !discountEnabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in fade-in duration-300">
                    <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                        💡 الضريبة والخصم معطلان حالياً. لن تظهر أعمدة الضريبة أو الخصم في الفواتير. يمكنك تفعيلهما في أي وقت من هنا.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TaxDiscountSettings;
