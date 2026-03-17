import React from 'react';
import { Search } from 'lucide-react';

const ScanningState: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <Search className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
            </div>
            <p className="text-sm font-bold text-gray-500 animate-pulse">جاري فحص المخزن... فضلاً انتظر</p>
        </div>
    );
};

export default ScanningState;
