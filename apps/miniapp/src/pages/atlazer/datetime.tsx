import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';
import {ChevronDown} from 'lucide-react';
import {
  useMiniappsPublicControllerBookDates,
  useMiniappsPublicControllerRecords,
  useMiniappsPublicControllerUpdateBooking,
} from '@integrator/api-client/public';
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

const formatDateValue = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isSameMonthValue = (
  value: string,
  option: {year: number; month: number},
) => {
  const date = parseDateValue(value);
  return date.getFullYear() === option.year && date.getMonth() === option.month;
};

const normalizeBookDateValue = (value: number | string) => {
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }

  const date = new Date(value > 1_000_000_000_000 ? value : value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateValue(date);
};

export function AtlazerDateTimePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const bookingId = bookingParams.id;
  const updateBooking = useMiniappsPublicControllerUpdateBooking();

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const monthOptions = useMemo(() => getMonthOptions(today), [today]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [didApplyDefaultDate, setDidApplyDefaultDate] = useState(false);
  const datesScrollRef = useRef<HTMLDivElement | null>(null);
  const selectedDateRef = useRef<HTMLButtonElement | null>(null);

  const dateFrom = useMemo(() => formatDateValue(today), [today]);
  const dateTo = useMemo(() => {
    const lastOption = monthOptions[monthOptions.length - 1];
    return formatDateValue(new Date(lastOption.year, lastOption.month + 1, 0));
  }, [monthOptions]);

  const days = useMemo(() => {
    return getDaysForMonth(selectedMonth.year, selectedMonth.month);
  }, [selectedMonth]);

  const {data: bookDates, isLoading: isLoadingDates} =
    useMiniappsPublicControllerBookDates(
      slug,
      companyId,
      {dateFrom, dateTo},
      {query: {enabled: !!(slug && companyId)}},
    );

  const availableDateValues = useMemo(() => {
    const byMonths = Object.values(bookDates?.booking_days ?? {}).flat();
    const byDates = (bookDates?.booking_dates ?? [])
      .map(normalizeBookDateValue)
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set([...byMonths, ...byDates]))
      .filter(value => value >= dateFrom)
      .sort();
  }, [bookDates, dateFrom]);

  const availableDateSet = useMemo(
    () => new Set(availableDateValues),
    [availableDateValues],
  );

  useEffect(() => {
    if (didApplyDefaultDate || isLoadingDates) {
      return;
    }

    const closestDate = availableDateValues[0];
    if (!closestDate) {
      setSelectedDate(null);
      setDidApplyDefaultDate(true);
      return;
    }

    const date = parseDateValue(closestDate);
    setSelectedDate(date);
    setSelectedMonth({year: date.getFullYear(), month: date.getMonth()});
    setDidApplyDefaultDate(true);
  }, [availableDateValues, didApplyDefaultDate, isLoadingDates]);

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

  const selectedDateValue = selectedDate ? formatDateValue(selectedDate) : null;

  const {data: slots = [], isLoading} = useMiniappsPublicControllerRecords(
    slug,
    companyId,
    {
      date: selectedDateValue ?? undefined,
    },
    {
      query: {enabled: !!(slug && companyId && selectedDateValue)},
    },
  );

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDateValue]);

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
                      const firstAvailableDateInMonth =
                        availableDateValues.find(value =>
                          isSameMonthValue(value, option),
                        );
                      setSelectedDate(
                        firstAvailableDateInMonth
                          ? parseDateValue(firstAvailableDateInMonth)
                          : null,
                      );
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
              const dateValue = formatDateValue(day);
              const isAvailable = availableDateSet.has(dateValue);
              const isSelected =
                isAvailable &&
                selectedDate &&
                day.getFullYear() === selectedDate.getFullYear() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getDate() === selectedDate.getDate();
              return (
                <button
                  key={dateValue}
                  type="button"
                  ref={isSelected ? selectedDateRef : null}
                  disabled={!isAvailable}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`pt-3 pb-2 w-12 rounded-ui-m border ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : isAvailable
                        ? 'border-zinc-100 text-black'
                        : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-black/25'
                  }`}
                >
                  <div className="text-base/[12px] font-medium">
                    {day.getDate()}
                  </div>
                  <div
                    className={`text-sm ${
                      isSelected
                        ? 'text-white'
                        : isAvailable
                          ? 'text-black/40'
                          : 'text-black/20'
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
            {isLoadingDates || isLoading ? (
              Array.from({length: 3}).map((_, index) => (
                <div
                  key={`time-group-skeleton-${index}`}
                  className="flex flex-col gap-2"
                >
                  <Skeleton className="h-4 w-24" />
                  <div className="flex flex-wrap gap-1">
                    {Array.from({length: 5}).map((__, timeIndex) => (
                      <Skeleton
                        key={`time-slot-skeleton-${index}-${timeIndex}`}
                        className="h-8 w-14 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : !availableDateValues.length ? (
              <div className="text-sm text-black/40">
                Нет доступных дат для записи
              </div>
            ) : !selectedDateValue ? (
              <div className="text-sm text-black/40">
                На выбранный месяц нет доступных окошек
              </div>
            ) : slots.length ? (
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
            disabled={
              !selectedDateValue || !selectedTime || updateBooking.isPending
            }
            className="w-full py-4"
            size="lg"
            onClick={async () => {
              if (!selectedDateValue || !selectedTime) {
                return;
              }

              if (bookingId) {
                await updateBooking.mutateAsync({
                  slug,
                  companyId,
                  bookingId,
                  data: {
                    date: selectedDateValue,
                    time: selectedTime,
                  },
                });
                navigate(`${basePath}/success?id=${bookingId}`);
                return;
              }

              const params = {
                ...bookingParams,
                date: selectedDateValue,
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
