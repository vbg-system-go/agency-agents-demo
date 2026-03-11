'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-violet-600 text-white shadow-sm hover:bg-violet-700 active:bg-violet-800',
        secondary:
          'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 active:bg-zinc-300',
        ghost:
          'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200',
        danger:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        outline:
          'border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 active:bg-zinc-100',
        success:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
