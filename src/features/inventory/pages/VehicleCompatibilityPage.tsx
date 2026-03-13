import React, { useState } from 'react';
import { Car, Search, Loader2, Box, Wrench, CalendarDays, Factory, Sparkles } from 'lucide-react';
import { useVehicleCompatibility } from '../hooks/useVehicleCompatibility';
import MicroHeader from '../../../ui/base/MicroHeader';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { AIChatInterface } from '../components/AIChatInterface';

const VehicleCompatibilityPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'catalog' | 'ai'>('catalog');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { data, isLoading, isError, error } = useVehicleCompatibility(activeSearch);
  const article = data?.article ?? null;
  const vehicles = data?.vehicles ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
      setActiveTab('catalog'); // Switch back to catalog result view if searching via catalog
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo">
      <MicroHeader
        title={t('vehicle_compatibility_search')}
        icon={Car}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
        <div className="max-w-none mx-auto space-y-6">
          
          {/* Header & Modes Selection */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Car className="text-indigo-600" /> مستكشف توافق المركبات
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">اختر طريقة البحث المفضلة لديك</p>
            </div>
            
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border dark:border-slate-800">
              <button 
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Search size={16} /> البحث في الفهرس
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'ai' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles size={16} className="text-amber-500" /> المساعد الذكي (AI)
              </button>
            </div>
          </div>

          {activeTab === 'catalog' ? (
            <div className="space-y-6">
              {/* Header & Search Area */}
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

              {/* Loading & States for Catalog */}
              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl h-24 border border-slate-200 dark:border-slate-800"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-40 border border-slate-200 dark:border-slate-800"></div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State (Not Found) */}
              {!isLoading && !isError && vehicles.length === 0 && activeSearch && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center max-w-2xl mx-auto shadow-sm">
                  <div className="mx-auto w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-6">
                    <Car size={40} strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">لا توجد مركبات متوافقة</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    لم نتمكن من العثور على مركبات متوافقة مع رقم القطعة <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 mx-1">{activeSearch}</span>.
                  </p>
                </div>
              )}

              {/* Idle State (No Search Yet) */}
              {!isLoading && !isError && !activeSearch && (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 border-8 border-white dark:border-slate-900 shadow-xl shadow-indigo-500/5">
                    <Box size={48} className="text-indigo-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">مستكشف الفهرس المباشر</h3>
                  <p className="text-slate-400 max-w-sm text-center text-sm leading-relaxed">
                    اكتب رقم القطعة أعلاه لاستخراج قائمة كاملة بالمركبات المتوافقة.
                  </p>
                </div>
              )}

              {/* Results Area */}
              {!isLoading && !isError && vehicles.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  {/* Article Info Card */}
                  {article && (
                    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-5 border border-indigo-100 dark:border-slate-700 shadow-md shadow-indigo-500/5">
                      <div className="flex items-center gap-4 flex-wrap">
                        {article.imageUrl && (
                          <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0 shadow-sm">
                            <img src={article.imageUrl} alt={article.articleProductName} className="w-full h-full object-contain rounded-lg" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-lg">{article.articleNo}</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{article.articleProductName}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5"><Factory size={14} /> {article.supplierName}</span>
                            <span className="flex items-center gap-1.5"><Wrench size={14} /> ID: {article.articleId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">المركبات المتوافقة</h3>
                      <p className="text-sm text-slate-500">تم العثور على {vehicles.length} مركبة</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                            <Car size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{v.make}</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{v.model}</p>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                             <div className="flex flex-wrap gap-1.5">
                              {v.years.map((year, idx) => (
                                <span key={idx} className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                  {year}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-100 dark:border-slate-800 mb-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">المساعد الذكي (AI)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      يمكنك طرح أسئلة طبيعية للمساعد الذكي. مثلاً: "ابحث لي عن فلاتر لهيونداي إلنترا 2018" أو "ما هي القطع المتوافقة مع تويوتا لاندكروزر 2022؟". وسيقوم المساعد بالبحث والرد عليك بشكل تفصيلي.
                    </p>
                  </div>
                </div>
                
                <AIChatInterface />
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default VehicleCompatibilityPage;
