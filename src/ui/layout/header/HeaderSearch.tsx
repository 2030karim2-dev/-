
import React from 'react';
import { Search } from 'lucide-react';

const HeaderSearch: React.FC = () => (
  <div className="flex-1 max-w-lg mx-auto hidden md:block"> {/* Added hidden md:block */}
    <div className="relative group">
      <input 
        type="text" 
        placeholder="ابحث عن العميل، الصنف، الفاتورة..." 
        className="w-full bg-[#f3f4f6] dark:bg-slate-800 border-none rounded-lg py-2.5 pr-10 pl-4 text-sm text-gray-600 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/20 dark:focus:ring-accent/40 transition-all"
      />
      <Search className="absolute right-3 top-2.5 text-gray-400 dark:text-slate-500 group-focus-within:text-accent" size={18} />
    </div>
  </div>
);

export default HeaderSearch;
