
import React, { useState } from 'react';
import { useParties, useStatement } from '../hooks';
import ExcelTable from '../../../ui/common/ExcelTable';
import { formatCurrency, cn } from '../../../core/utils';
import { tafqeet } from '../../../core/utils/tafqeet';
import { Printer, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PartyType } from '../types';
import Button from '../../../ui/base/Button';
import ShareButton from '../../../ui/common/ShareButton';
import { exportStatementToExcel } from '../utils/statementExcelExporter';
import { partiesService } from '../service';
import { useAuthStore } from '../../auth/store';
import { FileDown } from 'lucide-react';

const StatementView: React.FC<{ partyType: PartyType }> = ({ partyType }) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const { data: parties } = useParties(partyType);
  const { data: statement, isLoading } = useStatement(selectedPartyId, partyType);
  const [isExporting, setIsExporting] = useState(false);
  const user = useAuthStore(state => state.user);

  const selectedParty = parties.find(p => p.id === selectedPartyId);

  const columns = [
    {
      header: 'التاريخ',
      accessor: (row: Record<string, unknown>) => <span dir="ltr" className="text-xs">{row.date as string}</span>,
      width: '110px',
      align: 'center' as const
    },
    {
      header: 'المرجع',
      accessor: (row: Record<string, unknown>) => <span dir="ltr" className="font-mono font-bold text-blue-600">{row.ref as string}</span>,
      width: '110px',
      align: 'center' as const
    },
    {
      header: 'نوع العملية',
      accessor: (row: Record<string, unknown>) => <span className="font-bold text-gray-700 dark:text-slate-300">{row.operation_type as string}</span>,
      width: '120px',
      align: 'center' as const
    },
    {
      header: 'البيان',
      accessor: (row: Record<string, unknown>) => <span className="text-xs text-gray-500 line-clamp-1" title={row.desc as string}>{row.desc as string}</span>,
      align: 'right' as const
    },
    {
      header: 'مدين',
      accessor: (row: Record<string, unknown>) => (row.debit as number) > 0 ? <span dir="ltr" className="font-bold text-emerald-600">{formatCurrency(row.debit as number)}</span> : '-',
      width: '130px',
      align: 'center' as const
    },
    {
      header: 'دائن',
      accessor: (row: Record<string, unknown>) => (row.credit as number) > 0 ? <span dir="ltr" className="font-bold text-rose-600">{formatCurrency(row.credit as number)}</span> : '-',
      width: '130px',
      align: 'center' as const
    },
    {
      header: 'الرصيد المتراكم',
      accessor: (row: Record<string, unknown>) => (
        <span dir="ltr" className={cn("font-bold font-mono", (row.balance as number) >= 0 ? "text-emerald-700" : "text-rose-700")}>
          {formatCurrency(row.balance as number)}
        </span>
      ),
      width: '150px',
      align: 'center' as const
    },
  ];

  return (
    <div className="space-y-3 print-area">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 flex gap-4 items-center no-print">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500">اختر {partyType === 'customer' ? 'العميل' : 'المورد'}</label>
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="w-full mt-1 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 px-3 text-sm font-bold"
          >
            <option value="">-- اختر من القائمة --</option>
            {parties?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedPartyId && selectedParty && (
          <div className="flex gap-2 mt-auto">
            <ShareButton
              size="md"
              showLabel
              eventType="party_statement"
              title={`مشاركة كشف حساب ${selectedParty.name}`}
              message={`📄 كشف حساب: ${selectedParty.name}\n━━━━━━━━━━━━━━\n${(statement || []).map((row: Record<string, unknown>) => `${row.date} | ${row.desc} | مدين: ${formatCurrency(row.debit as number)} | دائن: ${formatCurrency(row.credit as number)} | رصيد: ${formatCurrency(row.balance as number)}`).join('\n')}\n━━━━━━━━━━━━━━\n📊 الرصيد النهائي: ${formatCurrency(((statement || []).at(-1) as Record<string, unknown>)?.balance as number || 0)}`}
            />
            <Button
              onClick={async () => {
                if (!selectedPartyId || !statement || !user?.company_id) return;
                setIsExporting(true);
                try {
                  const company = await partiesService.getCompanyDetails(user.company_id);
                  exportStatementToExcel(company, selectedParty.name, statement as any);
                } catch (err) {
                  console.error('Export failed', err);
                } finally {
                  setIsExporting(false);
                }
              }}
              isLoading={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              leftIcon={<FileDown size={14} />}
            >
              تصدير Excel
            </Button>
            <Button onClick={() => window.print()} className="" leftIcon={<Printer size={14} />}>
              طباعة الكشف
            </Button>
          </div>
        )}
      </div>

      {selectedPartyId ? (
        isLoading ? <div className="p-20 text-center">جاري تحميل الكشف...</div> :
          <>
            <ExcelTable columns={columns} data={statement || []} title={`كشف حساب: ${selectedParty?.name}`} colorTheme={partyType === 'customer' ? 'green' : 'blue'} />

            {statement && statement.length > 0 && (
              <div className="mt-6 p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden relative group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  {/* Status Indicator */}
                  {(() => {
                    const lastEntry = statement[statement.length - 1];
                    const finalBalance = lastEntry.balance as number;
                    const isDebit = finalBalance > 0;
                    const isCredit = finalBalance < 0;
                    const absBalance = Math.abs(finalBalance);

                    return (
                      <>
                        <div className="md:col-span-1 space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Wallet size={14} />
                              الخلاصة المالية
                            </h3>
                            <p className="text-xs font-bold text-gray-400">الوضعية الحالية للحساب حتى تاريخ اليوم</p>
                          </div>

                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-tighter shadow-sm border",
                            isDebit ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              isCredit ? "bg-rose-50 text-rose-700 border-rose-100" :
                                "bg-gray-50 text-gray-600 border-gray-100"
                          )}>
                            {isDebit ? <TrendingUp size={14} /> : isCredit ? <TrendingDown size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                            {isDebit ? "رصيد مدين (له)" : isCredit ? "رصيد دائن (عليه)" : "الرصيد مصفر"}
                          </div>
                        </div>

                        <div className="md:col-span-1 bg-gray-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">صافي الرصيد</span>
                          <span dir="ltr" className={cn("text-3xl font-bold font-mono tracking-tighter", isDebit ? "text-emerald-600" : isCredit ? "text-rose-600" : "text-gray-400")}>
                            {formatCurrency(finalBalance)}
                          </span>
                        </div>

                        <div className="md:col-span-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">التفقيط (كتابةً)</span>
                          </div>
                          <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                              {finalBalance === 0 ? 'الرصيد مصفر حالياً' : `فقط ${tafqeet(absBalance)} لا غير.`}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
      ) : (
        <div className="p-20 text-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
          يرجى اختيار جهة لعرض كشف الحساب
        </div>
      )}
    </div>
  );
};

export default StatementView;
