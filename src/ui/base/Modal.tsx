import React, { useState, useRef } from 'react';
import { X, LucideIcon, Maximize2, Minimize2, Expand, Shrink } from 'lucide-react';
import { cn } from '../../core/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | 'resizable';
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
  const [isResizable, setIsResizable] = useState(size === 'resizable');
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'>('lg');
  const modalRef = useRef<HTMLDivElement>(null);

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

  const sizeOrder: Array<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'> = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full'];

  const handleIncreaseSize = () => {
    const currentIndex = sizeOrder.indexOf(modalSize);
    if (currentIndex < sizeOrder.length - 1) {
      setModalSize(sizeOrder[currentIndex + 1]);
    }
  };

  const handleDecreaseSize = () => {
    const currentIndex = sizeOrder.indexOf(modalSize);
    if (currentIndex > 0) {
      setModalSize(sizeOrder[currentIndex - 1]);
    }
  };

  const toggleFullscreen = () => {
    setModalSize(prev => prev === 'full' ? 'lg' : 'full');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4 transition-all duration-300 animate-in fade-in"
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        className={cn(
          "bg-white dark:bg-slate-900 w-full shadow-2xl overflow-hidden flex flex-col animate-in duration-300 border-t-2 border-blue-600 md:border-t-0 transition-all",
          isResizable || size === 'resizable' ? sizeClasses[modalSize] : sizeClasses[size as keyof typeof sizeClasses],
          // Mobile: Bottom sheet style (keeps current design as requested)
          "max-h-[95vh] rounded-t-2xl slide-in-from-bottom",
          // Desktop: Centered dialog style
          "md:rounded-2xl md:max-h-[90vh] md:zoom-in-95",
          // Fullscreen mode
          modalSize === 'full' && 'md:max-w-[98vw] md:max-h-[98vh] md:rounded-2xl',
          // Resizable cursor
          (isResizable || size === 'resizable') && 'cursor-default'
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
          <div className="flex items-center gap-1">
            {/* Resize Controls */}
            {(isResizable || size === 'resizable') && (
              <>
                <button
                  type="button"
                  onClick={handleDecreaseSize}
                  disabled={modalSize === 'sm'}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-90 transition-all rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تصغير"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleIncreaseSize}
                  disabled={modalSize === 'full'}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-90 transition-all rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تكبير"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-90 transition-all rounded-lg"
                  title={modalSize === 'full' ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
                >
                  {modalSize === 'full' ? <Shrink size={16} /> : <Expand size={16} />}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 active:scale-90 transition-all rounded-full"
            >
              <X size={20} />
            </button>
          </div>
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