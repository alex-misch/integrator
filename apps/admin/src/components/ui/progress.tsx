import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import {cn} from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2.5 w-full overflow-hidden rounded-full relative',
        'bg-slate-100 [&_[data-slot=progress-indicator]]:bg-green-500',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{transform: `translateX(-${100 - (value || 0)}%)`}}
      />
      <span className="absolute right-1 top-0 text-black text-[8px] text-shadow-xl">
        {value?.toFixed()}%
      </span>
    </ProgressPrimitive.Root>
  );
}

export {Progress};
