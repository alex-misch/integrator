import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import {FloatingLabelInput} from '@/components/ui/input';

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: string) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({className, onChange, value, ...props}, ref) => {
      return (
        <RPNInput.default
          ref={ref}
          className={className}
          flagComponent={() => <></>}
          countrySelectComponent={() => <></>}
          inputComponent={FloatingLabelInput}
          smartCaret={false}
          countries={['RU']}
          value={value || undefined}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          onChange={value => onChange?.(value || ('' as RPNInput.Value))}
          {...props}
        />
      );
    },
  );
PhoneInput.displayName = 'PhoneInput';

export {PhoneInput};
