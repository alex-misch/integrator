import {useLocation} from 'react-router-dom';

const DEFAULT_MINIAPP_SLUG = 'atlazer';
const DEFAULT_COMPANY_ID = '520803';

const getSelectedCompanyStorageKey = (slug: string) =>
  `miniapp:${slug}:selected-company-id`;

export const getStoredMiniappCompanyId = (slug = DEFAULT_MINIAPP_SLUG) => {
  if (typeof window === 'undefined') return undefined;

  try {
    return (
      window.localStorage.getItem(getSelectedCompanyStorageKey(slug)) ||
      undefined
    );
  } catch {
    return undefined;
  }
};

export const setStoredMiniappCompanyId = (slug: string, companyId: string) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getSelectedCompanyStorageKey(slug), companyId);
  } catch {
    // Local storage may be unavailable in restricted webviews.
  }
};

export const getMiniappParamsFromPath = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[0] || DEFAULT_MINIAPP_SLUG;
  return {
    slug,
    companyId:
      parts[1] || getStoredMiniappCompanyId(slug) || DEFAULT_COMPANY_ID,
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
