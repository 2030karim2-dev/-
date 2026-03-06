import React, { useState, useEffect, useCallback } from 'react';
import { Store, ScanBarcode, RotateCcw, PauseCircle, X, ShoppingCart, ChevronLeft } from 'lucide-react';
import MicroHeader from '../../../ui/base/MicroHeader';
import ProductGrid from '../components/ProductGrid';
// Fix: Changed default import to named import to resolve "no default export" error.
import { POSCart } from '../components/POSCart';
import { PaymentModal } from '../components/PaymentModal';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';
import SmartRecommendations from '../../../ui/pos/SmartRecommendations';
import { useSalesStore } from '../../sales/store';
import { usePOSStore } from '../store';
import { usePOSCheckout } from '../hooks';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useBreakpoint } from '../../../lib/hooks/useBreakpoint';
import { formatCurrency } from '../../../core/utils';


const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'products' | 'cart'>('products');
  const isDesktop = useBreakpoint('md');
  const { t } = useTranslation();


  const { items, summary, selectedCustomer, resetCart, addProductToCart, initializeItems } = useSalesStore();
  const { suspendedOrders, suspendCurrentOrder } = usePOSStore();
  const { processPayment, isProcessing } = usePOSCheckout();

  useEffect(() => {
    if (items.length === 0) initializeItems(0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsScannerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        taxRate: i.tax
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
        onClick={() => setShowSuspended(!showSuspended)}
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
        onClick={() => resetCart()}
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
        searchPlaceholder={t('pos_search_placeholder')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        extraRow={
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center gap-3 bg-blue-600 text-white py-2 rounded-xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all font-bold text-[11px] uppercase tracking-widest px-4"
          >
            <ScanBarcode size={18} />
            <span className="hidden sm:inline">{t('launch_scanner')}</span>
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden divide-x dark:divide-slate-800 flex-row-reverse relative">
        {/* Cart Sidebar / Mobile View */}
        <aside className={`
          ${isDesktop ? 'w-[400px] lg:w-[450px] border-r' : (activeMobileTab === 'cart' ? 'w-full' : 'hidden')} 
          flex flex-col h-full bg-white dark:bg-slate-900 shadow-2xl relative z-20 transition-all duration-300 dark:border-slate-800
        `}>
          {!isDesktop && (
            <div className="p-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setActiveMobileTab('products')}
                className="flex items-center gap-2 text-blue-600 font-bold text-xs"
              >
                <ChevronLeft size={16} /> العودة للمنتجات
              </button>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">مراجعة الطلب</span>
            </div>
          )}
          <POSCart onPay={() => setIsPaymentModalOpen(true)} onSuspend={handleSuspend} />

          <div className="p-2 bg-gray-50 dark:bg-slate-950 border-t dark:border-slate-800 hidden md:block">
            <SmartRecommendations cartItems={items.filter(i => i.productId) as any} onAdd={(name) => setSearchTerm(name)} />
          </div>
        </aside>

        {/* Product Grid / Mobile View */}
        <main className={`
          ${isDesktop ? 'flex-1' : (activeMobileTab === 'products' ? 'flex-1' : 'hidden')} 
          overflow-hidden relative bg-gray-50/50 dark:bg-slate-950/50
        `}>
          <ProductGrid searchTerm={searchTerm} onAddToCart={(p) => addProductToCart(p as any)} />
        </main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      {!isDesktop && activeMobileTab === 'products' && items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 z-40 animate-in slide-in-from-bottom-10 h-24 pointer-events-none">
          <div
            onClick={() => setActiveMobileTab('cart')}
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
          onScan={(code) => { setSearchTerm(code); setIsScannerOpen(false); }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={summary.totalAmount}
        currency={useSalesStore.getState().currency}
        onConfirm={handlePayConfirm}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default POSPage;
