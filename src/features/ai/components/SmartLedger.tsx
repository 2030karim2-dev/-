
import React, { useState } from 'react';
import { BookOpen, Loader2, Database } from 'lucide-react';
import { generateAIContent } from '../aiProvider';
import { formatCurrency } from '../../../core/utils';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE } from '../strictPrompts';

interface Props {
    data: any;
}

const SmartLedger: React.FC<Props> = ({ data }) => {
    const [analysis, setAnalysis] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timestamp, setTimestamp] = useState('');

    const audit = async () => {
        setIsLoading(true);
        try {
            const tbLines = data.trialBalance.slice(0, 15).map((a: any) =>
                `حساب ${a.code} "${a.name}": مدين=${formatCurrency(a.totalDebit)}, دائن=${formatCurrency(a.totalCredit)}, رصيد=${formatCurrency(a.netBalance)}`
            ).join('\n');

            const totalDebit = data.trialBalance.reduce((s: number, a: any) => s + (a.totalDebit || 0), 0);
            const totalCredit = data.trialBalance.reduce((s: number, a: any) => s + (a.totalCredit || 0), 0);

            const result = await generateAIContent(
                `=== بيانات ميزان المراجعة الحقيقية من قاعدة البيانات ===\nإجمالي المدين: ${formatCurrency(totalDebit)}\nإجمالي الدائن: ${formatCurrency(totalCredit)}\nالفرق: ${formatCurrency(totalDebit - totalCredit)}\n\nتفاصيل الحسابات:\n${tbLines || 'لا توجد بيانات في ميزان المراجعة'}\n=== نهاية البيانات ===\n\n${STRICT_DATA_RULES}\n\nدقق هذا الميزان:\n1. هل الميزان متوازن (مجموع المدين = مجموع الدائن)؟ اذكر الأرقام الحقيقية\n2. أي حسابات لها أرصدة غير طبيعية؟\n3. هل هناك قيود مشبوهة؟\n4. ملاحظات تدقيقية\n\nلكل نقطة سطر يبدأ بإيموجي. اذكر الأرقام الحقيقية من البيانات فقط.`,
                STRICT_SYSTEM_ROLE + '\nأنت مدقق حسابات. فقط أشر للأرقام المقدمة لك بالضبط.',
                { temperature: 0.1 }
            );
            setAnalysis(result.split('\n').filter((l: string) => l.trim().length > 5));
            setTimestamp(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setAnalysis(['⚠️ تعذر التدقيق']);
        }
        setIsLoading(false);
    };

    // Calculate totals for display
    const totalDebit = data.trialBalance.reduce((s: number, a: any) => s + (a.totalDebit || 0), 0);
    const totalCredit = data.trialBalance.reduce((s: number, a: any) => s + (a.totalCredit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-gray-800 dark:text-white">مدقق الحسابات</h3>
                        <p className="text-[8px] text-gray-400 font-bold">بيانات ميزان المراجعة من قاعدة البيانات</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${isBalanced ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isBalanced ? '✅ متوازن' : '⚠️ غير متوازن'}
                    </span>
                    <button onClick={audit} disabled={isLoading}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : '📋 تدقيق'}
                    </button>
                </div>
            </div>

            {/* Trial Balance Table — 100% REAL DATA */}
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800/80 z-10">
                        <tr>
                            <th className="p-2.5 text-right font-black text-gray-400">الكود</th>
                            <th className="p-2.5 text-right font-black text-gray-400">الحساب</th>
                            <th className="p-2.5 text-left font-black text-emerald-500">مدين</th>
                            <th className="p-2.5 text-left font-black text-rose-500">دائن</th>
                            <th className="p-2.5 text-left font-black text-blue-500">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.trialBalance.slice(0, 12).map((a: any, i: number) => (
                            <tr key={i} className="border-t dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-gray-400">{a.code}</td>
                                <td className="p-2.5 font-medium text-gray-700 dark:text-slate-300 truncate max-w-[150px]">{a.name}</td>
                                <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(a.totalDebit)}</td>
                                <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400">{formatCurrency(a.totalCredit)}</td>
                                <td className={`p-2.5 font-mono font-bold ${a.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                                    {formatCurrency(a.netBalance)}
                                </td>
                            </tr>
                        ))}
                        {data.trialBalance.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-[10px] italic">لا توجد بيانات في ميزان المراجعة</td></tr>
                        )}
                        {/* Totals row */}
                        {data.trialBalance.length > 0 && (
                            <tr className="border-t-2 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 font-black">
                                <td className="p-2.5" colSpan={2}><span className="text-[9px] text-gray-500">الإجمالي</span></td>
                                <td className="p-2.5 font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalDebit)}</td>
                                <td className="p-2.5 font-mono text-rose-700 dark:text-rose-400">{formatCurrency(totalCredit)}</td>
                                <td className={`p-2.5 font-mono ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(totalDebit - totalCredit)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* AI Audit Results */}
            {analysis.length > 0 && (
                <div className="p-4 border-t dark:border-slate-800">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Database size={9} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600">تدقيق مبني على بيانات الميزان الحقيقية</span>
                        {timestamp && <span className="text-[7px] text-emerald-400">• {timestamp}</span>}
                    </div>
                    <div className="space-y-1.5">
                        {analysis.map((line, i) => (
                            <p key={i} className="text-[11px] text-gray-700 dark:text-slate-300 font-medium bg-blue-50/50 dark:bg-blue-950/10 rounded-xl px-3 py-2">{line}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartLedger;
