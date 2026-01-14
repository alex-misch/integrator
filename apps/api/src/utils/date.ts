import * as utc from 'dayjs/plugin/utc';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import * as dayjs from 'dayjs';

dayjs.extend(utc);
dayjs.extend(relativeTime);

export function toUTC(date?: string | dayjs.Dayjs | Date) {
  return dayjs.utc(date);
}

export const getTodayRange = () => {
  const startOfDay = toUTC().startOf('day');
  const endOfDay = toUTC().endOf('day');

  return [startOfDay, endOfDay];
};

export const getYesterdayRange = () => {
  const startOfDay = toUTC().subtract(1, 'day').startOf('day');
  const endOfDay = toUTC().subtract(1, 'day').endOf('day');

  return [startOfDay, endOfDay];
};

export const getDaysExpire = (date_expiration?: Date | null) => {
  if (!date_expiration) return 0;

  const days_expiration = dayjs
    .utc(date_expiration)
    .add(1, 'day')
    .diff(toUTC(), 'days');
  return days_expiration > 0 ? days_expiration : 0;
};

export function formatMoscowDateTime(date: string): string | null {
  try {
    const hasT = date.includes('T');
    const cleaned = date.replace('Z', '').trim();
    if (hasT && cleaned.includes('+')) return cleaned;
    if (hasT) return `${cleaned}+03:00`;
    return `${cleaned.replace(' ', 'T')}+03:00`;
  } catch {
    return null;
  }
}
