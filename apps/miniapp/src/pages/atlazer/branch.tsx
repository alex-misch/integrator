import {useEffect, useMemo} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Check, MapPin} from 'lucide-react';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {useMiniappsPublicControllerBySlug} from '@integrator/api-client/public';
import {
  getMiniappBasePath,
  getStoredMiniappCompanyId,
  setStoredMiniappCompanyId,
  useMiniappParams,
} from '@/lib/miniapp';
import {buildBookingUrl, getBookingParams} from './booking-flow';
import {cn} from '@/lib/utils';

export function AtlazerBranchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const {slug, companyId} = useMiniappParams();
  const {data: miniapp, isLoading} = useMiniappsPublicControllerBySlug(
    slug,
    companyId,
    {
      query: {enabled: !!(slug && companyId)},
    },
  );

  const companies = useMemo(() => {
    const list = miniapp?.companies ?? [];
    if (list.length) return list;

    const integration = miniapp?.integration;
    return integration?.company_id
      ? [
          {
            id: integration.company_id,
            title:
              integration.address_text ||
              integration.city ||
              `Филиал ${integration.company_id}`,
          },
        ]
      : [];
  }, [miniapp]);

  const selectedCompanyId = companyId || String(companies[0]?.id ?? '');
  const storedCompanyId = slug ? getStoredMiniappCompanyId(slug) : undefined;

  const goToDateTime = (nextCompanyId = selectedCompanyId, replace = false) => {
    if (!slug || !nextCompanyId) return;
    setStoredMiniappCompanyId(slug, String(nextCompanyId));
    const url = buildBookingUrl(
      `${getMiniappBasePath(slug, String(nextCompanyId))}/datetime`,
      bookingParams,
    );
    navigate(url, replace ? {replace: true} : undefined);
  };

  useEffect(() => {
    if (storedCompanyId) {
      goToDateTime(storedCompanyId, true);
    }
  }, [storedCompanyId]);

  return (
    <Page back>
      <Page.Content>
        <div className="pt-3">
          <p className="text-2xl font-bold">Выберите филиал</p>
        </div>

        <div className="pt-4 flex flex-col gap-1">
          {isLoading ? (
            Array.from({length: 2}).map((_, index) => (
              <div
                key={`branch-skeleton-${index}`}
                className="w-full rounded-ui-l bg-gray-100 px-4 py-4"
              >
                <Skeleton className="h-5 w-56" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
            ))
          ) : companies.length ? (
            companies.map(company => {
              const branchId = String(company.id);
              const isSelected = branchId === selectedCompanyId;

              return (
                <button
                  key={branchId}
                  type="button"
                  onClick={() => goToDateTime(branchId)}
                  className={cn(
                    'w-full rounded-ui-l border bg-gray-100 px-4 py-4 text-left flex items-center justify-between gap-4',
                    isSelected ? 'border-black' : 'border-transparent',
                  )}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-ui-m bg-white">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </span>
                    <span className="min-w-0 block font-medium text-black self-center">
                      {company.title}
                    </span>
                  </span>
                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-black/40">Нет доступных филиалов</div>
          )}
        </div>

        <FixedActionBar>
          <Button
            type="button"
            variant="primary"
            disabled={!selectedCompanyId}
            className="w-full py-4"
            size="lg"
            onClick={() => goToDateTime()}
          >
            Продолжить
          </Button>
        </FixedActionBar>
      </Page.Content>
    </Page>
  );
}
