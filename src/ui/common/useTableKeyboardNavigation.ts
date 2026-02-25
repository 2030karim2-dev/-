import { useState, useCallback, useEffect } from 'react';

interface UseTableKeyboardNavigationProps {
    tableRef: React.RefObject<HTMLDivElement>;
    orderedData: any[];
    columns: any[];
    onRowDoubleClick?: (row: any) => void;
    onCellUpdate?: (rowIndex: number, accessorKey: string, value: any) => void | Promise<void>;
}

export const useTableKeyboardNavigation = ({ tableRef, orderedData, columns, onRowDoubleClick, onCellUpdate }: UseTableKeyboardNavigationProps) => {
    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState<any>('');

    const moveFocus = useCallback((r: number, c: number) => {
        setFocusedCell({ row: r, col: c });
        const cell = tableRef.current?.querySelector(`[data-row-index='${r}'][data-col-index='${c}']`);
        cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [tableRef]);

    const startEditing = useCallback((rowIdx: number, colIdx: number) => {
        const col = columns[colIdx];
        if (col && col.isEditable && onCellUpdate && col.accessorKey) {
            const row = orderedData[rowIdx];
            setEditValue(row ? (row as any)[col.accessorKey] : '');
            setEditingCell({ row: rowIdx, col: colIdx });
        }
    }, [columns, onCellUpdate, orderedData]);

    const saveEdit = useCallback(async () => {
        if (editingCell && onCellUpdate) {
            const { row, col } = editingCell;
            const colDef = columns[col];
            if (colDef && colDef.accessorKey) {
                await onCellUpdate(row, colDef.accessorKey as string, editValue);
            }
        }
        setEditingCell(null);
    }, [editingCell, columns, onCellUpdate, editValue]);

    useEffect(() => {
        const tableEl = tableRef.current;
        if (!tableEl) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!focusedCell || editingCell) return;
            const { row, col } = focusedCell;

            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); moveFocus(Math.max(0, row - 1), col); break;
                case 'ArrowDown': e.preventDefault(); moveFocus(Math.min(orderedData.length - 1, row + 1), col); break;
                case 'ArrowLeft': e.preventDefault(); moveFocus(row, Math.max(0, col - 1)); break;
                case 'ArrowRight': e.preventDefault(); moveFocus(row, Math.min(columns.length - 1, col + 1)); break;
                case 'Enter':
                    e.preventDefault();
                    if (columns[col]?.isEditable) {
                        startEditing(row, col);
                    } else if (onRowDoubleClick) {
                        if (orderedData[row]) onRowDoubleClick(orderedData[row]);
                    } else {
                        moveFocus(Math.min(orderedData.length - 1, row + 1), col);
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    let nextRow = row, nextCol = col;
                    if (e.shiftKey) {
                        if (col > 0) nextCol--; else if (row > 0) { nextRow--; nextCol = columns.length - 1; }
                    } else {
                        if (col < columns.length - 1) nextCol++; else if (row < orderedData.length - 1) { nextRow++; nextCol = 0; }
                    }
                    moveFocus(nextRow, nextCol);
                    break;
            }
        };

        tableEl.addEventListener('keydown', handleKeyDown);
        return () => tableEl.removeEventListener('keydown', handleKeyDown);
    }, [focusedCell, orderedData, columns, onRowDoubleClick, editingCell, startEditing, moveFocus, tableRef]);

    return {
        focusedCell,
        setFocusedCell,
        editingCell,
        setEditingCell,
        editValue,
        setEditValue,
        moveFocus,
        startEditing,
        saveEdit
    };
};
