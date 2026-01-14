import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Redo2, X} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet';
import {Page} from '@/components/Layout/Page.tsx';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {
  useMiniappsPublicControllerBySlug,
  useMiniappsPublicControllerBookingById,
  useMiniappsPublicControllerServices,
  useMiniappsPublicControllerStaff,
} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {buildBookingUrl, getBookingParams} from './booking-flow';
import {OrgContacts} from '@/features/OrgContacts';
import {SpecialistPreview} from '@/features/SpecialistPreview';

const monthNames = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const formatDateLabel = (value?: string | null) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${day} ${monthNames[month - 1]}`;
};

export function AtlazerSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const bookingId = searchParams.get('id');
  const serviceId = bookingParams.service;
  const specialistId = bookingParams.specialist;
  const dateValue = bookingParams.date;
  const timeValue = bookingParams.time;
  const [cancelOpen, setCancelOpen] = useState(false);
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const {data: miniapp} = useMiniappsPublicControllerBySlug(slug, companyId, {
    query: {enabled: !!(slug && companyId)},
  });
  const {
    data: booking,
    isError: isBookingNotFound,
    isLoading: isBookingLoading,
  } = useMiniappsPublicControllerBookingById(slug, companyId, bookingId ?? '', {
    query: {enabled: !!(slug && companyId && bookingId)},
  });

  useEffect(() => {
    if (isBookingNotFound) navigate(getMiniappBasePath(slug, companyId));
  }, [isBookingNotFound]);

  const {data: services = [], isLoading: isLoadingServices} =
    useMiniappsPublicControllerServices(
      slug,
      companyId,
      {
        specialistId:
          specialistId && specialistId !== 'any' ? specialistId : '',
      },
      {query: {enabled: !!(slug && companyId)}},
    );

  const {data: apiSpecialists = [], isLoading: isLoadingSpecialists} =
    useMiniappsPublicControllerStaff(
      slug,
      companyId,
      {serviceId: serviceId || ''},
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

  // useEffect(() => {
  //   const nextRoute = getNextBookingRoute(bookingParams, basePath);
  //   if (nextRoute !== `${basePath}/booking`) {
  //     navigate(buildBookingUrl(nextRoute, bookingParams), {replace: true});
  //   }
  // }, [basePath, bookingParams, navigate]);

  const service = useMemo(() => {
    if (booking?.service) return booking.service;
    return (
      services.find(item => String(item.id) === serviceId) ??
      (services.length ? services[0] : null)
    );
  }, [booking?.service, serviceId, services]);
  const specialist = useMemo(() => {
    if (booking?.specialist) return booking.specialist;
    return (
      specialists.find(item => String(item.id) === specialistId) ??
      (specialists.length ? specialists[0] : null)
    );
  }, [booking?.specialist, specialistId, specialists]);

  const bookingDate = booking?.date ?? dateValue;
  const bookingTime = booking?.time ?? timeValue;
  const dateLabel = formatDateLabel(bookingDate);
  const dateTimeLabel =
    dateLabel && bookingTime ? `${dateLabel}, ${bookingTime}` : '';
  const primaryIntegration = miniapp?.integration ?? null;
  const title =
    miniapp?.public_title || miniapp?.title || miniapp?.name || 'Miniapp';
  const isLoading =
    isBookingLoading || isLoadingServices || isLoadingSpecialists;

  return (
    <Page back>
      <Page.Title>
        <div className="pt-3">
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-5 w-20" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">{dateLabel}</p>
              <p className="text-lg font-medium">{bookingTime}</p>
            </>
          )}
        </div>
      </Page.Title>
      <Page.Content>
        {isLoading ? (
          <>
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-ui-l" />
              <div className="flex flex-col gap-2 items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-6 p-1">
              <div className="flex gap-1">
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <div className="border-b border-neutral-200 bg-white py-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-40" />
              </div>
              <div className="border-b border-neutral-200 bg-white py-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
              <div className="bg-white py-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-4 w-36" />
              </div>
            </div>
          </>
        ) : (
          <>
            <SpecialistPreview
              name={specialist?.name ?? 'Специалист'}
              role={specialist?.role ?? ''}
              photo={specialist?.photo_url ?? null}
            />
            <div className="flex justify-center mt-3">
              <Badge variant="success">Активная</Badge>
            </div>

            <div className="mt-6 p-1">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="muted"
                  rounded="full"
                  iconLeft={<Redo2 className="h-[18px] w-[18px]" />}
                  className="flex-1"
                  onClick={() => {
                    navigate(
                      buildBookingUrl(`${basePath}/datetime`, {
                        service: serviceId,
                        specialist: specialistId,
                      }),
                    );
                  }}
                >
                  Перенести
                </Button>
                <Button
                  type="button"
                  variant="muted"
                  rounded="full"
                  iconLeft={<X className="h-[18px] w-[18px] text-red-500" />}
                  className="flex-1"
                  onClick={() => setCancelOpen(true)}
                >
                  Отменить
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-col">
              <div className="border-b border-neutral-200 bg-white py-3">
                <div className="text-sm text-black/40">Услуга</div>
                <div className="text-black font-medium">
                  {service?.title || 'Услуга'}
                </div>
              </div>
              <div className="border-b border-neutral-200 bg-white py-3">
                <div className="text-sm text-black/40">Стоимость</div>
                <div className="text-black font-medium">
                  {service?.price_text
                    ? `${service?.price_text} · ${service?.duration_text || '—'}`
                    : 'не указана'}
                </div>
              </div>
              <div className="bg-white py-3">
                <div className="text-sm text-black/40">Дата и время</div>
                <div className="text-black font-medium">{dateTimeLabel}</div>
              </div>
            </div>
          </>
        )}

        <OrgContacts
          title={title}
          address={primaryIntegration?.address_text}
          coords={
            primaryIntegration?.lat && primaryIntegration?.lng
              ? [primaryIntegration.lat, primaryIntegration.lng]
              : null
          }
          phone={primaryIntegration?.phone}
          whatsapp={primaryIntegration?.whatsapp}
          telegram={primaryIntegration?.telegram}
          website={primaryIntegration?.website}
        />
      </Page.Content>

      <Sheet open={cancelOpen} onOpenChange={setCancelOpen}>
        <SheetContent side="bottom">
          <SheetTitle className="text-2xl font-bold">Внимание</SheetTitle>
          <SheetDescription className="text-black/60 mt-2 text-center">
            Вы уверены, что хотите отменить запись?
          </SheetDescription>
          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="secondary"
              className="w-1/2"
              size="lg"
              rounded="full"
            >
              Отменить запись
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              rounded="full"
              className="w-1/2"
              onClick={() => setCancelOpen(false)}
            >
              Закрыть
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
