'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import {
  LiquidButton as LiquidButtonPrimitive,
  type LiquidButtonProps as LiquidButtonPrimitiveProps,
} from '@/components/animate-ui/primitives/buttons/liquid';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden text-sm font-medium transition-[box-shadow,_color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-[#c7a96f]/50 [--liquid-button-color:#000] hover:text-white",
  {
    variants: {
      variant: {
        default: 'shadow-xs',
        destructive: 'text-white shadow-xs',
        secondary: 'shadow-xs',
        ghost: 'shadow-xs',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type LiquidButtonProps = LiquidButtonPrimitiveProps &
  VariantProps<typeof buttonVariants>;

function LiquidButton({
  className,
  variant,
  size,
  ...props
}: LiquidButtonProps) {
  return (
    <LiquidButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { LiquidButton, buttonVariants, type LiquidButtonProps };
