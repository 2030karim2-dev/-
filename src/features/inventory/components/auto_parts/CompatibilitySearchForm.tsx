import React from 'react';
import { Loader2 } from 'lucide-react';
import SearchInput from '../../../../ui/components/SearchInput';

interface Props {
    searchInput: string;
    setSearchInput: (value: string) => void;
    handleSearch: (e: React.FormEvent) => void;
    isLoading: boolean;
}

const CompatibilitySearchForm: React.FC<Props> = ({ searchInput, setSearchInput, handleSearch, isLoading }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-xl shadow-indigo-500/5 border border-indigo-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                        البحث المباشر برقم القطعة
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        أدخل رقم القطعة (Article Number) أو رقم المصنع (OEM) لجلب كافة الماركات والموديلات المتوافقة.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto mt-6">
                    <div className="flex-1">
                        <SearchInput
                            value={searchInput}
                            onChange={setSearchInput}
                            placeholder="مثال: C 2029..."
                            loading={isLoading}
                            variant="primary"
                            size="lg"
                            dir="ltr"
                            onSubmit={handleSearch}
                            className="w-full"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !searchInput.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 text-sm md:text-base"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <span>عرض النتائج</span>}
                    </button>
                </form>

                {/* Popular Search Suggestions Tags */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold mt-4 relative z-10 text-slate-500">
                    <span>أصناف شائعة للبحث:</span>
                    {['C 2029', '04152-YZZA1', '90915-10001', 'NGK-7092', 'BOSCH-123'].map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchInput(tag)}
                            className="px-3 py-1 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-850 rounded-lg font-mono text-[10px] text-indigo-600 dark:text-indigo-400 transition-all active:scale-95"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CompatibilitySearchForm;
