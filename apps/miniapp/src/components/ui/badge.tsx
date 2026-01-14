import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium uppercase',
  {
    variants: {
      variant: {
        success: 'bg-green-600 text-white',
        danger: 'bg-red-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({className, variant, ...props}: BadgeProps) {
  return <div className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};
