import {useLayoutEffect, useRef, type ComponentType, type JSX} from 'react';
import {IndexPage} from '@/pages/IndexPage';
import {
  createHashRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import {ErrorView} from '@/components/Error';
import {AtlazerPage} from '@/pages/atlazer';
import {AtlazerServicePage} from '@/pages/atlazer/services';
import {AtlazerStuffPage} from '@/pages/atlazer/stuff';
import {AtlazerDateTimePage} from '@/pages/atlazer/datetime';
import {AtlazerBookingPage} from '@/pages/atlazer/booking';
import {AtlazerSuccessPage} from '@/pages/atlazer/success';

export interface Route {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- там могут быть пропсы
  Component: ComponentType<any>;
  title?: string;
  icon?: JSX.Element;
}

const routes: Route[] = [
  {
    path: '/index',
    Component: IndexPage,
    title: 'Домашняя страница',
  },
  {
    path: '/:slug/:companyId',
    Component: AtlazerPage,
    title: 'ET.Lazer',
  },
  {
    path: '/:slug/:companyId/service',
    Component: AtlazerServicePage,
    title: 'Услуги',
  },
  {
    path: '/:slug/:companyId/services',
    Component: AtlazerServicePage,
    title: 'Услуги',
  },
  {
    path: '/:slug/:companyId/stuff',
    Component: AtlazerStuffPage,
    title: 'Специалисты',
  },
  {
    path: '/:slug/:companyId/datetime',
    Component: AtlazerDateTimePage,
    title: 'Дата и время',
  },
  {
    path: '/:slug/:companyId/booking',
    Component: AtlazerBookingPage,
    title: 'Бронирование',
  },
  {
    path: '/:slug/:companyId/success',
    Component: AtlazerSuccessPage,
    title: 'Запись подтверждена',
  },
];

export const getRoutes = () => routes;
const scrollRestorationRoutes = ['/index'];

export function ScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const positions = useRef<Record<string, number>>({});

  useLayoutEffect(() => {
    const y = positions.current[location.pathname];
    if (y != null) {
      window.document.body.scrollTo(0, y);
    } else {
      window.document.body.scrollTo(0, 0);
    }

    return () => {
      if (scrollRestorationRoutes.includes(location.pathname)) {
        positions.current[location.pathname] = window.document.body.scrollTop;
      }
    };
  }, [location.pathname, navType]);

  return null;
}

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      {routes.map(route => (
        <Route
          key={route.path}
          {...route}
          index={route.path === '/index'}
          errorElement={<ErrorView />}
        />
      ))}
      {/* Любой непрописанный путь → редирект на стартовый */}
      <Route key="404" path="/*" element={<Navigate to="/index" replace />} />
      <Route key="404" path="/" element={<Navigate to="/index" replace />} />
    </Route>,
  ),
);
