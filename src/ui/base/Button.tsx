
import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../core/utils';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  // Micro-Boten: Zero radius, Heavy fonts, Sharp edges
  const baseStyles = "inline-flex items-center justify-center rounded-none font-black uppercase tracking-tighter transition-all active:scale-[0.97] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed border-2";
  
  const variants = {
    primary: "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-sharp shadow-blue-800/50 active:translate-y-px active:translate-x-px",
    secondary: "bg-slate-900 text-white border-slate-950 hover:bg-black shadow-sharp shadow-black/50 active:translate-y-px active:translate-x-px",
    success: "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sharp shadow-emerald-800/50 active:translate-y-px active:translate-x-px",
    amber: "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-sharp shadow-amber-700/50 active:translate-y-px active:translate-x-px",
    outline: "bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-800 hover:bg-gray-50",
    danger: "bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-sharp shadow-rose-800/50 active:translate-y-px active:translate-x-px",
    ghost: "bg-transparent border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-2 py-1 text-[9px] gap-1",
    md: "px-4 py-2 text-[10px] gap-2",
    lg: "px-6 py-3 text-xs gap-3",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="text-current opacity-70" />
      ) : (
        <>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          <span className="truncate tracking-widest">{children}</span>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;