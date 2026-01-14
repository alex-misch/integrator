import {useLocation} from 'react-router-dom';

export const getMiniappParamsFromPath = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  return {
    slug: parts[0] || 'atlazer',
    companyId: parts[1] || '',
  };
};

export const getMiniappBasePath = (slug: string, companyId?: string) => {
  return companyId ? `/${slug}/${companyId}` : `/${slug}`;
};

export const getMiniappSlugFromPath = (pathname: string) => {
  return getMiniappParamsFromPath(pathname).slug;
};

export const useMiniappSlug = () => {
  const {pathname} = useLocation();
  return getMiniappSlugFromPath(pathname);
};

export const useMiniappParams = () => {
  const {pathname} = useLocation();
  return getMiniappParamsFromPath(pathname);
};

export const useMiniappCompanyId = () => {
  const {pathname} = useLocation();
  return getMiniappParamsFromPath(pathname).companyId;
};
