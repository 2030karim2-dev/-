import React from 'react';
import { ShieldCheck } from 'lucide-react';

const EmptyDuplicatesState: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4 text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full text-emerald-600">
                <ShieldCheck size={48} />
            </div>
            <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">مخزنك نظيف تماماً!</h4>
                <p className="text-sm text-gray-500 mt-2">لم نجد أي أصناف بأسماء متشابهة بشكل يدعو للقلق.</p>
            </div>
        </div>
    );
};

export default EmptyDuplicatesState;
