import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Trash2, Copy, Clipboard, Search, FileSpreadsheet, Keyboard, Minimize2, Maximize2, Minus, Plus, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '../../core/utils';
import { useTableKeyboardNavigation, TABLE_SHORTCUTS } from './useTableKeyboardNavigation';
import { useTableDragDrop } from './hooks/useTableDragDrop';
import { useTableSelection } from './hooks/useTableSelection';
import { ExcelTableHeader } from './ExcelTableHeader';
import { ExcelTableBody } from './ExcelTableBody';
import { ExcelTablePagination } from './ExcelTablePagination';

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  accessorKey?: keyof T | string;
  sortKey?: keyof T | string;
  width?: string;
  align?: 'left' | 'center' | 'right';
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
  isLoading?: boolean;
}

function ExcelTable<T>({
  columns, data, title, subtitle, emptyMessage, colorTheme = 'blue',
  onExport, showSearch = true, onRowClick, onRowDoubleClick, onOrderChange,
  onCellUpdate, enablePagination = true, pageSize = 20,
  enableSelection = false, selectedRowIds = new Set(), onSelectionChange, getRowId,
  isRTL = false, showShortcutsPanel = false, enableResize = true, enableDrag = false,
  isLoading = false
}: ExcelTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalSearch, setInternalSearch] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(showShortcutsPanel);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Resize state
  const [_isResizing, _setIsResizing] = useState(false);
  const [_resizeDirection, _setResizeDirection] = useState<string | null>(null);
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
        Object.values(item as Record<string, unknown>).some(val => String(val).toLowerCase().includes(term))
      );
    }
    if (sortConfig) {
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortConfig.key];
        const bVal = (b as Record<string, unknown>)[sortConfig.key];

        // Handle undefined/null cases
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bVal === undefined || bVal === null) return sortConfig.direction === 'asc' ? -1 : 1;

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
    copyCells: _copyCells,
    copySelection,
    pasteCells,
    handleCellClick,
    startSelection,
    updateSelection: _updateSelection,
    endSelection,
    pageSizeRef,
    moveFocus: _moveFocus
  } = useTableKeyboardNavigation({
    tableRef: tableRef as React.RefObject<HTMLDivElement>,
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
    e.stopPropagation();
    _setIsResizing(true);
    _setResizeDirection(direction);
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
      _setIsResizing(false);
      _setResizeDirection(null);
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
              <h3 className="text-xs font-bold text-[var(--app-text-secondary)] tracking-tight flex items-center gap-2">
                <span className={cn("w-1.5 h-4 rounded-full", currentTheme.accent)}></span>
                {title}
              </h3>
              {subtitle && <p className="text-[10px] text-[var(--app-text-secondary)] pr-3.5 font-medium">{subtitle}</p>}
            </div>
          )}
          <div className="flex items-center gap-1 bg-[var(--app-bg)] p-1 rounded-lg">
            {enableResize && (
              <>
                <button
                  onClick={handleResetSize}
                  className="p-1.5 text-[var(--app-text-secondary)] hover:text-blue-500 transition-colors rounded hover:bg-[var(--app-surface)] shadow-sm"
                  title="إعادة الحجم الأصلي"
                >
                  <RotateCcw size={14} />
                </button>
                <div className="w-px h-4 bg-[var(--app-border)] mx-0.5" />
              </>
            )}
            <button onClick={() => setIsZoomed(!isZoomed)} className="p-1.5 text-[var(--app-text-secondary)] hover:text-blue-500 transition-colors rounded hover:bg-[var(--app-surface)] shadow-sm">
              {isZoomed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.1))} className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 rounded hover:bg-[var(--app-surface)] shadow-sm"><Minus size={12} /></button>
            <span className="text-[10px] w-8 text-center font-mono font-medium text-[var(--app-text-secondary)]">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 rounded hover:bg-[var(--app-surface)] shadow-sm"><Plus size={12} /></button>
          </div>
          {/* Keyboard shortcuts toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showShortcuts ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-[var(--app-text-secondary)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
            title="اختصارات لوحة المفاتيح"
          >
            <Keyboard size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
          {showSearch && (
            <div className="relative flex-1 sm:max-w-xs group">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-[var(--app-text-secondary)] group-hover:text-blue-500 transition-colors", isRTL ? "left-3 right-auto" : "right-3")} size={14} />
              <input
                type="text"
                placeholder="بحث سريع في النتائج..."
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                className={cn(
                  "w-full py-2 bg-[var(--app-surface)] border-2 border-[var(--app-border)] rounded-lg text-[11px] font-medium text-[var(--app-text)] outline-none focus:border-blue-500/50 transition-all shadow-sm focus:shadow-md",
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
        <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={14} className="text-blue-600" />
            <span className="text-[10px] font-bold text-[var(--app-text-secondary)]">اختصارات لوحة المفاتيح</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TABLE_SHORTCUTS.map((shortcut, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px]">
                <kbd className="px-1.5 py-0.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded text-[9px] font-mono font-medium text-[var(--app-text)] flex items-center gap-0.5 min-w-[45px] justify-center">
                  {shortcut.modifier && <span className="text-[7px]">{shortcut.modifier === 'ctrl' ? 'Ctrl' : shortcut.modifier === 'shift' ? '⇧' : 'Alt'}</span>}
                  {getShortcutIcon(shortcut.key) || shortcut.key}
                </kbd>
                <span className="text-[var(--app-text-secondary)]">{isRTL ? shortcut.descriptionAr : shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Wrapper with Resize Handles */}
      <div
        ref={tableWrapperRef}
        className="border border-[var(--app-border)] shadow-sm bg-[var(--app-surface)] overflow-hidden rounded-xl relative"
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
          <div className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing text-[var(--app-text-secondary)] hover:text-blue-500">
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
            <ExcelTableHeader
              columns={columns}
              enableSelection={enableSelection}
              orderedDataLength={orderedData.length}
              selectedRowIdsSize={selectedRowIds.size}
              toggleAllSelection={toggleAllSelection}
              columnWidths={columnWidths}
              handleSort={handleSort}
              sortConfig={sortConfig}
              isRTL={isRTL}
              handleMouseDown={handleMouseDown}
              isLoading={isLoading}
            />
            <ExcelTableBody
              isLoading={isLoading}
              orderedData={orderedData}
              columns={columns}
              enableSelection={enableSelection}
              emptyMessage={emptyMessage}
              selectedRowIds={selectedRowIds}
              selection={selection}
              getRowId={getRowId}
              handleDragStart={handleDragStart as any}
              handleDragEnter={handleDragEnter as any}
              handleDragEnd={handleDragEnd as any}
              handleDrop={handleDrop as any}
              onRowClick={onRowClick}
              onOrderChange={onOrderChange}
              currentTheme={currentTheme}
              toggleRowSelection={toggleRowSelection}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              focusedCell={focusedCell}
              editingCell={editingCell}
              handleCellClick={handleCellClick}
              handleMouseDownCell={handleMouseDownCell}
              handleMouseEnterCell={handleMouseEnterCell}
              onRowDoubleClick={onRowDoubleClick}
              startEditing={startEditing}
              editValue={editValue}
              setEditValue={setEditValue}
              saveEdit={saveEdit}
              handleEditInputKeyDown={handleEditInputKeyDown}
              isRTL={isRTL}
              scrollRef={tableRef as React.RefObject<HTMLDivElement>}
            />
            {columns.some(c => c.footer) && (
              <tfoot className="border-t-2 border-[var(--app-border)] bg-[var(--app-bg)]">
                <tr>
                  <td className="p-2 border-r border-[var(--app-border)]"></td>
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("p-2 text-[11px] font-bold border-r border-[var(--app-border)]", col.className)}>
                      {col.footer ? col.footer(orderedData) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Status Bar */}
        <div className="p-2 border-t border-[var(--app-border)] bg-[var(--app-bg)] flex flex-col sm:flex-row justify-between items-center gap-2 select-none">
          <div className="flex items-center gap-3 text-[10px] text-[var(--app-text-secondary)]">
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
              className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 hover:bg-[var(--app-surface-hover)] rounded transition-colors"
              title="نسخ (Ctrl+C)"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={pasteCells}
              className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 hover:bg-[var(--app-surface-hover)] rounded transition-colors"
              title="لصق (Ctrl+V)"
            >
              <Clipboard size={12} />
            </button>
          </div>
        </div>

        {/* Pagination Footer */}
        <ExcelTablePagination
          enablePagination={enablePagination}
          totalPages={totalPages}
          processedDataLength={processedData.length}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isRTL={isRTL}
          currentTheme={currentTheme}
        />
      </div>
    </div >
  );
}

export default ExcelTable;
