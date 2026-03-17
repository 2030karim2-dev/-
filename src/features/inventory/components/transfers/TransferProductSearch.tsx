import React from 'react';
import { Search } from 'lucide-react';

interface Props {
    query: string;
    setQuery: (q: string) => void;
    products: any[];
    onAddItem: (p: any) => void;
}

const TransferProductSearch: React.FC<Props> = ({ query, setQuery, products, onAddItem }) => {
    return (
        <div className="space-y-1">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث بالأصناف المراد نقلها..."
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-10 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black"
                />
                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
        </div>
    );
};

export default TransferProductSearch;
