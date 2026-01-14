import {PropsWithChildren} from 'react';
import {cn} from '@/lib/utils';

type FixedActionBarProps = PropsWithChildren<{
  variant?: 'pill' | 'plain';
  className?: string;
  containerClassName?: string;
}>;

export function FixedActionBar({
  variant = 'plain',
  className,
  containerClassName,
  children,
}: FixedActionBarProps) {
  return (
    <div
      className={cn(
        'fixed w-full bottom-10 left-0 right-0 m-auto px-4 max-w-[500px] z-10',
        containerClassName,
      )}
    >
      <div
        className={cn(
          variant === 'pill'
            ? 'p-1 bg-white rounded-full shadow-[0_0_16px_0_rgba(0,0,0,0.16)]'
            : '',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
