import React, { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../core/utils';
import { useTableKeyboardNavigation } from './useTableKeyboardNavigation';
import { useTableDragDrop } from './hooks/useTableDragDrop';
import { useTableResize } from './ExcelTable/hooks/useTableResize';
import { useTableSelection } from './ExcelTable/hooks/useTableSelection';
import { useTableDrag } from './hooks/useTableDrag';
import { useTablePagination } from './hooks/useTablePagination';
import { ExcelTableHeader } from './ExcelTableHeader';
import { ExcelTableBody } from './ExcelTableBody';
import { ExcelTablePagination } from './ExcelTablePagination';
import FullscreenContainer from '../base/FullscreenContainer';
import ExcelTableToolbar from './ExcelTableToolbar';
import ExcelTableStatusBar from './ExcelTableStatusBar';

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
  columns: Array<Column<T>>;
  data: T[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  colorTheme?: 'blue' | 'green' | 'orange' | 'indigo';
  onExport?: (() => void) | undefined;
  showSearch?: boolean;
  /** External search value for a "main" search box (bypasses internal client-side filtering). */
  searchValue?: string;
  /** Callback when the toolbar search input changes. If provided, internal search is disabled. */
  onSearchChange?: ((value: string) => void) | undefined;
  onRowClick?: ((row: T) => void) | undefined;
  onRowDoubleClick?: ((row: T) => void) | undefined;
  onOrderChange?: ((reorderedData: T[]) => void) | undefined;
  onCellUpdate?: ((rowIndex: number, accessorKey: string, value: unknown) => void | Promise<void>) | undefined;
  enablePagination?: boolean;
  pageSize?: number;
  enableSelection?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: ((selectedIds: Set<string>) => void) | undefined;
  getRowId?: ((row: T) => string) | undefined;
  isRTL?: boolean;
  showShortcutsPanel?: boolean;
  enableResize?: boolean;
  enableDrag?: boolean;
  isLoading?: boolean;
  zoomLevel?: number;
  setZoomLevel?: React.Dispatch<React.SetStateAction<number>>;
}

function ExcelTable<T>({
  columns, data, title, emptyMessage, colorTheme = 'blue',
  onExport, showSearch = true, searchValue, onSearchChange, onRowClick, onRowDoubleClick, onOrderChange,
  onCellUpdate, enablePagination = true, pageSize = 20,
  enableSelection = false, selectedRowIds = new Set(), onSelectionChange, getRowId,
  isRTL = false, showShortcutsPanel = false, enableResize = true, enableDrag = false,
  isLoading = false, zoomLevel: propZoomLevel, setZoomLevel: propSetZoomLevel
}: ExcelTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalSearch, setInternalSearch] = useState('');
  const isMainSearch = !!onSearchChange;
  const effectiveSearch = isMainSearch ? (searchValue ?? '') : internalSearch;
  const deferredSearch = useDeferredValue(effectiveSearch);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(showShortcutsPanel);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // ── Table Resize & Drag ─────────────────────────────────────
  const {
    columnWidths,
    customSize,
    zoomLevel,
    setZoomLevel,
    handleMouseDown: handleColumnResizeStart,
    handleWrapperResizeStart,
    handleResetSize: handleResetTableSize
  } = useTableResize({ 
    enableResize, 
    tableWrapperRef: tableWrapperRef as React.RefObject<HTMLDivElement>,
    zoomLevel: propZoomLevel,
    setZoomLevel: propSetZoomLevel
  });

  const {
    isDragging,
    position,
    handleTableDragStart
  } = useTableDrag({ enableDrag, isZoomed, tableWrapperRef: tableWrapperRef as React.RefObject<HTMLDivElement> });

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
    if (!isMainSearch && deferredSearch) {
      const term = deferredSearch.toLowerCase().trim();
      if (!term) return items;

      items = items.filter(item => {
        // 1. Search via accessorKey (O(1) per column, no React element traversal)
        const accessorMatches = columns.some(col => {
          if (!col.accessorKey) return false;
          try {
            const val = (item as Record<string, unknown>)[col.accessorKey as string];
            if (val !== undefined && val !== null) {
              return String(val).toLowerCase().includes(term);
            }
          } catch (e) { /* ignore */ }
          return false;
        });
        if (accessorMatches) return true;

        // 2. Fallback: deep object search (without React element traversal)
        const deepSearch = (val: any): boolean => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            return String(val).toLowerCase().includes(term);
          }
          if (Array.isArray(val)) {
            return val.some(deepSearch);
          }
          if (typeof val === 'object') {
            // Explicitly skip React elements and Promises
            if (val.$$typeof || typeof val.then === 'function') return false;
            try {
              return Object.values(val).some(deepSearch);
            } catch (e) { return false; }
          }
          return false;
        };
        return deepSearch(item);
      });
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
  }, [data, sortConfig, effectiveSearch, columns, isMainSearch]);

  // Reset page when search/data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, data.length]);

  // ── Pagination & Selection (after processedData) ───────────
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedData: paginatedResult,
    setCurrentPage,
    setItemsPerPage
  } = useTablePagination({ enablePagination, pageSize, data: processedData });

  const { orderedData, handlers: { handleDragStart, handleDragEnter, handleDragEnd, handleDrop } } = useTableDragDrop(paginatedResult as T[], onOrderChange);

  const {
    toggleAllSelection: toggleAllSelectionHk,
    toggleRowSelection: toggleRowSelectionHk,
    handleMouseDownOnTable,
    handleMouseUpOnTable,
    handleMouseLeaveOnTable,
    handleMouseDownCell,
    handleMouseEnterCell
  } = useTableSelection({ orderedData, selectedRowIds, onSelectionChange, getRowId });

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



  return (
    <FullscreenContainer isMaximized={isZoomed} onToggleMaximize={() => { setIsZoomed(false); }}>
      <div className={cn(
        "w-full flex flex-col transition-all duration-300 relative",
        isZoomed ? "h-full bg-white dark:bg-slate-950 p-4" : "h-full"
      )}>
        <ExcelTableToolbar
          title={title}
          currentTheme={currentTheme}
          showSearch={showSearch}
          internalSearch={effectiveSearch}
          setInternalSearch={isMainSearch ? onSearchChange : setInternalSearch}
          isRTL={isRTL}
          onExport={onExport}
          enableResize={enableResize}
          handleResetSize={handleResetTableSize}
          isZoomed={isZoomed}
          setIsZoomed={setIsZoomed}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          showShortcuts={showShortcuts}
          setShowShortcuts={setShowShortcuts}
        />

        {/* Table Wrapper with Resize Handles */}
        <div
          ref={tableWrapperRef}
          className="flex-1 border border-[var(--app-border)] shadow-sm bg-[var(--app-surface)] overflow-hidden rounded-xl relative flex flex-col"
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
                onMouseDown={(e) => { handleWrapperResizeStart('n', e); }}
              />
              {/* Bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize hover:bg-blue-500/30 transition-colors z-10"
                onMouseDown={(e) => { handleWrapperResizeStart('s', e); }}
              />
              {/* Left */}
              <div
                className="absolute top-0 bottom-0 left-0 w-1.5 cursor-w-resize hover:bg-blue-500/30 transition-colors z-10"
                onMouseDown={(e) => { handleWrapperResizeStart('w', e); }}
              />
              {/* Right */}
              <div
                className="absolute top-0 bottom-0 right-0 w-1.5 cursor-e-resize hover:bg-blue-500/30 transition-colors z-10"
                onMouseDown={(e) => { handleWrapperResizeStart('e', e); }}
              />
              {/* Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => { handleWrapperResizeStart('nw', e); }} />
              <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => { handleWrapperResizeStart('ne', e); }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => { handleWrapperResizeStart('sw', e); }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30 transition-colors z-10" onMouseDown={(e) => { handleWrapperResizeStart('se', e); }} />
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
            className="flex-1 overflow-auto data-table-scroll custom-scrollbar smooth-scroll outline-none"
            onMouseDown={handleMouseDownOnTable}
            onMouseUp={() => { handleMouseUpOnTable(endSelection); }}
            onMouseLeave={() => { handleMouseLeaveOnTable(endSelection); }}
          >
            <table
              style={{ fontSize: `${zoomLevel * 11}px` }}
              className={cn(
                "w-full border-collapse table-auto min-w-[800px] border-l border-t border-[var(--app-border)]",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <ExcelTableHeader
                columns={columns}
                enableSelection={enableSelection}
                orderedDataLength={orderedData.length}
                selectedRowIdsSize={selectedRowIds.size}
                toggleAllSelection={toggleAllSelectionHk}
                columnWidths={columnWidths}
                handleSort={handleSort}
                sortConfig={sortConfig}
                isRTL={isRTL}
                handleMouseDown={handleColumnResizeStart}
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
                toggleRowSelection={toggleRowSelectionHk}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                focusedCell={focusedCell}
                editingCell={editingCell}
                handleCellClick={handleCellClick}
                handleMouseDownCell={(e: React.MouseEvent, row: number, col: number) => { handleMouseDownCell(e, row, col, handleCellClick, startSelection); }}
                handleMouseEnterCell={handleMouseEnterCell}
                onRowDoubleClick={onRowDoubleClick as any}
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

          <ExcelTableStatusBar
            focusedCell={focusedCell}
            selection={selection}
            totalRows={orderedData.length}
            totalCols={columns.length}
            copySelection={copySelection}
            pasteCells={pasteCells}
          />

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
      </div>
    </FullscreenContainer>
  );
}

export default ExcelTable;
