/**
 * POS Smart Search Dropdown
 * Rich, visual search results dropdown with:
 * - Product cards with images, prices, stock, and brand info
 * - Category grouping
 * - Quick sort options (relevance, price, stock, popularity)
 * - Keyboard navigation
 * - Popular products when no query
 * - Sales history indicators
 */
import React, { useRef, useEffect } from 'react';
import {
    Package, TrendingUp, Tag, Factory, Ruler, Hash,
    Sparkles, Zap, ArrowUpDown, History,
    Barcode, Layers, Loader2, AlertCircle, Filter,
} from 'lucide-react';
import { cn } from '../../../core/utils';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import type { POSSearchResult } from '../hooks/usePOSSearch';
import type { SortMode } from '../hooks/usePOSSearch';

// ── Types ──────────────────────────────────────────────────────────

export interface POSSearchDropdownProps {
    /** Whether dropdown is visible */
    open: boolean;
    /** Close handler */
    onClose: () => void;
    /** Search results */
    results: POSSearchResult[];
    /** Is currently loading */
    loading?: boolean;
    /** Current search query */
    query: string;
    /** Is showing popular products (empty search) */
    isShowingPopular?: boolean;
    /** Currently selected index for keyboard nav */
    selectedIndex: number;
    /** Current sort mode */
    sortMode: SortMode;
    /** Sort mode change handler */
    onSortChange: (mode: SortMode) => void;
    /** Selection handler - called when user picks a result */
    onSelect: (result: POSSearchResult) => void;
    /** Ref to the trigger/input element */
    triggerRef?: React.RefObject<HTMLElement | null>;
    /** Total available results */
    total?: number;
    /** Search response time in ms */
    searchTimeMs?: number;
}

// ── Sort Options ───────────────────────────────────────────────────

const SORT_OPTIONS: Array<{ mode: SortMode; label: string; icon: React.ReactNode }> = [
    { mode: 'relevance', label: 'الأكثر تطابقاً', icon: <Sparkles size={12} /> },
    { mode: 'price_asc', label: 'السعر: منخفض', icon: <ArrowUpDown size={12} /> },
    { mode: 'price_desc', label: 'السعر: مرتفع', icon: <ArrowUpDown size={12} /> },
    { mode: 'stock_desc', label: 'الأكثر توفراً', icon: <Layers size={12} /> },
    { mode: 'popular', label: 'الأكثر مبيعاً', icon: <TrendingUp size={12} /> },
    { mode: 'name', label: 'أبجدياً', icon: <Filter size={12} /> },
];

// ── Match Type Badge ───────────────────────────────────────────────

const MatchBadge: React.FC<{ type?: string | undefined }> = ({ type }) => {
    if (!type || type === 'exact') return null;

    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
        barcode: {
            label: 'باركود',
            className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            icon: <Barcode size={12} />,
        },
        fuzzy: {
            label: 'تقريبي',
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            icon: <Sparkles size={12} />,
        },
        alternative: {
            label: 'بديل',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            icon: <Hash size={12} />,
        },
    };

    const c = config[type] || config.fuzzy;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold',
                c.className
            )}
        >
            {c.icon}
            {c.label}
        </span>
    );
};

// ── Result Card ────────────────────────────────────────────────────

const ResultCard: React.FC<{
    result: POSSearchResult;
    isSelected: boolean;
    onSelect: (result: POSSearchResult) => void;
    onMouseEnter: () => void;
}> = ({ result, isSelected, onSelect, onMouseEnter }) => {
    const hasStock = result.stock_quantity > 0;
    const hasImage = !!result.image_url;

    return (
        <button
            type="button"
            onClick={() => { onSelect(result); }}
            onMouseEnter={onMouseEnter}
            className={cn(
                'w-full text-right p-3.5 md:p-4 flex items-start gap-4 transition-all duration-150 border-b border-slate-100 dark:border-slate-800 last:border-b-0',
                'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                isSelected && 'bg-blue-100/70 dark:bg-blue-900/30 border-s-4 border-s-blue-500',
                !hasStock && 'opacity-70'
            )}
        >
            {/* Product Image / Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                {hasImage ? (
                    <img
                        src={result.image_url!}
                        alt={result.name_ar}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Package size={22} className="text-slate-400 dark:text-slate-600" />
                )}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-base truncate leading-snug">
                        {result.name_ar}
                    </h4>
                    {result.is_popular && (
                        <span title="منتج رائج">
                            <TrendingUp size={13} className="text-amber-500 flex-shrink-0" />
                        </span>
                    )}
                    <MatchBadge type={result.match_type} />
                </div>

                {/* Meta tags row */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
                    {result.sku && result.sku !== '---' && (
                        <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                            <Hash size={12} />
                            <span className="font-mono">{result.sku}</span>
                        </span>
                    )}
                    {result.part_number && result.part_number !== '---' && (
                        <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                            <Tag size={12} />
                            <span className="font-mono">{result.part_number}</span>
                        </span>
                    )}
                    {result.brand && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Factory size={12} />
                            {result.brand}
                        </span>
                    )}
                    {result.size && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            <Ruler size={12} />
                            {result.size}
                        </span>
                    )}
                    {result.category && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
                            <Layers size={12} />
                            {result.category}
                        </span>
                    )}
                </div>

                {/* Sales history indicator */}
                {result.sales_count && result.sales_count > 0 ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <History size={12} />
                        <span className="font-semibold">تم بيعه {result.sales_count} مرة</span>
                        {result.last_sale_date && (
                            <span className="text-slate-400 dark:text-slate-500">
                                آخر مرة: {new Date(result.last_sale_date).toLocaleDateString('ar-SA')}
                            </span>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Price & Stock Column */}
            <div className="flex-shrink-0 text-left flex flex-col items-end gap-1.5 min-w-[120px]">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">بيع:</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 text-xs md:text-base font-mono" dir="ltr">
                            {formatCurrency(result.selling_price)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">شراء:</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-mono" dir="ltr">
                            {formatCurrency(result.cost_price)}
                        </span>
                    </div>
                </div>
                <span
                    className={cn(
                        'text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full',
                        hasStock
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    )}
                >
                    {hasStock
                        ? `${formatNumberDisplay(result.stock_quantity)} ${result.unit}`
                        : 'نفد المخزون'}
                </span>
            </div>
        </button>
    );
};

// ── Main Component ─────────────────────────────────────────────────

const POSSearchDropdown: React.FC<POSSearchDropdownProps> = ({
    open,
    onClose,
    results,
    loading = false,
    query,
    isShowingPopular = false,
    selectedIndex,
    sortMode,
    onSortChange,
    onSelect,
    triggerRef,
    total = 0,
    searchTimeMs = 0,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // ── Scroll selected item into view ─────────────────────────────
    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-result-item]');
            if (items[selectedIndex]) {
                items[selectedIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex]);

    // ── Click outside handler ──────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                !triggerRef?.current?.contains(target)
            ) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, onClose, triggerRef]);

    if (!open) return null;

    return (
        <div
            ref={dropdownRef}
            className={cn(
                'absolute top-full left-0 right-0 mt-1.5 z-50',
                'bg-white dark:bg-slate-900 rounded-2xl',
                'shadow-2xl shadow-slate-900/10 dark:shadow-black/50',
                'border-2 border-slate-200 dark:border-slate-700',
                'overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200',
                'max-h-[70vh] flex flex-col'
            )}
        >
            {/* ── Sort Toolbar ──────────────────────────────────── */}
            <div className="flex items-center gap-1.5 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm overflow-x-auto no-scrollbar flex-shrink-0">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 flex-shrink-0">
                    ترتيب:
                </span>
                {SORT_OPTIONS.map((opt) => (
                    <button
                        key={opt.mode}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSortChange(opt.mode);
                        }}
                        className={cn(
                            'flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-all active:scale-95',
                            sortMode === opt.mode
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                        )}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* ── Results List ──────────────────────────────────── */}
            <div
                ref={listRef}
                className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800"
            >
                {/* Loading State */}
                {loading && (
                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Loader2 size={24} className="animate-spin text-blue-600" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <Zap size={10} className="text-white" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            جاري البحث الذكي...
                        </p>
                    </div>
                )}

                {/* Popular Products Header (empty search) */}
                {!loading && isShowingPopular && results.length > 0 && (
                    <div className="px-4 py-2 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-xs md:text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                                المنتجات الأكثر رواجاً
                            </span>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {!loading && results.length === 0 && query && (
                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <AlertCircle size={28} className="text-slate-400 dark:text-slate-600" />
                        </div>
                        <div className="text-center">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">
                                لا توجد نتائج لـ "{query}"
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                جرّب البحث بكلمات مختلفة أو تحقق من الإملاء
                            </p>
                        </div>
                    </div>
                )}

                {/* Result Items */}
                {!loading &&
                    results.map((result, idx) => (
                        <div key={result.id} data-result-item>
                            <ResultCard
                                result={result}
                                isSelected={idx === selectedIndex}
                                onSelect={onSelect}
                                onMouseEnter={() => { }}
                            />
                        </div>
                    ))}
            </div>

            {/* ── Footer: Stats ─────────────────────────────────── */}
            {!loading && results.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 flex-shrink-0">
                    <span>
                        {results.length} من {total} نتيجة
                        {searchTimeMs > 0 && ` • ${Math.round(searchTimeMs)}ms`}
                    </span>
                    <span className="flex items-center gap-1 opacity-60">
                        <Zap size={12} />
                        اضغط Enter للإضافة
                    </span>
                </div>
            )}
        </div>
    );
};

export default POSSearchDropdown;
