import React from 'react';
import { useAuthStore } from '../../auth/store'; // Assuming auth store exists
import { Calendar } from 'lucide-react';
import { APP_NAME } from '../../../constants';

const WelcomeSection: React.FC = () => {
    const { user } = useAuthStore();
    const currentDate = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                        مرحباً، <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-emerald-600">{user?.name || 'مستخدم'}</span> 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        أهلاً بك في {APP_NAME}. إليك نظرة عامة على نشاطك اليوم.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {currentDate}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
