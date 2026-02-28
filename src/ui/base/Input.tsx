import React, { InputHTMLAttributes, forwardRef, useCallback } from 'react';
import { cn } from '../../core/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  variant?: 'default' | 'micro';
  inputRef?: React.RefObject<HTMLInputElement>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, onIconClick, variant = 'default', inputRef, ...props }, ref) => {
    const isMicro = variant === 'micro';
    const internalRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = (inputRef || internalRef) as React.RefObject<HTMLInputElement>;

    // Handle keyboard navigation between inputs
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Find next input in the parent form
        const form = combinedRef.current?.closest('form');
        if (form) {
          const inputs = form.querySelectorAll<HTMLInputElement>(
            'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
          );
          const currentIndex = Array.from(inputs).findIndex(input => input === combinedRef.current);

          if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            e.preventDefault();
            const nextInput = inputs[currentIndex + 1];
            // If next is a button, click it, otherwise focus it
            if (nextInput.tagName === 'BUTTON') {
              (nextInput as HTMLButtonElement).click();
            } else {
              nextInput.focus();
              // Select all text if it's an input or textarea
              if (nextInput.tagName === 'INPUT' || nextInput.tagName === 'TEXTAREA') {
                (nextInput as HTMLInputElement).select();
              }
            }
          }
        }
      }
    }, [combinedRef]);

    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "block font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1",
            isMicro ? "text-[8px]" : "text-[10px] mb-1.5"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={combinedRef}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl",
              "font-bold text-gray-800 dark:text-slate-100 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
              "transition-all duration-200",
              isMicro ? "px-3 py-2 text-[10px] rounded-lg" : "px-4 py-3 text-sm rounded-xl",
              icon ? (isMicro ? "pr-8" : "pr-10") : "px-3",
              error ? "border-rose-500 ring-rose-500/30 focus:ring-rose-500/30 focus:border-rose-500" : "",
              // Focus indicator
              "focus:shadow-md",
              className
            )}
            {...props}
          />
          {icon && (
            <div
              onClick={onIconClick}
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors",
                onIconClick ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" : "pointer-events-none"
              )}
            >
              {React.cloneElement(icon as React.ReactElement, { size: isMicro ? 14 : 18 })}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[9px] text-rose-600 mt-1 font-bold px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
