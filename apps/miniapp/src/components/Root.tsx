import App from '@/components/App.tsx';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useMemo} from 'react';
import {useMount} from '@/hooks/useMount';

import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {ErrorBoundary} from './ErrorBoundary';
import {ErrorView} from './Error';

export function Root() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            staleTime: 1000, // 1s,
            retry: false,
          },
        },
      }),
    [],
  );

  useMount(() => {
    setTimeout(() => {
      const {clientHeight} = document.documentElement;
      document.documentElement.style.setProperty('--svh', clientHeight + 'px');

      const {innerHeight} = window;
      document.documentElement.style.setProperty('--dvh', innerHeight + 'px');

      const div = document.createElement('div');
      div.style.setProperty('width', '1px');
      div.style.setProperty('height', '100vh');
      div.style.setProperty('position', 'fixed');
      div.style.setProperty('left', '0');
      div.style.setProperty('top', '0');
      div.style.setProperty('bottom', '0');
      div.style.setProperty('visibility', 'hidden');
      document.body.appendChild(div);

      const calcHeight = div.clientHeight;
      div.remove();

      document.documentElement.style.setProperty('--lvh', calcHeight + 'px');
    }, 500);
  });
  return (
    <ErrorBoundary fallback={ErrorView}>
      <ToastContainer className={'z-100'} />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
