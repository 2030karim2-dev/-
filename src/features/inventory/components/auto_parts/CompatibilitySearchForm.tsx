import React from 'react';
import { Search, Loader2 } from 'lucide-react';

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

                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mt-6 group">
                    <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none pr-5 z-20">
                        <Search className="h-6 w-6 text-indigo-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-5 pr-14 py-5 border-2 border-indigo-100 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl text-base md:text-lg placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white dark:focus:border-indigo-500 shadow-2xl shadow-indigo-500/5 placeholder:text-slate-400/70"
                        placeholder="مثال: C 2029..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        dir="ltr"
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !searchInput.trim()}
                        className="absolute left-2.5 top-2.5 bottom-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 overflow-hidden"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <span>عرض النتائج</span>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompatibilitySearchForm;
