import {useCallback, useEffect, useMemo, useRef} from 'react';

// Использует IntersectionObserver для отслеживания во вьюпорте элемент или нет
// При попадании/выпадании из viewport вызывает callback
//
// Пример:
// ...
// const ref = useInViewport((scrolledDown) => {
//   if (scrolledDown) fetchNext();
// });
//
// return <><table ... /><div ref={ref} /></>
export const useInViewport = (callback: (inView: boolean) => void) => {
  const unsubscribe = useRef<VoidFunction | null>(null);

  const refCallback = useCallback((element: HTMLElement | null) => {
    if (unsubscribe.current) unsubscribe.current();
    if (!element) return;
    observer.observe(element);
    unsubscribe.current = () => {
      observer.unobserve(element);
    };
  }, []);

  const observer = useMemo(
    () =>
      new IntersectionObserver(entries => {
        callback(entries[0].isIntersecting);
      }),
    [],
  );

  useEffect(() => {
    return () => {
      if (unsubscribe.current) unsubscribe.current();
      observer.disconnect();
    };
  }, []);

  return refCallback;
};
