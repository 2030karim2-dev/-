import React from 'react';
import { FileText } from 'lucide-react';

interface Props {
    alternatives?: string | null;
}

const AlternativesSection: React.FC<Props> = ({ alternatives }) => {
    if (!alternatives) return null;
    const list = alternatives.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 h-full">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-1.5"><FileText size={12} /> بدائل (Alternatives)</h4>
            <div className="flex flex-wrap gap-2">
                {list.map((alt, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono rounded-lg border border-indigo-100 dark:border-indigo-800">
                        {alt}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default AlternativesSection;
