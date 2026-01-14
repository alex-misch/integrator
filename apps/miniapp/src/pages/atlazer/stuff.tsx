import {useEffect, useMemo, useState} from 'react';
import {Check, UserSearch} from 'lucide-react';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useMiniappsPublicControllerStaff} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';

export function AtlazerStuffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const specialistFromUrl = bookingParams.specialist;
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const serviceFilter = bookingParams.service ?? undefined;
  const {data: apiSpecialists = [], isLoading} =
    useMiniappsPublicControllerStaff(
      slug,
      companyId,
      {serviceId: serviceFilter || ''},
      {query: {enabled: !!(slug && companyId)}},
    );
  const specialists = useMemo(
    () => [
      {
        id: 'any',
        name: 'Любой мастер',
        role: 'Подберем мастера',
        photo_url: null,
      },
      ...apiSpecialists,
    ],
    [apiSpecialists],
  );
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(
    specialistFromUrl ?? null,
  );

  useEffect(() => {
    if (specialistFromUrl && specialistFromUrl !== selectedSpecialist) {
      setSelectedSpecialist(specialistFromUrl);
    }
  }, [specialistFromUrl, selectedSpecialist]);

  const goNext = (specialistId: string) => {
    const params = {
      ...bookingParams,
      specialist: specialistId,
    };
    const nextRoute = getNextBookingRoute(params, basePath);
    navigate(buildBookingUrl(nextRoute, params));
  };

  const handleSelect = (specialistId: string) => {
    setSelectedSpecialist(specialistId);
  };

  return (
    <Page back>
      <Page.Content>
        <p className="text-2xl font-bold pt-3">Специалисты</p>
        <div className="pt-4 flex flex-col gap-1">
          {isLoading ? (
            Array.from({length: 5}).map((_, index) => (
              <div
                key={`specialist-skeleton-${index}`}
                className="w-full bg-gray-100 rounded-ui-l px-1 h-[72px] py-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-ui-m" />
                  <div className="flex flex-col items-start gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : specialists.length ? (
            specialists.map(specialist => {
              const specialistId = String(specialist.id);
              const isSelected = selectedSpecialist === specialistId;
              return (
                <button
                  key={specialistId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelect(specialistId)}
                  className={`w-full bg-gray-100 rounded-ui-l px-1 h-[72px] py-1 flex items-center justify-between border ${
                    isSelected ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {specialist.photo_url ? (
                      <img
                        src={specialist.photo_url}
                        alt={specialist.name}
                        className="w-16 rounded-ui-m object-fit"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-ui-m bg-gray-300 flex items-center justify-center">
                        <UserSearch className="text-gray-500 w-10 h-10" />
                      </div>
                    )}
                    <div className="flex flex-col items-start py-3">
                      <span className="text-black font-medium">
                        {specialist.name}
                      </span>
                      <span className="text-sm text-black/40">
                        {specialist.role}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mr-4 bg-black rounded-full h-5 w-5 flex justify-center items-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-black/40">
              Нет доступных специалистов
            </div>
          )}
        </div>

        {selectedSpecialist && (
          <FixedActionBar>
            <Button
              type="button"
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => goNext(selectedSpecialist)}
            >
              Продолжить
            </Button>
          </FixedActionBar>
        )}
      </Page.Content>
    </Page>
  );
}
