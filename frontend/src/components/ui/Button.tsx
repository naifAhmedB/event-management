import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.97] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-violet-500 to-purple-700 text-white shadow-[0_1px_3px_rgba(124,58,237,.35),0_0_0_1px_rgba(255,255,255,.15)_inset,0_1px_0_rgba(255,255,255,.10)_inset] hover:from-violet-600 hover:to-purple-800 hover:shadow-[0_4px_12px_rgba(124,58,237,.40),0_0_0_1px_rgba(255,255,255,.15)_inset] hover:-translate-y-px',
        destructive:
          'bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-[0_1px_3px_rgba(239,68,68,.30),0_0_0_1px_rgba(255,255,255,.12)_inset] hover:from-red-600 hover:to-rose-700 hover:shadow-[0_4px_12px_rgba(239,68,68,.30)] hover:-translate-y-px',
        outline:
          'border border-white/70 bg-white/60 text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,.06),0_0_0_1px_rgba(255,255,255,.8)_inset] backdrop-blur-sm hover:bg-white/80 hover:border-white/90 hover:shadow-[0_2px_8px_rgba(0,0,0,.08)] hover:-translate-y-px',
        secondary:
          'bg-violet-50/80 text-violet-700 border border-violet-200/60 shadow-[0_1px_2px_rgba(124,58,237,.08)] backdrop-blur-sm hover:bg-violet-100/80 hover:border-violet-300/60 hover:-translate-y-px',
        ghost:
          'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:shadow-[0_1px_3px_rgba(0,0,0,.06)] backdrop-blur-sm rounded-xl',
        link:
          'text-purple-600 underline-offset-4 hover:underline hover:text-purple-700 p-0 h-auto shadow-none',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs rounded-lg',
        lg:      'h-11 px-6 text-[15px]',
        icon:    'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
