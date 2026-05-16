import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 tracking-tight">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white/70 backdrop-blur-sm px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400',
            'border-white/70 shadow-[0_1px_3px_rgba(0,0,0,.05),0_0_0_1px_rgba(255,255,255,.8)_inset]',
            'transition-all duration-200',
            'focus:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/85 focus:shadow-[0_1px_6px_rgba(124,58,237,.12),0_0_0_1px_rgba(255,255,255,.9)_inset]',
            'disabled:cursor-not-allowed disabled:bg-gray-50/50 disabled:text-gray-400',
            error && 'border-red-300/70 focus:border-red-400/60 focus:ring-red-400/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
