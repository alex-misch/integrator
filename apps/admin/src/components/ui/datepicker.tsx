'use client';

import * as React from 'react';
import {ChevronDownIcon} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Calendar, CalendarProps} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import dayjs, {Dayjs} from 'dayjs';

type Props = CalendarProps & {
  value: Dayjs | undefined;
  onChange: (date: Dayjs | undefined) => void;
};

export function Datepicker({value, onChange, ...props}: Props) {
  const [open, setOpen] = React.useState(false);

  const id = React.useId();

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="w-48 justify-between font-normal"
          >
            {value ? value.local().format('DD.MM.YYYY') : 'Выберите дату'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            defaultMonth={value?.toDate()}
            mode="single"
            selected={value?.toDate()}
            captionLayout="label"
            onSelect={date => {
              onChange(dayjs(date));
              setOpen(false);
            }}
            {...props}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
