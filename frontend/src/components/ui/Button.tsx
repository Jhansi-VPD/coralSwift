import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'coral' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';
    
    const variants = {
      primary: 'bg-gradient-to-r from-coral-500 via-rose-600 to-indigo-600 text-white hover:opacity-95 shadow-md shadow-coral-500/20 hover:shadow-lg hover:shadow-coral-500/30 font-semibold',
      coral: 'bg-gradient-to-r from-coral-500 to-rose-600 text-white hover:from-coral-600 hover:to-rose-700 font-semibold shadow-md shadow-coral-500/20',
      secondary: 'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950 border border-slate-200/90 shadow-sm font-semibold',
      dark: 'bg-[#0B1426] text-white hover:bg-[#152342] shadow-md shadow-navy-950/10 font-semibold',
      outline: 'bg-transparent border border-coral-500/50 text-coral-600 hover:bg-coral-50 hover:border-coral-600 font-semibold',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
