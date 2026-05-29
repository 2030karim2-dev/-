import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Store, ScanBarcode, RotateCcw, PauseCircle, ShoppingCart, ChevronLeft, Home, Zap, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MicroHeader from '../../../ui/base/MicroHeader';
import ProductGrid from '../components/ProductGrid';
import POSSearchDropdown from '../components/POSSearchDropdown';
import SearchInput from '../../../ui/components/SearchInput';
// Fix: Changed default import to named import to resolve "no default export" error.
import { POSCart } from '../components/POSCart';
import { PaymentModal } from '../components/PaymentModal';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';
import SmartRecommendations from '../../../ui/pos/SmartRecommendations';
import { useSalesStore } from '../../sales/store';
import { usePOSStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { usePOSCheckout } from '../hooks';
import { usePOSSearch } from '../hooks/usePOSSearch';
import { posSearchService } from '../services/searchService';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useBreakpoint } from '../../../lib/hooks/useBreakpoint';
import { formatCurrency } from '../../../core/utils';
import type { Product } from '../../inventory/types';


const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'products' | 'cart'>('products');
  const [inStockOnly, setInStockOnly] = useState(false);
  const isDesktop = useBreakpoint('md');
  const { t } = useTranslation();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ── Smart Search ─────────────────────────────────────────────────
  const search = usePOSSearch({
    debounceMs: 200,
    minChars: 1,
    limit: 25,
    filters: {
      in_stock_only: inStockOnly,
    },
  });


  const { items, summary, selectedCustomer, resetCart, addProductToCart, initializeItems } = useSalesStore();
  const { suspendedOrders, suspendCurrentOrder, resumeOrder, removeSuspended } = usePOSStore();
  const { processPayment, isProcessing } = usePOSCheckout();

  // Handle barcode scan - use the search service directly
  const handleBarcodeScanned = useCallback(async (code: string) => {
    setIsScannerOpen(false);
    const { user } = useAuthStore.getState();
    if (!user?.company_id) return;

    // Try exact barcode match first
    const result = await posSearchService.searchByBarcode(user.company_id, code);
    if (result) {
      const product: Product = {
        id: result.id,
        company_id: user.company_id,
        name: result.name_ar,
        name_ar: result.name_ar,
        sku: result.sku || '---',
        part_number: result.part_number || null,
        brand: result.brand || null,
        category: result.category || null,
        size: result.size || null,
        specifications: null,
        cost_price: result.cost_price,
        sale_price: result.selling_price,
        selling_price: result.selling_price,
        stock_quantity: result.stock_quantity,
        min_stock_level: 0,
        unit: result.unit || 'pcs',
        image_url: result.image_url ?? null,
        alternative_numbers: result.alternative_numbers ?? null,
        created_at: new Date().toISOString(),
      };
      addProductToCart(product as any);
    } else {
      // Fallback: set search query to scanned code
      search.setQuery(code);
    }
  }, [addProductToCart, search]);

  // Handle search result selection from dropdown
  const handleSearchSelect = useCallback((result: typeof search.results[number]) => {
    const product: Product = {
      id: result.id,
      company_id: '',
      name: result.name_ar,
      name_ar: result.name_ar,
      sku: result.sku || '---',
      part_number: result.part_number || null,
      brand: result.brand || null,
      category: result.category || null,
      size: result.size || null,
      specifications: null,
      cost_price: result.cost_price,
      sale_price: result.selling_price,
      selling_price: result.selling_price,
      stock_quantity: result.stock_quantity,
      min_stock_level: 0,
      unit: result.unit || 'pcs',
      image_url: result.image_url ?? null,
      alternative_numbers: result.alternative_numbers ?? null,
      created_at: new Date().toISOString(),
    };
    search.selectResult(result);
    addProductToCart(product as any);
  }, [addProductToCart, search]);

  useEffect(() => {
    if (items.length === 0) initializeItems(0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsScannerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [initializeItems, items.length]);

  const handlePayConfirm = useCallback((method: 'cash' | 'card') => {
    processPayment({
      partyId: selectedCustomer?.id || null,
      type: 'sale',
      items: items.filter(i => i.productId).map(i => ({
        ...i,
        unitPrice: i.price,
        costPrice: i.costPrice || 0,
        maxStock: 0,

      })),
      discount: 0,
      paymentMethod: method === 'card' ? 'credit' : 'cash',
      status: 'paid'
    }, {
      onSuccess: () => {
        setIsPaymentModalOpen(false);
        resetCart();
      }
    });
  }, [processPayment, selectedCustomer, items, resetCart]);

  const handleSuspend = () => {
    if (items.filter(i => i.productId).length === 0) return;
    suspendCurrentOrder(items, selectedCustomer);
    resetCart();
  };

  const actions = (
    <div className="flex gap-1.5">
      <button
        onClick={() => { setShowSuspended(!showSuspended); }}
        className="relative p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl hover:bg-amber-100 active:scale-95 transition-all border border-amber-100 dark:border-amber-900/30"
        title={t('suspended_orders')}
      >
        <PauseCircle size={18} />
        {suspendedOrders.length > 0 && (
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
            {suspendedOrders.length}
          </span>
        )}
      </button>
      <button
        onClick={() => navigate('/')}
        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-100 dark:border-slate-800"
        title="الرجوع للرئيسية"
      >
        <Home size={18} />
      </button>
      <button
        onClick={() => { setIsQuickMode(!isQuickMode); }}
        className={`p-2 rounded-xl active:scale-95 transition-all border ${isQuickMode ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border-slate-100 dark:border-slate-800'}`}
        title="الوضع السريع"
      >
        <Zap size={18} />
      </button>
      <button
        onClick={() => { resetCart(); }}
        className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-100 active:scale-95 transition-all border border-rose-100 dark:border-rose-900/30"
        title={t('clear_cart')}
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-gray-50 dark:bg-slate-950 fixed inset-0 z-50 overflow-hidden font-cairo select-none">
      <MicroHeader
        title={t('pos_title')}
        icon={Store}
        iconColor="text-blue-600"
        actions={actions}
        searchWidth="w-full flex-1"
        extraRow={
          <div className="flex items-center gap-2 w-full max-w-[800px]">
            {/* Search Input Container */}
            <div ref={searchContainerRef} className="relative flex-1 w-full min-w-0">
              <SearchInput
                value={search.query}
                onChange={search.setQuery}
                placeholder="اسم الصنف، SKU، أو امسح الباركود (CTRL+B)..."
                loading={search.isLoading}
                variant="primary"
                size={isDesktop ? 'md' : 'sm'}
                className="w-full"
                onKeyDown={search.onKeyDown}
                onEscape={search.closeDropdown}
              />
              <POSSearchDropdown
                open={search.showDropdown}
                onClose={search.closeDropdown}
                results={search.results}
                loading={search.isLoading}
                query={search.query}
                isShowingPopular={search.isShowingPopular}
                selectedIndex={search.selectedIndex}
                sortMode={search.sortMode}
                onSortChange={search.setSortMode}
                onSelect={handleSearchSelect}
                triggerRef={searchContainerRef as React.RefObject<HTMLElement>}
                total={search.total}
                searchTimeMs={search.searchTimeMs}
              />
            </div>

            {/* Quick Filters */}
            <button
              type="button"
              onClick={() => { setInStockOnly(!inStockOnly); }}
              className={`
                flex items-center justify-center gap-1.5 px-3 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 border-2 h-[34px] md:h-[38px] shrink-0
                ${inStockOnly
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              <Layers size={14} className={inStockOnly ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">متوفر فقط</span>
            </button>

            {/* Scanner Button */}
            {!isQuickMode && (
              <button
                type="button"
                onClick={() => { setIsScannerOpen(true); }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[34px] md:h-[38px] rounded-xl shadow-xl shadow-blue-500/10 active:scale-[0.98] transition-all font-bold text-[10px] md:text-xs uppercase tracking-wider px-3 shrink-0"
              >
                <ScanBarcode size={14} />
                <span className="hidden sm:inline">{t('launch_scanner')}</span>
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden divide-x dark:divide-slate-800 flex-row-reverse relative">
        {/* Cart Sidebar / Mobile View */}
        <aside className={`
          ${isDesktop ? 'w-[380px] lg:w-[420px] xl:w-[480px] 2xl:w-[540px] 3xl:w-[600px] 5xl:w-[680px] border-r' : (activeMobileTab === 'cart' ? 'w-full' : 'hidden')}
          flex flex-col h-full bg-white dark:bg-slate-900 shadow-2xl relative z-20 transition-all duration-300 dark:border-slate-800
        `}>
          {!isDesktop && (
            <div className="p-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => { setActiveMobileTab('products'); }}
                className="flex items-center gap-2 text-blue-600 font-bold text-xs"
              >
                <ChevronLeft size={16} /> العودة للمنتجات
              </button>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">مراجعة الطلب</span>
            </div>
          )}
          <POSCart onPay={() => { setIsPaymentModalOpen(true); }} onSuspend={handleSuspend} />

          {!isQuickMode && (
            <div className="p-2 bg-gray-50 dark:bg-slate-950 border-t dark:border-slate-800 hidden md:block">
              <SmartRecommendations cartItems={items.filter(i => i.productId) as any} onAdd={(name) => { search.setQuery(name); }} />
            </div>
          )}
        </aside>

        {/* Product Grid / Mobile View */}
        <main className={`
          ${isDesktop ? 'flex-1' : (activeMobileTab === 'products' ? 'flex-1' : 'hidden')} 
          overflow-hidden relative bg-gray-50/50 dark:bg-slate-950/50
        `}>
          <ProductGrid searchTerm={search.debouncedQuery} onAddToCart={(p) => { addProductToCart(p as any); }} inStockOnly={inStockOnly} />
        </main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      {!isDesktop && activeMobileTab === 'products' && items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 z-40 animate-in slide-in-from-bottom-10 h-24 pointer-events-none">
          <div
            onClick={() => { setActiveMobileTab('cart'); }}
            className="w-full max-w-md mx-auto h-full bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/40 flex items-center justify-between px-6 py-3 cursor-pointer pointer-events-auto active:scale-[0.98] transition-all"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">إجمالي السلة ({items.length})</span>
              <span dir="ltr" className="text-xl font-bold font-mono">{formatCurrency(summary.totalAmount)} YER</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-2xl">
                <ShoppingCart size={20} />
              </div>
              <span className="text-sm font-bold">عرض السلة</span>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <ScannerOverlay
          onScan={(code) => handleBarcodeScanned(code)}
          onClose={() => { setIsScannerOpen(false); }}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); }}
        total={summary.totalAmount}
        currency={useSalesStore.getState().currency}
        onConfirm={handlePayConfirm}
        isProcessing={isProcessing}
      />

      {/* Suspended Orders List Modal */}
      {showSuspended && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 rounded-2xl overflow-hidden max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30">
              <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-white">الطلبـات المعلقـة ({suspendedOrders.length})</h3>
              <button
                type="button"
                onClick={() => { setShowSuspended(false); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                إغلاق
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {suspendedOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <p className="text-xs md:text-sm font-bold">لا توجد أي طلبات معلقة حالياً.</p>
                </div>
              ) : (
                suspendedOrders.map((order) => (
                  <div key={order.id} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10 hover:border-blue-500/50 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {order.customer?.name || 'عميل نقدي'}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
                        الوقت: {order.time} • عدد المواد: {order.items.length}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = resumeOrder(order.id);
                          if (res) {
                            useSalesStore.setState({
                              items: res.items,
                              selectedCustomer: res.customer
                            });
                            useSalesStore.getState().calculateTotals();
                            setShowSuspended(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/15"
                      >
                        استعادة
                      </button>
                      <button
                        type="button"
                        onClick={() => { removeSuspended(order.id); }}
                        className="px-3 py-1.5 border border-rose-250 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/30 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl text-xs font-bold transition-all active:scale-95"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
