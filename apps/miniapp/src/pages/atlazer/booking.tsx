import {useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {PenLine} from 'lucide-react';
import {Page} from '@/components/Layout/Page.tsx';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {FloatingLabelInput} from '@/components/ui/input';
import {useMiniappsPublicControllerCreateRecord} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {
  buildBookingUrl,
  getBookingParams,
  getNextBookingRoute,
} from './booking-flow';
import {Checkbox} from '@/components/ui/checkbox';
import {Controller, useForm} from 'react-hook-form';

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
  const dateValue = bookingParams.date;
  const timeValue = bookingParams.time;
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const createRecord = useMiniappsPublicControllerCreateRecord();

  useEffect(() => {
    const nextRoute = getNextBookingRoute(bookingParams, basePath);
    if (nextRoute !== `${basePath}/booking`) {
      navigate(buildBookingUrl(nextRoute, bookingParams), {replace: true});
    }
  }, [basePath, bookingParams, navigate]);

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
    if (!slug || !companyId || !dateValue || !timeValue) {
      return;
    }
    const booking = await createRecord.mutateAsync({
      slug,
      companyId,
      data: {
        date: dateValue,
        time: timeValue,
        client_name: values.name,
        client_phone: values.phone,
        client_email: values.email,
        comment: '',
      },
    });
    const baseUrl = buildBookingUrl(`${basePath}/success`, {
      date: dateValue,
      time: timeValue,
    });
    const connector = baseUrl.includes('?') ? '&' : '?';
    const bookingId = booking.id;
    navigate(bookingId ? `${baseUrl}${connector}id=${bookingId}` : baseUrl);
  };

  return (
    <Page back>
      <Page.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                navigate(buildBookingUrl(`${basePath}/branch`, {}));
              }}
              className="w-full rounded-ui-l border bg-zinc-100 px-4 py-2.5 text-left flex items-center justify-between"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm text-black/40">Дата и время</span>
                <span className="text-black font-medium -mt-0.5">
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
                {...register('email')}
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
