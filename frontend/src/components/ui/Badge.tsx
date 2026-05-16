import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:         'bg-violet-100/80  border-violet-200/60  text-violet-700',
        waiting:         'bg-amber-50/90    border-amber-200/60   text-amber-700',
        accepted:        'bg-emerald-50/90  border-emerald-200/60 text-emerald-700',
        declined:        'bg-red-50/90      border-red-200/60     text-red-600',
        arrived:         'bg-sky-50/90      border-sky-200/60     text-sky-700',
        draft:           'bg-gray-100/80    border-gray-200/60    text-gray-500',
        active:          'bg-emerald-50/90  border-emerald-200/60 text-emerald-700',
        completed:       'bg-sky-50/90      border-sky-200/60     text-sky-700',
        payment_pending: 'bg-orange-50/90   border-orange-200/60  text-orange-600',
        deactivated:     'bg-gray-100/80    border-gray-200/60    text-gray-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
