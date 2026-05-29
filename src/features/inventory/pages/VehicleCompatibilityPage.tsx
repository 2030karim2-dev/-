import React, { useState } from 'react';
import { Car, Box, CalendarDays, Sparkles, Search, Globe, ExternalLink } from 'lucide-react';
import { useVehicleCompatibility } from '../hooks/useVehicleCompatibility';
import MicroHeader from '../../../ui/base/MicroHeader';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { AIChatInterface } from '../components/AIChatInterface';
import CompatibilitySearchForm from '../components/auto_parts/CompatibilitySearchForm';
import CompatibilityVehicleGrid from '../components/auto_parts/CompatibilityVehicleGrid';
import CompatibilityArticleCard from '../components/auto_parts/CompatibilityArticleCard';
import LocalProductMatches from '../components/auto_parts/LocalProductMatches';
import { TechnicalSpecifications } from '../components/auto_parts/TechnicalSpecifications';

const VehicleCompatibilityPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'catalog' | 'ai'>('catalog');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [aiQuery, setAiQuery] = useState('');

  const handleAiConsult = (query: string) => {
    setAiQuery(`ابحث عن توافق ومواصفات رقم القطعة ${query}`);
    setActiveTab('ai');
  };

  const { data, isLoading, isError, error: _error } = useVehicleCompatibility(activeSearch);
  const article = data?.article ? { ...data.article, articleId: String(data.article.articleId) } : null;
  const vehicles = data?.vehicles ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
      setActiveTab('catalog');
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
                onClick={() => { setActiveTab('catalog'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Box size={16} /> البحث في الفهرس
              </button>
              <button 
                onClick={() => { setActiveTab('ai'); }}
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
              <CompatibilitySearchForm 
                searchInput={searchInput} 
                setSearchInput={setSearchInput} 
                handleSearch={handleSearch} 
                isLoading={isLoading} 
              />

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

              {isError && (
                 <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 text-xs font-bold text-center">
                    حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
                 </div>
              )}

              {/* Extended Search Hub when No Local Results Found */}
              {!isLoading && !isError && vehicles.length === 0 && activeSearch && (
                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
                  {/* Warning Notice Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center shadow-md">
                    <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
                      <Car size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                      لم نجد نتائج متوافقة محلياً
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                      لم نتمكن من العثور على توافق مؤكد لرقم القطعة <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 mx-1 font-bold">{activeSearch}</span> في قاعدة البيانات الفنية المحلية.
                    </p>
                  </div>

                  {/* Quick Search Action Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Google Search Card */}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(activeSearch + ' vehicle compatibility fitment')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg group text-right"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                        <Search size={22} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 justify-end">
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-500" />
                          البحث السريع عبر جوجل
                        </h4>
                        <p className="text-slate-400 text-xs mt-1">البحث عن توافق القطعة وأبعادها في الويب</p>
                      </div>
                    </a>

                    {/* AI Assistant Card */}
                    <button
                      onClick={() => { handleAiConsult(activeSearch); }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg group text-right w-full"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                        <Sparkles size={22} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 justify-end">
                          استشارة المساعد الذكي
                        </h4>
                        <p className="text-slate-400 text-xs mt-1">دع الذكاء الاصطناعي يبحث ويحلل مواصفات القطعة</p>
                      </div>
                    </button>
                  </div>

                  {/* Global EPC Catalogs Section */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 justify-end">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">البحث المباشر في الكتالوجات العالمية</h3>
                        <p className="text-[10px] text-slate-400 font-bold">افتح محرك بحث القطعة مباشرة في أشهر منصات قطع غيار السيارات العالمية</p>
                      </div>
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Globe size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Catalog Cards */}
                      {[
                        {
                          name: 'Partsouq',
                          desc: 'كتالوج قطع الغيار اليابانية والكورية والخليجية بالرقم الأصلي',
                          url: `https://partsouq.com/en/search/all?q=${encodeURIComponent(activeSearch)}`,
                          badge: 'الأشهر خليجياً'
                        },
                        {
                          name: 'FitInPart',
                          desc: 'مستودع الكتالوجات وقطع الغيار والتوافق التقني والقياسات',
                          url: `https://www.fitinpart.sg/index.php?route=product/search&search=${encodeURIComponent(activeSearch)}`,
                          badge: 'التوافق الآسيوي'
                        },
                        {
                          name: 'Trodo',
                          desc: 'فهرس متطور للتوافق مع أرقام البدائل والتوزيع في الشرق الأوسط',
                          url: `https://www.trodo.ae/catalogsearch/result/?q=${encodeURIComponent(activeSearch)}`,
                          badge: 'دعم محلي/عربي'
                        },
                        {
                          name: 'Autodoc',
                          desc: 'الكتالوج الأوروبي الأكبر لقطع الغيار والسيارات الألمانية والأوروبية',
                          url: `https://www.autodoc.co/search?keyword=${encodeURIComponent(activeSearch)}`,
                          badge: 'أوروبي شامل'
                        },
                        {
                          name: 'Size.name',
                          desc: 'محرك مطابقة قياسات الفلاتر، أقمشة المكابح، المساعدين وغيرها',
                          url: `https://size.name/en/search?q=${encodeURIComponent(activeSearch)}`,
                          badge: 'قاعدة بيانات القياسات'
                        },
                        {
                          name: 'Spareto',
                          desc: 'البحث عن أرقام قطع OEM وبدائل الأوفر ماركت مع مقارنة المواصفات',
                          url: `https://spareto.com/brands?utf8=%E2%9C%93&q=${encodeURIComponent(activeSearch)}`,
                          badge: 'بدائل ومواصفات'
                        }
                      ].map((cat, idx) => (
                        <a
                          key={idx}
                          href={cat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between text-right hover:border-indigo-300 dark:hover:border-indigo-800 transition-all hover:-translate-y-0.5 group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                              {cat.badge}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                              <ExternalLink size={10} className="text-slate-400 group-hover:text-indigo-600" />
                              {cat.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                            {cat.desc}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
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
                  {article && <CompatibilityArticleCard article={article} />}

                  {article && (
                    <TechnicalSpecifications
                      productName={article.articleProductName}
                      partNumber={article.articleNo}
                    />
                  )}

                  {/* Local Inventory Match Check */}
                  <LocalProductMatches partNumber={activeSearch} />

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">المركبات المتوافقة</h3>
                      <p className="text-sm text-slate-500">تم العثور على {vehicles.length} مركبة</p>
                    </div>
                  </div>

                  <CompatibilityVehicleGrid vehicles={vehicles} />
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
                
                <AIChatInterface
                  initialQuery={aiQuery}
                  onClearInitialQuery={() => { setAiQuery(''); }}
                />
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default VehicleCompatibilityPage;
