import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import rulocale from 'dayjs/locale/ru';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

dayjs.locale(rulocale);

export function humanReadableDate(date: string) {
  const localDate = dayjs.utc(date).local();
  const now = dayjs();

  if (localDate.isSame(now, 'day')) {
    return 'Сегодня';
  } else if (localDate.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Вчера';
  } else if (localDate.isSame(now.add(1, 'day'), 'day')) {
    return 'Завтра';
  } else {
    return localDate.format('D MMM YYYY');
  }
}
