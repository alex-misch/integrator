import {useLaunchParams} from '@telegram-apps/sdk-react';
import {RouterProvider} from 'react-router-dom';

import {router} from '@/navigation/routes.tsx';
import React, {useEffect, useLayoutEffect} from 'react';
import {
  mountSwipeBehavior,
  disableVerticalSwipes,
  enableVerticalSwipes,
} from '@telegram-apps/sdk-react';
import {
  useCustomerPublicControllerProfile,
  useCustomerPublicControllerVerify,
} from '@integrator/api-client/public';
import '@/config';
import {LoaderFullscreen} from './Layout/LoaderFullscreen';
import {getMiniappParamsFromPath} from '@/lib/miniapp';

export default React.memo(function App() {
  const query = new URLSearchParams(window.location.search);
  const hashPath = window.location.hash.replace(/^#/, '');
  const {companyId} = getMiniappParamsFromPath(hashPath);

  const lp = useLaunchParams();

  const {
    mutate: verify,
    isError,
    isSuccess,
    error,
  } = useCustomerPublicControllerVerify({
    mutation: {throwOnError: true},
  });

  const {data: profile} = useCustomerPublicControllerProfile({
    query: {enabled: isSuccess},
  });

  useEffect(() => {
    const queryStartParam = query.get('tgWebAppStartParam');
    if (lp.initDataRaw && companyId)
      verify({
        data: {
          initData: lp.initDataRaw,
          startParam:
            lp.startParam ||
            lp.initData?.startParam ||
            queryStartParam ||
            undefined,
          company_id: Number(companyId),
        },
      });
  }, [companyId, lp.initDataRaw, lp.startParam, verify]);

  useLayoutEffect(() => {
    if (!import.meta.env.DEV) {
      mountSwipeBehavior();
      disableVerticalSwipes();
      return () => enableVerticalSwipes();
    }
  }, []);

  return (
    <>
      {isError && (
        <div className="w-full wrap text-black">
          <span className="w-6 h-6">Error.</span>
          <span>Fail.</span>
          <br />
          {window.location.href}
          <br />
          {error.message} {error.stack} <br />
          start: {lp.initData?.startParam} <br />
          cpid: {Number(companyId)}
        </div>
      )}
      {!isSuccess && <LoaderFullscreen />}
      {isSuccess && !!profile && (
        <React.Suspense fallback={<LoaderFullscreen />}>
          <RouterProvider router={router} />
        </React.Suspense>
      )}
    </>
  );
});
