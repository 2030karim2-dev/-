import { useState, useCallback } from 'react';

export interface UseTableSelectionOptions<T> {
    orderedData: T[];
    selectedRowIds: Set<string>;
    onSelectionChange?: ((selectedIds: Set<string>) => void) | undefined;
    getRowId?: ((row: T) => string) | undefined;
}

export interface UseTableSelectionReturn {
    isMouseDown: boolean;
    toggleAllSelection: () => void;
    toggleRowSelection: (id: string, e: React.MouseEvent) => void;
    handleMouseDownOnTable: () => void;
    handleMouseUpOnTable: (endSelection: () => void) => void;
    handleMouseLeaveOnTable: (endSelection: () => void) => void;
    handleMouseDownCell: (
        e: React.MouseEvent,
        rowIdx: number,
        colIdx: number,
        handleCellClick: (row: number, col: number, isShift: boolean) => void,
        startSelection: (row: number, col: number) => void
    ) => void;
    handleMouseEnterCell: () => void;
}

export function useTableSelection<T>({
    orderedData,
    selectedRowIds,
    onSelectionChange,
    getRowId
}: UseTableSelectionOptions<T>): UseTableSelectionReturn {
    const [isMouseDown, setIsMouseDown] = useState(false);

    const toggleAllSelection = useCallback(() => {
        if (!onSelectionChange || !getRowId) return;

        if (selectedRowIds.size === orderedData.length && orderedData.length > 0) {
            // Deselect all
            onSelectionChange(new Set());
        } else {
            // Select all visible
            const newSet = new Set(selectedRowIds);
            orderedData.forEach(row => newSet.add(getRowId(row)));
            onSelectionChange(newSet);
        }
    }, [onSelectionChange, getRowId, selectedRowIds, orderedData]);

    const toggleRowSelection = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onSelectionChange) return;

        const newSet = new Set(selectedRowIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onSelectionChange(newSet);
    }, [onSelectionChange, selectedRowIds]);

    const handleMouseDownOnTable = useCallback(() => {
        setIsMouseDown(true);
    }, []);

    const handleMouseUpOnTable = useCallback((endSelection: () => void) => {
        setIsMouseDown(false);
        endSelection();
    }, []);

    const handleMouseLeaveOnTable = useCallback((endSelection: () => void) => {
        setIsMouseDown(false);
        endSelection();
    }, []);

    const handleMouseDownCell = useCallback(
        (
            e: React.MouseEvent,
            rowIdx: number,
            colIdx: number,
            handleCellClick: (row: number, col: number, isShift: boolean) => void,
            startSelection: (row: number, col: number) => void
        ) => {
            if (e.shiftKey) {
                handleCellClick(rowIdx, colIdx, true);
            } else {
                startSelection(rowIdx, colIdx);
            }
        },
        []
    );

    const handleMouseEnterCell = useCallback(() => {
        // Selection is being made - handled by startSelection/updateSelection
        // in the keyboard navigation hook while isMouseDown is true
    }, []);

    return {
        isMouseDown,
        toggleAllSelection,
        toggleRowSelection,
        handleMouseDownOnTable,
        handleMouseUpOnTable,
        handleMouseLeaveOnTable,
        handleMouseDownCell,
        handleMouseEnterCell
    };
}