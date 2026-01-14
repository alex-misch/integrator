import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';
import {ChevronDown} from 'lucide-react';
import {useMiniappsPublicControllerRecords} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';

const monthNames = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const getMonthOptions = (start: Date, count = 12) => {
  const options: {year: number; month: number}[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    options.push({year: date.getFullYear(), month: date.getMonth()});
  }
  return options;
};

const getDaysForMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({length: daysInMonth}, (_, index) => {
    return new Date(year, month, index + 1);
  });
};

export function AtlazerDateTimePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const serviceId = bookingParams.service;
  const specialistId =
    bookingParams.specialist && bookingParams.specialist !== 'any'
      ? bookingParams.specialist
      : undefined;

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const monthOptions = useMemo(() => getMonthOptions(today), [today]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const datesScrollRef = useRef<HTMLDivElement | null>(null);
  const selectedDateRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const days = getDaysForMonth(selectedMonth.year, selectedMonth.month);
    const todayInMonth = days.find(day => day.getTime() === today.getTime());
    setSelectedDate(todayInMonth ?? days[0] ?? null);
  }, [selectedMonth, today]);

  const days = useMemo(() => {
    return getDaysForMonth(selectedMonth.year, selectedMonth.month).filter(
      day => day.getTime() >= today.getTime(),
    );
  }, [selectedMonth, today]);

  useEffect(() => {
    if (!selectedDateRef.current || !datesScrollRef.current) {
      return;
    }

    selectedDateRef.current.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedDate, selectedMonth]);

  const formatDateValue = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const selectedDateValue = selectedDate ? formatDateValue(selectedDate) : null;

  const {data: slots = []} = useMiniappsPublicControllerRecords(
    slug,
    companyId,
    {
      date: selectedDateValue ?? undefined,
      serviceId: serviceId || undefined,
      specialistId: specialistId || undefined,
    },
    {
      query: {enabled: !!(slug && companyId && selectedDateValue && serviceId)},
    },
  );

  useEffect(() => {
    if (selectedTime && !slots.some(slot => slot.time === selectedTime)) {
      setSelectedTime(null);
    }
  }, [slots, selectedTime]);

  const timeGroups = useMemo(() => {
    const groups = [
      {title: 'Утро', times: [] as string[]},
      {title: 'День', times: [] as string[]},
      {title: 'Вечер', times: [] as string[]},
      {title: 'Ночь', times: [] as string[]},
    ];

    slots.forEach(slot => {
      const [hour] = slot.time.split(':').map(Number);
      if (Number.isNaN(hour)) return;
      const group =
        hour >= 5 && hour <= 11
          ? groups[0]
          : hour >= 12 && hour <= 17
            ? groups[1]
            : hour >= 18 && hour <= 22
              ? groups[2]
              : groups[3];
      group.times.push(slot.time);
    });

    groups.forEach(group => {
      group.times.sort();
    });

    return groups.filter(group => group.times.length > 0);
  }, [slots]);

  return (
    <Page back>
      <Page.Content>
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setMonthPickerOpen(open => !open)}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <span>Дата</span>
            <span className="text-blue-500 inline-flex items-center justify-center gap-1">
              {monthNames[selectedMonth.month]}
              <ChevronDown className="pt-1" />
            </span>
          </button>
          {monthPickerOpen && (
            <div className="mt-3 w-fit rounded-ui-l border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              {monthOptions.map(option => {
                const isSelected =
                  option.month === selectedMonth.month &&
                  option.year === selectedMonth.year;
                return (
                  <button
                    key={`${option.year}-${option.month}`}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(option);
                      setMonthPickerOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      isSelected ? 'text-blue-500' : 'text-black'
                    }`}
                  >
                    {monthNames[option.month]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          ref={datesScrollRef}
          className="pt-4 overflow-x-auto hide-scrollbar"
        >
          <div className="flex w-max gap-1 pr-4">
            {days.map(day => {
              const isSelected =
                selectedDate &&
                day.getFullYear() === selectedDate.getFullYear() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getDate() === selectedDate.getDate();
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  ref={isSelected ? selectedDateRef : null}
                  onClick={() => setSelectedDate(day)}
                  className={`pt-3 pb-2 w-12 rounded-ui-m border ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-zinc-100 text-black'
                  }`}
                >
                  <div className="text-base/[12px] font-medium">
                    {day.getDate()}
                  </div>
                  <div
                    className={`text-sm ${
                      isSelected ? 'text-white' : 'text-black/40'
                    }`}
                  >
                    {dayNames[day.getDay()]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="mt-3 flex flex-col gap-6">
            {slots.length ? (
              timeGroups.map(group => (
                <div key={group.title} className="flex flex-col gap-2">
                  <p className="font-medium text-black">{group.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.times.map(time => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 py-2 rounded-full border text-[14px] bg-zinc-100 text-black ${
                            isSelected ? 'border-black' : ''
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-black/40">
                Нет доступных окошек на выбранную дату
              </div>
            )}
          </div>
        </div>

        <FixedActionBar>
          <Button
            type="button"
            variant="primary"
            disabled={!selectedDate || !selectedTime}
            className="w-full py-4"
            size="lg"
            onClick={() => {
              if (!selectedDate || !selectedTime) {
                return;
              }
              const params = {
                ...bookingParams,
                date: formatDateValue(selectedDate),
                time: selectedTime,
              };
              navigate(
                buildBookingUrl(getNextBookingRoute(params, basePath), params),
              );
            }}
          >
            Продолжить
          </Button>
        </FixedActionBar>
      </Page.Content>
    </Page>
  );
}
