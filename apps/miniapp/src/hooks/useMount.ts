import { useEffect, useRef } from 'react';

export const useMount = <Deps>(fn: VoidFunction, deps?: Deps[]) => {
  const isCalled = useRef(false);

  useEffect(() => {
    if (!isCalled.current) {
      isCalled.current = true;
      fn();
    }
  }, deps || []);
};
