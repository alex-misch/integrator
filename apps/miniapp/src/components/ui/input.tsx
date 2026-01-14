import * as React from 'react';

import {cn} from '@/lib/utils';
import {Label} from './label';

const Input = (props: React.ComponentProps<'input'>) => {
  return (
    <input
      {...props}
      className={cn(
        'flex h-[60px] w-full border border-gray-6 rounded-ui-l bg-transparent pt-3 px-4 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-lg',
        props.className,
      )}
    />
  );
};
export {Input};

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const FloatingInput = (props: InputProps) => {
  return (
    <Input placeholder=" " {...props} className={cn('peer', props.className)} />
  );
};

const FloatingLabel = (props: React.ComponentProps<typeof Label>) => {
  return (
    <Label
      {...props}
      className={cn(
        'peer-focus:secondary peer-focus:dark:secondary absolute left-4 top-1 z-10 origin-[0] scale-75 transform bg-background text-gray-400 text-lg duration-150 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-5 peer-focus:-translate-y-4 peer-focus:scale-75  dark:bg-background rtl:peer-focus:left-5 rtl:peer-focus:translate-x-1/4 cursor-text',
        props.className,
      )}
    />
  );
};

type FloatingLabelInputProps = InputProps & {label?: string; error?: string};

const FloatingLabelInput = ({
  label = 'Введите номер телефона',
  error,
  ...props
}: FloatingLabelInputProps) => {
  const id = props.id || React.useId();
  return (
    <div>
      <div className="relative">
        <FloatingInput
          id={id}
          {...props}
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500',
            props.className,
          )}
        />
        <FloatingLabel htmlFor={id} className={cn(error && 'text-red-500')}>
          {label}
        </FloatingLabel>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export {FloatingInput, FloatingLabel, FloatingLabelInput};
