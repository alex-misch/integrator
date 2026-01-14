import {useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-toastify';
import {useEffect} from 'react';
import {
  useAdminAuthControllerGetProfile,
  useAdminAuthControllerLogin,
  useAdminAuthControllerLogout,
} from '@integrator/api-client/admin';
import {useRouter} from 'next/router';

export function useLogin() {
  const client = useQueryClient();

  const {
    data: profile,
    isPending: isProfileLoading,
    refetch: refetchProfile,
  } = useAdminAuthControllerGetProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isProfileLoading && profile && router.pathname.startsWith('/auth')) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  return useAdminAuthControllerLogin({
    mutation: {
      mutationKey: ['login'],
      onError: error => {
        toast(error.body?.message.message || error.message, {type: 'error'});
      },
      onSuccess: () => {
        client.resetQueries();
        refetchProfile();
      },
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useAdminAuthControllerLogout({
    mutation: {
      mutationKey: ['logout'],
      onSuccess: async () => {
        await client.resetQueries();

        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      },
    },
  });
}
