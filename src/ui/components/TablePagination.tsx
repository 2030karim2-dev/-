import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/core/utils';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({ currentPage, totalPages, onPageChange }: TablePaginationProps) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className={cn(
          "p-1 rounded-md hover:bg-[var(--app-surface-hover)] disabled:opacity-50",
        )}
        aria-label="الصفحة السابقة"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm">
        الصفحة {currentPage} من {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={cn(
          "p-1 rounded-md hover:bg-[var(--app-surface-hover)] disabled:opacity-50",
        )}
        aria-label="الصفحة التالية"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
