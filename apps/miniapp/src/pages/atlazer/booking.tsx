import {useEffect, useMemo} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {PenLine} from 'lucide-react';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {FloatingLabelInput} from '@/components/ui/input';
import {
  useMiniappsPublicControllerCreateRecord,
  useMiniappsPublicControllerServices,
  useMiniappsPublicControllerStaff,
} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';
import {Checkbox} from '@/components/ui/checkbox';
import {Controller, useForm} from 'react-hook-form';
import {SpecialistPreview} from '@/features/SpecialistPreview';

type BookingFormValues = {
  name: string;
  phone: string;
  email: string;
  consent: boolean;
};

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

export function AtlazerBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingParams = getBookingParams(searchParams);
  const serviceId = bookingParams.service || '';
  const specialistId = bookingParams.specialist || '';
  const dateValue = bookingParams.date;
  const timeValue = bookingParams.time;
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const {data: services = []} = useMiniappsPublicControllerServices(
    slug,
    companyId,
    {
      specialistId: specialistId && specialistId !== 'any' ? specialistId : '',
    },
    {query: {enabled: !!(slug && companyId)}},
  );
  const {data: apiSpecialists = []} = useMiniappsPublicControllerStaff(
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
  const createRecord = useMiniappsPublicControllerCreateRecord();

  useEffect(() => {
    const nextRoute = getNextBookingRoute(bookingParams, basePath);
    if (nextRoute !== `${basePath}/booking`) {
      navigate(buildBookingUrl(nextRoute, bookingParams), {replace: true});
    }
  }, [basePath, bookingParams, navigate]);

  const service = useMemo(
    () =>
      services.find(item => String(item.id) === serviceId) ??
      (services.length ? services[0] : null),
    [serviceId, services],
  );
  const specialist = useMemo(
    () =>
      specialists.find(item => String(item.id) === specialistId) ??
      (specialists.length ? specialists[0] : null),
    [specialistId, specialists],
  );

  const dateLabel = formatDateLabel(dateValue);
  const dateTimeValue =
    dateLabel && timeValue ? `${dateLabel}, ${timeValue}` : '';

  const {
    register,
    handleSubmit,
    control,
    formState: {errors},
  } = useForm<BookingFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      consent: true,
    },
  });

  const onSubmit = async (values: BookingFormValues) => {
    if (
      !slug ||
      !companyId ||
      !serviceId ||
      !dateValue ||
      !timeValue ||
      !service
    ) {
      return;
    }
    const booking = await createRecord.mutateAsync({
      slug,
      companyId,
      data: {
        service_id: Number(serviceId),
        specialist_id:
          specialistId && specialistId !== 'any' ? Number(specialistId) : null,
        date: dateValue,
        time: timeValue,
        client_name: values.name,
        client_phone: values.phone,
        client_email: values.email,
        comment: '',
      },
    });
    const baseUrl = buildBookingUrl(`${basePath}/success`, bookingParams);
    const connector = baseUrl.includes('?') ? '&' : '?';
    const bookingId = booking.id;
    navigate(bookingId ? `${baseUrl}${connector}id=${bookingId}` : baseUrl);
  };

  return (
    <Page back>
      <Page.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SpecialistPreview
            name={specialist?.name ?? 'Специалист'}
            role={specialist?.role ?? ''}
            photo={specialist?.photo_url ?? null}
          />

          <div className="mt-6 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                navigate(
                  buildBookingUrl(`${basePath}/service`, {
                    specialist: specialistId,
                  }),
                );
              }}
              className="w-full rounded-ui-l border bg-zinc-100 px-4 py-3 text-left flex items-center justify-between"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm text-black/40">Услуга</span>
                <span className="text-black font-medium">
                  {service?.title || 'Услуга'}
                </span>
              </span>
              <PenLine className="h-5 w-5 fill-black/40 text-black/40" />
            </button>

            <div className="w-full rounded-ui-l border bg-zinc-100 px-4 py-3 text-left">
              <div className="text-sm text-black/40">Стоимость</div>
              <div className="text-black font-medium">
                {service?.price_text
                  ? `${service?.price_text} · ${service?.duration_text}`
                  : 'не указана'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigate(
                  buildBookingUrl(`${basePath}/datetime`, {
                    service: serviceId,
                    specialist: specialistId,
                  }),
                );
              }}
              className="w-full rounded-ui-l border bg-zinc-100 px-4 py-3 text-left flex items-center justify-between"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm text-black/40">Дата и время</span>
                <span className="text-black font-medium">
                  {dateTimeValue || 'Выберите дату'}
                </span>
              </span>
              <PenLine className="h-5 w-5 fill-black/40 text-black/40" />
            </button>
          </div>

          <div className="mt-8">
            <p className="text-base font-medium text-black mb-2">Ваши данные</p>
            <div className="flex flex-col gap-4">
              <FloatingLabelInput
                id="client-name"
                label="Имя"
                error={errors.name?.message}
                aria-invalid={!!errors.name}
                {...register('name', {required: 'Введите имя'})}
              />
              <FloatingLabelInput
                id="client-phone"
                label="Телефон"
                type="tel"
                error={errors.phone?.message}
                aria-invalid={!!errors.phone}
                {...register('phone', {required: 'Введите телефон'})}
              />
              <FloatingLabelInput
                id="client-email"
                label="Электронная почта"
                type="email"
                error={errors.email?.message}
                aria-invalid={!!errors.email}
                {...register('email', {required: 'Введите email'})}
              />
            </div>
            <label className="mt-8 flex items-center justify-start gap-3 text-black font-medium text-[13px]">
              <Controller
                name="consent"
                control={control}
                rules={{required: true}}
                render={({field}) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={errors.consent ? 'border-red-500' : undefined}
                  />
                )}
              />
              <span className={errors.consent ? 'text-red-500' : undefined}>
                Я даю согласие на{' '}
                <a
                  href="/offer"
                  className="text-blue-600"
                  target="_blank"
                  rel="noreferrer"
                >
                  обработку персональных данных
                </a>
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-red-500">Подтвердите согласие</p>
            )}
          </div>

          <FixedActionBar>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-4"
            >
              Записаться
            </Button>
          </FixedActionBar>
        </form>
      </Page.Content>
    </Page>
  );
}
