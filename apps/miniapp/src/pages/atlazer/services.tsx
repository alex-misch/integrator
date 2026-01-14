import {useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useMiniappsPublicControllerServices} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';

export function AtlazerServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const serviceFromUrl = bookingParams.service;
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const specialistFilter =
    bookingParams.specialist && bookingParams.specialist !== 'any'
      ? bookingParams.specialist
      : undefined;
  const {data: services = []} = useMiniappsPublicControllerServices(
    slug,
    companyId,
    {specialistId: specialistFilter || ''},
    {query: {enabled: !!(slug && companyId)}},
  );
  const [selectedService, setSelectedService] = useState<string | null>(
    serviceFromUrl ?? null,
  );

  useEffect(() => {
    if (serviceFromUrl && serviceFromUrl !== selectedService) {
      setSelectedService(serviceFromUrl);
    }
  }, [serviceFromUrl, selectedService]);

  const goNext = (serviceId: string) => {
    const params = {
      ...bookingParams,
      service: serviceId,
      date: undefined,
      time: undefined,
    };
    const nextRoute = getNextBookingRoute(params, basePath);
    navigate(buildBookingUrl(nextRoute, params));
  };

  const handleSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  return (
    <Page back>
      <Page.Content>
        <p className="text-2xl font-bold pt-3">Услуги</p>
        <div className="pt-4 flex flex-col gap-1">
          {services.length ? (
            services.map(service => {
              const serviceId = String(service.id);
              const isSelected = selectedService === serviceId;
              return (
                <button
                  key={service.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelect(serviceId)}
                  className={`w-full bg-gray-100 rounded-ui-l px-4 py-3 flex items-center justify-between border ${
                    isSelected ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-black font-medium">
                      {service.title}
                    </span>
                    <span className="text-sm text-black/40">
                      {service.price_text ?? ''}
                      {service.price_text ? ' · ' : ''}
                      {service.duration_text ?? ''}
                    </span>
                  </span>
                  {isSelected && (
                    <div className="bg-black rounded-full h-5 w-5 flex justify-center items-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-black/40">Нет доступных услуг</div>
          )}
        </div>
        {selectedService && (
          <FixedActionBar>
            <Button
              type="button"
              variant="primary"
              className="w-full py-4"
              size="lg"
              onClick={() => goNext(selectedService)}
            >
              Продолжить
            </Button>
          </FixedActionBar>
        )}
      </Page.Content>
    </Page>
  );
}
