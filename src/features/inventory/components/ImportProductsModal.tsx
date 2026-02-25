
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import Modal from '../../../ui/base/Modal';
import Button from '../../../ui/base/Button';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../core/utils';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ImportProductsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setStatus('idle');
        setErrorMsg('');
        
        // Quick Preview
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setPreview(data.slice(0, 5)); // Show first 5 rows
        };
        reader.readAsBinaryString(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !user?.company_id || !user?.id) return;
    
    setStatus('uploading');
    try {
        await inventoryService.processImportFile(file, user.company_id, user.id);
        setStatus('success');
        queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء معالجة الملف");
    }
  };

  const downloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
          { "اسم المنتج": "فحمات فرامل", "رقم الصنف": "BP-001", "الشركة": "Toyota", "سعر البيع": 150, "التكلفة": 100, "الكمية": 50 }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Inventory_Template.xlsx");
  };

  const footer = (
      <>
        {status === 'success' ? (
            <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700">إغلاق</Button>
        ) : (
            <div className="flex w-full gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
                <Button 
                    onClick={handleImport} 
                    isLoading={status === 'uploading'} 
                    disabled={!file}
                    className="flex-[2]"
                >
                    بدء الاستيراد
                </Button>
            </div>
        )}
      </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Upload}
      title="استيراد الأصناف (Excel)"
      description="إضافة كميات كبيرة من المنتجات دفعة واحدة"
      footer={footer}
    >
        <div className="space-y-6">
            {/* Step 1: Template Download */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-blue-600" size={20} />
                    <div>
                        <h4 className="text-xs font-black text-blue-800 dark:text-blue-300">نموذج الإدخال</h4>
                        <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400/60">قم بتحميل القالب لتعبئة بياناتك بشكل صحيح</p>
                    </div>
                </div>
                <button onClick={downloadTemplate} className="flex items-center gap-1 text-[9px] font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900 hover:text-blue-600 transition-colors">
                    <Download size={12} /> تحميل
                </button>
            </div>

            {/* Step 2: File Upload */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50",
                    file ? "border-emerald-400 bg-emerald-50/30" : "border-gray-200 dark:border-slate-700"
                )}
            >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                {file ? (
                    <div className="text-center animate-in zoom-in">
                        <FileSpreadsheet size={48} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-black text-gray-800 dark:text-slate-200">{file.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <Upload size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-xs font-black">اضغط لاختيار ملف Excel</p>
                        <p className="text-[9px] mt-1">يدعم الامتدادات .xlsx, .csv</p>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            {preview.length > 0 && status === 'idle' && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">معاينة البيانات (أول 5 صفوف)</h4>
                    <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-lg">
                        <table className="w-full text-[9px]">
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={i} className={i === 0 ? "bg-gray-100 dark:bg-slate-800 font-black" : "border-t dark:border-slate-800"}>
                                        {row.map((cell: any, j: number) => (
                                            <td key={j} className="p-2 border-l dark:border-slate-800 first:border-none">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {status === 'success' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircleCircle size={24} />
                    <div>
                        <h4 className="font-black text-xs">تم الاستيراد بنجاح!</h4>
                        <p className="text-[9px] font-bold opacity-80">تمت إضافة المنتجات إلى قاعدة البيانات.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 text-rose-700 dark:text-rose-400 animate-in shake">
                    <AlertCircle size={24} />
                    <div>
                        <h4 className="font-black text-xs">فشل الاستيراد</h4>
                        <p className="text-[9px] font-bold opacity-80">{errorMsg}</p>
                    </div>
                </div>
            )}
        </div>
    </Modal>
  );
};

// Internal icon component to fix lucide import issue if CheckCircle exists
const CheckCircleCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default ImportProductsModal;
