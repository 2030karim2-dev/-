import React, { useEffect, useRef, useState } from 'react';
import interact from 'interactjs';

type DraggableTableProps<T> = {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  onOrderChange?: (newData: T[]) => void;
  /** Optional className for the table element */
  className?: string;
};

/**
 * Generic draggable table component using interactjs.
 * It renders a <table> and makes its <tbody> rows sortable via mouse drag.
 * When rows are reordered, `onOrderChange` is called with the new ordering.
 */
export default function DraggableTable<T>({ data, renderRow, onOrderChange, className }: DraggableTableProps<T>) {
  const [order, setOrder] = useState<T[]>(data);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Keep internal order in sync when external data changes
  useEffect(() => {
    setOrder(data);
  }, [data]);

  useEffect(() => {
    const tbody = tbodyRef.current;
    if (!tbody) return;

    // Initialize interactjs on each row
    interact(tbody)
      .draggable({
        listeners: {
          start(event: any) {
            const target = event.target as HTMLElement;
            target.style.opacity = '0.5';
          },
          move(event: any) {
            const target = event.target as HTMLElement;
            const x = (parseFloat(target.getAttribute('data-x')!) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')!) || 0) + event.dy;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          },
          end(event: any) {
            const target = event.target as HTMLElement;
            target.style.opacity = '';
            target.style.transform = '';
            target.removeAttribute('data-x');
            target.removeAttribute('data-y');
          },
        },
        // Only allow vertical dragging
        axis: 'y',
      } as any)
      .dropzone({
        // Accept draggables from the same table
        accept: '.draggable-row',
        overlap: 'pointer',
        ondrop(event) {
          const dragged = event.relatedTarget as HTMLTableRowElement;
          const droppedOn = event.target as HTMLTableRowElement;

          // Find indexes of dragged and dropped rows
          const rows = Array.from(tbody.querySelectorAll('tr'));
          const fromIdx = rows.indexOf(dragged);
          const toIdx = rows.indexOf(droppedOn);
          if (fromIdx === -1 || toIdx === -1) return;

          const newOrder = [...order];
          const [moved] = newOrder.splice(fromIdx, 1);
          newOrder.splice(toIdx, 0, moved);
          setOrder(newOrder);
          onOrderChange?.(newOrder);
        },
      });

    return () => {
      interact(tbody).unset();
    };
  }, [order, onOrderChange]);

  return (
    <table className={className}>
      <tbody ref={tbodyRef}>
        {order.map((item, idx) => (
          <tr key={idx} className="draggable-row" style={{ cursor: 'move' }}>
            {renderRow(item, idx)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
