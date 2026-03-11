import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-700',
        violet: 'bg-violet-100 text-violet-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700',
        cyan: 'bg-cyan-100 text-cyan-700',
        teal: 'bg-teal-100 text-teal-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        purple: 'bg-purple-100 text-purple-700',
        rose: 'bg-rose-100 text-rose-700',
        sky: 'bg-sky-100 text-sky-700',
        slate: 'bg-slate-100 text-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
