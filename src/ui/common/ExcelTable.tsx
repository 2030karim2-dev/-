import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, Download, Search, FileSpreadsheet, MoreVertical, Maximize2, Minimize2, Plus, Minus, ChevronLeft, ChevronRight, Keyboard, Copy, Clipboard, Trash2, CornerDownLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '../../core/utils';
import EmptyState from '../base/EmptyState';
import { useTableKeyboardNavigation, TABLE_SHORTCUTS } from './useTableKeyboardNavigation';
import { useTableDragDrop } from './hooks/useTableDragDrop';
import { useTableSelection } from './hooks/useTableSelection';

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  accessorKey?: keyof T | string;
  sortKey?: keyof T | string;
  width?: string;
  className?: string;
  isEditable?: boolean;
  footer?: (data: T[]) => React.ReactNode;
}

interface ExcelTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  colorTheme?: 'blue' | 'green' | 'orange' | 'indigo';
  onExport?: () => void;
  showSearch?: boolean;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  onOrderChange?: (reorderedData: T[]) => void;
  onCellUpdate?: (rowIndex: number, accessorKey: string, value: any) => void | Promise<void>;
  enablePagination?: boolean;
  pageSize?: number;
  enableSelection?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getRowId?: (row: T) => string;
  isRTL?: boolean;
  showShortcutsPanel?: boolean;
  enableResize?: boolean;
  enableDrag?: boolean;
}

function ExcelTable<T>({
  columns, data, title, subtitle, emptyMessage, colorTheme = 'blue',
  onExport, showSearch = true, onRowClick, onRowDoubleClick, onOrderChange,
  onCellUpdate, enablePagination = true, pageSize = 20,
  enableSelection = false, selectedRowIds = new Set(), onSelectionChange, getRowId,
  isRTL = false, showShortcutsPanel = false, enableResize = true, enableDrag = false
}: ExcelTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalSearch, setInternalSearch] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(showShortcutsPanel);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState<{ width?: string; height?: string }>({});
  const [originalSize, setOriginalSize] = useState<{ width?: string; height?: string }>({});

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  useEffect(() => {
    setItemsPerPage(pageSize);
  }, [pageSize]);

  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const themes = {
    blue: {
      accent: 'bg-blue-600',
      border: 'border-blue-200',
      text: 'text-blue-600',
      sub: 'bg-blue-50/50',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      glow: 'shadow-[0_0_12px_rgba(37,99,235,0.4)]',
      focusRing: 'ring-blue-500/50'
    },
    green: {
      accent: 'bg-emerald-600',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      sub: 'bg-emerald-50/50',
      hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      focusRing: 'ring-emerald-500/50'
    },
    orange: {
      accent: 'bg-orange-600',
      border: 'border-orange-200',
      text: 'text-orange-600',
      sub: 'bg-orange-50/50',
      hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      glow: 'shadow-[0_0_12px_rgba(234,88,12,0.4)]',
      focusRing: 'ring-orange-500/50'
    },
    indigo: {
      accent: 'bg-indigo-600',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      sub: 'bg-indigo-50/50',
      hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      glow: 'shadow-[0_0_12px_rgba(79,70,229,0.4)]',
      focusRing: 'ring-indigo-500/50'
    },
  };

  const currentTheme = themes[colorTheme];

  const processedData = useMemo(() => {
    let items = [...data];
    if (internalSearch) {
      const term = internalSearch.toLowerCase();
      items = items.filter(item =>
        Object.values(item as any).some(val => String(val).toLowerCase().includes(term))
      );
    }
    if (sortConfig) {
      items.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        return sortConfig.direction === 'asc'
          ? (aVal > bVal ? 1 : -1)
          : (aVal < bVal ? 1 : -1);
      });
    }
    return items;
  }, [data, sortConfig, internalSearch]);

  // Reset page when search/data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [internalSearch, data.length]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return processedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage, enablePagination]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // Custom Hooks
  const { orderedData, handlers: { handleDragStart, handleDragEnter, handleDragEnd, handleDrop } } = useTableDragDrop(paginatedData, onOrderChange);
  const { toggleAllSelection, toggleRowSelection } = useTableSelection(orderedData, selectedRowIds, onSelectionChange, getRowId);

  const {
    focusedCell,
    setFocusedCell,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    startEditing,
    saveEdit,
    selection,
    copyCells,
    copySelection,
    pasteCells,
    handleCellClick,
    startSelection,
    updateSelection,
    endSelection,
    pageSizeRef,
    moveFocus
  } = useTableKeyboardNavigation({
    tableRef,
    orderedData,
    columns,
    isRTL,
    onRowDoubleClick,
    onCellUpdate
  });

  // Update page size ref
  useEffect(() => {
    pageSizeRef.current = itemsPerPage;
  }, [itemsPerPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).parentElement as HTMLTableCellElement;
    resizingRef.current = {
      colIndex,
      startX: e.clientX,
      startWidth: th.offsetWidth,
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { colIndex, startX, startWidth } = resizingRef.current;
    const newWidth = startWidth + (e.clientX - startX);
    if (newWidth > 40) {
      setColumnWidths(prev => ({ ...prev, [colIndex]: newWidth }));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Reset size to original
  const handleResetSize = () => {
    setCustomSize({});
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
  };

  // Save original size before resize
  const saveOriginalSize = useCallback(() => {
    if (tableWrapperRef.current && Object.keys(originalSize).length === 0) {
      setOriginalSize({
        width: tableWrapperRef.current.style.width || '',
        height: tableWrapperRef.current.style.height || ''
      });
    }
  }, [originalSize]);

  // Handle wrapper resize start (for full table resize)
  const handleWrapperResizeStart = (direction: string, e: React.MouseEvent) => {
    if (!enableResize) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    saveOriginalSize();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = tableWrapperRef.current?.offsetWidth || 0;
    const startHeight = tableWrapperRef.current?.offsetHeight || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!tableWrapperRef.current) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) {
        newWidth = Math.max(400, startWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(400, startWidth - deltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(200, startHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(200, startHeight - deltaY);
      }

      setCustomSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = `${direction}-resize`;
    document.body.style.userSelect = 'none';
  };

  // Handle drag start
  const handleTableDragStart = (e: React.MouseEvent) => {
    if (!enableDrag || isZoomed) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const rect = tableWrapperRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - dragOffset.x;
      const newY = moveEvent.clientY - dragOffset.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleEditInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveEdit();
      if (editingCell) {
        const nextRow = Math.min(orderedData.length - 1, editingCell.row + 1);
        setFocusedCell({ row: nextRow, col: editingCell.col });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await saveEdit();
      if (editingCell) {
        const nextCol = e.shiftKey
          ? Math.max(0, editingCell.col - 1)
          : Math.min(columns.length - 1, editingCell.col + 1);
        const nextRow = nextCol !== editingCell.col
          ? editingCell.row
          : (e.shiftKey ? Math.max(0, editingCell.row - 1) : Math.min(orderedData.length - 1, editingCell.row + 1));
        setFocusedCell({ row: nextRow, col: nextCol });
      }
    }
  };

  // Handle mouse selection
  const handleMouseDownCell = (e: React.MouseEvent, rowIdx: number, colIdx: number) => {
    if (e.shiftKey) {
      handleCellClick(rowIdx, colIdx, true);
    } else {
      startSelection(rowIdx, colIdx);
    }
  };

  const handleMouseEnterCell = () => {
    if (isMouseDown) {
      // Selection is being made - handled by startSelection/updateSelection
    }
  };

  // Status bar text
  const getStatusText = () => {
    if (!focusedCell) return '';
    const { row, col } = focusedCell;
    const totalRows = orderedData.length;
    const totalCols = columns.length;
    return `خلية [${row + 1}, ${col + 1}] من [${totalRows} × ${totalCols}]`;
  };

  // Get shortcuts for display
  const getShortcutIcon = (key: string) => {
    switch (key) {
      case 'ArrowUp': return <ArrowUp size={10} />;
      case 'ArrowDown': return <ArrowDown size={10} />;
      case 'ArrowLeft': return <ArrowLeft size={10} />;
      case 'ArrowRight': return <ArrowRight size={10} />;
      case 'Home': return <CornerDownLeft size={10} className="rotate-90" />;
      case 'End': return <CornerDownLeft size={10} className="-rotate-90" />;
      case 'Delete': return <Trash2 size={10} />;
      case 'c':
      case 'Copy': return <Copy size={10} />;
      case 'v':
      case 'Paste': return <Clipboard size={10} />;
      default: return null;
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-2 transition-all duration-300", isZoomed && "fixed inset-2 md:inset-4 z-[100] bg-white dark:bg-slate-950 p-2 md:p-4 shadow-2xl rounded-xl")}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-1">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {title && (
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className={cn("w-1.5 h-4 rounded-none", currentTheme.accent)}></span>
                {title}
              </h3>
              {subtitle && <p className="text-[9px] text-gray-400 pr-3.5 font-bold">{subtitle}</p>}
            </div>
          )}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 p-1 rounded-lg">
            {enableResize && (
              <>
                <button
                  onClick={handleResetSize}
                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                  title="إعادة الحجم الأصلي"
                >
                  <RotateCcw size={14} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-0.5" />
              </>
            )}
            <button onClick={() => setIsZoomed(!isZoomed)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm">
              {isZoomed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.1))} className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm"><Minus size={12} /></button>
            <span className="text-[10px] w-8 text-center font-mono font-bold text-gray-500">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm"><Plus size={12} /></button>
          </div>
          {/* Keyboard shortcuts toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showShortcuts ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
            title="اختصارات لوحة المفاتيح"
          >
            <Keyboard size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
          {showSearch && (
            <div className="relative flex-1 sm:max-w-xs group">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors", isRTL ? "left-3 right-auto" : "right-3")} size={14} />
              <input
                type="text"
                placeholder="بحث سريع في النتائج..."
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                className={cn(
                  "w-full py-2 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-lg text-[11px] font-bold outline-none focus:border-blue-500/50 transition-all shadow-sm focus:shadow-md",
                  isRTL ? "pl-3 pr-9" : "pr-9 pl-3"
                )}
              />
            </div>
          )}
          {onExport && (
            <button onClick={onExport} className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-600 hover:text-white transition-all rounded-lg shadow-sm">
              <FileSpreadsheet size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Panel */}
      {showShortcuts && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase text-gray-600 dark:text-slate-300">اختصارات لوحة المفاتيح</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TABLE_SHORTCUTS.map((shortcut, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px]">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded text-[8px] font-mono font-bold text-gray-600 dark:text-slate-400 flex items-center gap-0.5 min-w-[45px] justify-center">
                  {shortcut.modifier && <span className="text-[6px]">{shortcut.modifier === 'ctrl' ? 'Ctrl' : shortcut.modifier === 'shift' ? '⇧' : 'Alt'}</span>}
                  {getShortcutIcon(shortcut.key) || shortcut.key.toUpperCase()}
                </kbd>
                <span className="text-gray-500 dark:text-slate-500">{isRTL ? shortcut.descriptionAr : shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Wrapper with Resize Handles */}
      <div
        ref={tableWrapperRef}
        className="border border-gray-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl relative"
        style={{
          ...(customSize.width ? { width: customSize.width } : {}),
          ...(customSize.height ? { maxHeight: customSize.height } : {}),
          ...(position.x !== 0 || position.y !== 0 ? { transform: `translate(${position.x}px, ${position.y}px)` } : {}),
          ...(isDragging ? { cursor: 'grabbing', opacity: 0.9 } : {})
        }}
        onMouseDown={handleTableDragStart}
      >
        {/* Resize Handles */}
        {enableResize && !isZoomed && (
          <>
            {/* Top */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize hover:bg-blue-500/30 transition-colors z-10"
              onMouseDown={(e) => handleWrapperResizeStart('n', e)}
            />
            {/* Bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize hover:bg-blue-500/30 transition-colors z-10"
              onMouseDown={(e) => handleWrapperResizeStart('s', e)}
            />
            {/* Left */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1.5 cursor-w-resize hover:bg-blue-500/30 transition-colors z-10"
              onMouseDown={(e) => handleWrapperResizeStart('w', e)}
            />
            {/* Right */}
            <div
              className="absolute top-0 bottom-0 right-0 w-1.5 cursor-e-resize hover:bg-blue-500/30 transition-colors z-10"
              onMouseDown={(e) => handleWrapperResizeStart('e', e)}
            />
            {/* Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => handleWrapperResizeStart('nw', e)} />
            <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => handleWrapperResizeStart('ne', e)} />
            <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => handleWrapperResizeStart('sw', e)} />
            <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => handleWrapperResizeStart('se', e)} />
          </>
        )}
        {/* Drag Handle in Title */}
        {enableDrag && !isZoomed && (
          <div className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 hover:text-blue-500">
            <GripVertical size={14} />
          </div>
        )}
        <div
          ref={tableRef}
          tabIndex={-1}
          className="overflow-auto custom-scrollbar outline-none max-h-[calc(100vh-220px)]"
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => { setIsMouseDown(false); endSelection(); }}
          onMouseLeave={() => { setIsMouseDown(false); endSelection(); }}
        >
          <table
            style={{ fontSize: `${zoomLevel * 11}px` }}
            className={cn(
              "w-full border-collapse table-auto min-w-[800px]",
              isRTL ? "text-left" : "text-right"
            )}
          >
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700">
                {enableSelection && (
                  <th className="w-10 p-2 text-center border-r border-gray-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      checked={orderedData.length > 0 && selectedRowIds.size === orderedData.length}
                      onChange={toggleAllSelection}
                    />
                  </th>
                )}
                <th className="w-10 p-2 text-[9px] text-gray-400 font-black border-r border-gray-200 dark:border-slate-700">#</th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{ width: columnWidths[idx] ? `${columnWidths[idx]}px` : col.width }}
                    onClick={() => col.sortKey && handleSort(col.sortKey as string)}
                    className={cn(
                      "group p-2 text-[10px] font-black uppercase text-gray-600 dark:text-slate-300 border-r border-gray-200 dark:border-slate-700 relative select-none",
                      col.sortKey ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700" : "",
                      col.width || ''
                    )}
                  >
                    <div className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "")}>
                      <span>{col.header}</span>
                      {col.sortKey && (
                        <div className="flex flex-col">
                          <ChevronUp size={8} className={cn("text-gray-400", sortConfig?.key === col.sortKey && sortConfig.direction === 'asc' ? "text-blue-600" : "opacity-30")} />
                          <ChevronDown size={8} className={cn("text-gray-400", sortConfig?.key === col.sortKey && sortConfig.direction === 'desc' ? "text-blue-600" : "opacity-30")} />
                        </div>
                      )}
                    </div>
                    <div onMouseDown={(e) => handleMouseDown(e, idx)} className="absolute top-0 h-full w-1 cursor-col-resize group-hover:bg-blue-400/50 transition-colors" style={isRTL ? { left: 0, right: 'auto' } : { right: 0 }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (enableSelection ? 2 : 1)}><EmptyState title="لا توجد بيانات" description={emptyMessage || "لم يتم العثور على سجلات مطابقة."} /></td>
                </tr>
              ) : (
                orderedData.map((row, rowIdx) => {
                  const rowId = getRowId ? getRowId(row) : (row as any).id || String(rowIdx);
                  const isSelected = selectedRowIds.has(rowId);

                  // Check if row is in selection range
                  const isInSelection = selection ? (
                    rowIdx >= Math.min(selection.start.row, selection.end.row) &&
                    rowIdx <= Math.max(selection.start.row, selection.end.row)
                  ) : false;

                  return (
                    <tr
                      key={rowId}
                      draggable={!!onOrderChange}
                      onDragStart={e => handleDragStart(e, rowIdx)}
                      onDragEnter={e => handleDragEnter(e, rowIdx)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        "transition-colors group border-b border-gray-100 dark:border-slate-800",
                        onRowClick ? "cursor-pointer" : "",
                        !!onOrderChange && "cursor-grab",
                        currentTheme.hover,
                        isSelected ? "bg-blue-50/80 dark:bg-blue-900/40" : "",
                        isInSelection ? "bg-blue-30/30 dark:bg-blue-900/20" : ""
                      )}
                    >
                      {enableSelection && (
                        <td className="p-2 text-center border-r border-gray-100 dark:border-slate-800">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              checked={isSelected}
                              onChange={() => { }}
                              onClick={(e) => toggleRowSelection(rowId, e)}
                            />
                          </div>
                        </td>
                      )}
                      <td className={cn(
                        "p-2 text-[10px] text-gray-400 font-mono text-center border-r border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/10",
                        focusedCell?.row === rowIdx ? currentTheme.glow : ""
                      )}>
                        {(currentPage - 1) * itemsPerPage + rowIdx + 1}
                      </td>
                      {columns.map((col, colIdx) => {
                        const isFocused = focusedCell?.row === rowIdx && focusedCell?.col === colIdx;
                        const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

                        // Check if cell is in selection
                        const isCellInSelection = selection ? (
                          rowIdx >= Math.min(selection.start.row, selection.end.row) &&
                          rowIdx <= Math.max(selection.start.row, selection.end.row) &&
                          colIdx >= Math.min(selection.start.col, selection.end.col) &&
                          colIdx <= Math.max(selection.start.col, selection.end.col)
                        ) : false;

                        return (
                          <td
                            key={colIdx}
                            data-row-index={rowIdx}
                            data-col-index={colIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowClick?.(row);
                              handleCellClick(rowIdx, colIdx, e.shiftKey);
                            }}
                            onMouseDown={(e) => handleMouseDownCell(e, rowIdx, colIdx)}
                            onMouseEnter={() => handleMouseEnterCell()}
                            onDoubleClick={() => { onRowDoubleClick?.(row); if (col.isEditable) startEditing(rowIdx, colIdx); }}
                            className={cn(
                              "p-0 text-[11px] border-r border-gray-100 dark:border-slate-800 transition-all cursor-cell relative",
                              isFocused && !isEditing ? cn("outline-2 outline -outline-offset-2 outline-blue-600 dark:outline-blue-400", currentTheme.glow, "bg-blue-50/50 dark:bg-blue-900/30") : "",
                              isCellInSelection && !isFocused ? "bg-blue-30/20 dark:bg-blue-900/10" : "",
                              isRTL ? "[&>*:first-child]:text-left [&>*:first-child]:rtl:text-right" : "",
                              col.className || ''
                            )}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleEditInputKeyDown}
                                className={cn(
                                  "w-full h-full bg-blue-100/80 dark:bg-blue-900/50 outline-none border-2 border-blue-600 dark:border-blue-400 p-2 font-bold text-gray-800 dark:text-slate-100",
                                  currentTheme.glow,
                                  col.className
                                )}
                              />
                            ) : (
                              <div className="p-2">{col.accessor(row)}</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
            {columns.some(c => c.footer) && (
              <tfoot className="border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <td className="p-2 border-r border-gray-200 dark:border-slate-700"></td>
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("p-2 text-[11px] font-black border-r border-gray-200 dark:border-slate-700", col.className)}>
                      {col.footer ? col.footer(orderedData) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Status Bar */}
        <div className="p-2 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-2 select-none">
          <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-slate-400">
            <span className="font-mono">{getStatusText()}</span>
            {selection && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-bold">
                تحديد: {Math.abs(selection.end.row - selection.start.row) + 1} × {Math.abs(selection.end.col - selection.start.col) + 1}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={copySelection}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="نسخ (Ctrl+C)"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={pasteCells}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="لصق (Ctrl+V)"
            >
              <Clipboard size={12} />
            </button>
          </div>
        </div>

        {/* Pagination Footer */}
        {enablePagination && totalPages > 1 && (
          <div className="p-2 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-2 select-none">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>عرض</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded p-1 outline-none focus:border-blue-500 text-[10px]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={1000000}>الكل</option>
              </select>
              <span>سجل من أصل {processedData.length}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "flex items-center gap-1 p-1 px-3 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[10px] font-bold text-gray-600 dark:text-gray-400",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                <span>السابق</span>
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all",
                        currentPage === pageNum
                          ? cn("text-white shadow-md", currentTheme.accent)
                          : "text-gray-500 hover:bg-white dark:hover:bg-slate-800"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex items-center gap-1 p-1 px-3 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[10px] font-bold text-gray-600 dark:text-gray-400",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <span>التالي</span>
                {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExcelTable;
