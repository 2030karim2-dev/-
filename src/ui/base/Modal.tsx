import React from 'react';
import { X, LucideIcon } from 'lucide-react';
import { cn } from '../../core/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  icon: Icon,
  title,
  description,
  children,
  footer,
  size = 'lg'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl',
    '3xl': 'md:max-w-3xl',
    '4xl': 'md:max-w-4xl',
    '5xl': 'md:max-w-5xl',
    full: 'md:max-w-[95vw]'
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4 transition-all duration-300 animate-in fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          "bg-white dark:bg-slate-900 w-full shadow-2xl overflow-hidden flex flex-col animate-in duration-300 border-t-2 border-blue-600 md:border-t-0 transition-all",
          sizeClasses[size],
          // Mobile: Bottom sheet style (keeps current design as requested)
          "max-h-[95vh] rounded-t-2xl slide-in-from-bottom",
          // Desktop: Centered dialog style
          "md:rounded-2xl md:max-h-[90vh] md:zoom-in-95"
        )}
      >
        {/* Micro-Header Segment */}
        <div className="flex justify-between items-center p-3 md:p-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-blue-600 text-white shadow-sm rounded-md md:rounded-lg">
              <Icon size={16} className="md:hidden" />
              <Icon size={20} className="hidden md:block" />
            </div>
            <div>
              <h2 className="text-[11px] md:text-sm font-black text-gray-800 dark:text-slate-100 leading-none">{title}</h2>
              <p className="text-[8px] md:text-xs font-black text-gray-400 uppercase tracking-tighter mt-1 opacity-70">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 active:scale-90 transition-all rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Segment */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-gray-50/30 dark:bg-slate-950/30">
          {children}
        </div>

        {/* Micro-Footer Segment */}
        <div className="p-2 md:p-4 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex gap-1 md:gap-2 shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default Modal;