import React from 'react';
import '@/styles/globals.css';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {NextPage} from 'next';
import {useEffect} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {configureApi, ApiErrorType} from '@integrator/api-client';
import {useRouter} from 'next/router';
import {useLogout} from '@/hooks/auth';
import {useManagersAdminControllerMy} from '@integrator/api-client/admin';

import dayjs from 'dayjs';
import rulocale from 'dayjs/locale/ru';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale(rulocale);

if (typeof process.env.NEXT_PUBLIC_API_URL !== 'string')
  throw new Error('NEXT_PUBLIC_API_URL not found in env');

configureApi({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
});

export type NextPageWithLayout<P = Record<string, unknown>> = NextPage<P> & {
  getLayout?: (page: React.ReactElement, props: P) => React.ReactElement;
};

type AppProps = {
  Component: NextPageWithLayout;
  pageProps: {
    dehydratedState?: unknown;
  };
};

function PageLayout({Component, pageProps}: AppProps) {
  const {error: profileError} = useManagersAdminControllerMy({
    query: {refetchOnWindowFocus: true},
  });
  const router = useRouter();
  const {mutateAsync: logout} = useLogout();

  useEffect(() => {
    if (!router.pathname.startsWith('/auth') && profileError?.status === 401) {
      logout().then(() => {
        router.push('/auth/login');
        toast(
          <p>
            <b>Ошибка авторизации</b>
            <br />
            Пожалуйста, авторизуйтесь повторно.
          </p>,
          {type: 'error'},
        );
      });
    }
  }, [profileError]);

  const getLayout = Component.getLayout ?? (page => page);
  return getLayout(<Component {...pageProps} />, pageProps);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5s,
      retry: false,
      throwOnError: false,
    },
    mutations: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: e => {
        const error = e as unknown as ApiErrorType;
        toast(
          <p>
            {error.statusText && (
              <>
                <b>{error.statusText}</b>
                <br />
              </>
            )}
            {error.message}
          </p>,
          {type: 'error'},
        );
      },
    },
  },
});

export default function App({Component, pageProps}: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <PageLayout Component={Component} pageProps={pageProps} />
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
