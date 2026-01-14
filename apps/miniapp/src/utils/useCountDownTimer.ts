import {useEffect, useRef, useState} from 'react';
import {pluralize} from './text';

export function useCountdownTimer(duration: number) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerId = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setTimeLeft(duration);
    timerId.current = setInterval(() => {
      setTimeLeft(locTimeLeft => locTimeLeft - 1);
    }, 1000);

    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = undefined;
      }
    };
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0 && timerId.current) {
      clearInterval(timerId.current);
      timerId.current = undefined;
    }
  }, [timeLeft]);

  const daysLeft = Math.floor(timeLeft / (60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (60 * 60 * 24)) / (60 * 60));
  const minutesLeft = Math.floor((timeLeft % (60 * 60)) / 60);
  const secondsLeft = timeLeft % 60;

  const timeLeftFormatted = [
    pluralize(daysLeft, ['день', 'дня', 'дней']),
    pluralize(hoursLeft, ['час', 'часа', 'часов']),
    daysLeft < 10
      ? pluralize(minutesLeft, ['минута', 'минуты', 'минут'])
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    daysLeft,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    timeLeft,
    timeLeftFormatted,
  };
}
