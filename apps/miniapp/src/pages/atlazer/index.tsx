import {Page} from '@/components/Layout/Page.tsx';
import {Badge} from '@/components/ui/badge';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {LocationIcon, SelectArrowIcon} from '@/uikit/icons';
import {ArrowUpRight, Share2, StarIcon} from 'lucide-react';
import {PropsWithChildren, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {OrgContacts} from '@/features/OrgContacts';
import {cn} from '@/lib/utils';
import {
  useCustomerPublicControllerProfile,
  useMiniappsPublicControllerBySlug,
  useMiniappsPublicControllerBookings,
  useWalletPublicControllerBalance,
  useWalletPublicControllerSpend,
  useWalletPublicControllerTopup,
} from '@integrator/api-client/public';
import {getMiniappBasePath, useMiniappParams} from '@/lib/miniapp';
import {shareURL} from '@telegram-apps/sdk-react';

export function AtlazerPage() {
  const buttonsBlockRef = useRef<HTMLDivElement | null>(null);
  const photosScrollRef = useRef<HTMLDivElement | null>(null);
  const [photosScroll, setPhotosScroll] = useState({
    thumbWidth: 0,
    thumbLeft: 0,
    isVisible: false,
  });
  const [showBookingCta, setShowBookingCta] = useState(false);
  const photosTrackWidth = 40;
  const {slug, companyId} = useMiniappParams();
  const basePath = getMiniappBasePath(slug, companyId);
  const {data: miniapp, isLoading: isMiniappLoading} =
    useMiniappsPublicControllerBySlug(slug, companyId, {
      query: {enabled: !!(slug && companyId)},
    });
  const {data: bookings = [], isLoading: isBookingsLoading} =
    useMiniappsPublicControllerBookings(slug, companyId, {
      query: {enabled: !!(slug && companyId)},
    });
  const {data: profile} = useCustomerPublicControllerProfile();
  const primaryIntegration = miniapp?.integration ?? null;
  const companies = miniapp?.companies ?? [];
  const selectedCompany =
    companies.find(item => String(item.id) === companyId) ?? companies[0];
  const title =
    miniapp?.public_title || miniapp?.title || miniapp?.name || 'Miniapp';
  const cityLabel =
    primaryIntegration?.city || primaryIntegration?.address_text || 'Город';
  const addressLabel = primaryIntegration?.address_text || 'Адрес не указан';
  const photos = miniapp?.photos ?? [];
  const reviews = miniapp?.reviews ?? [];
  const latestRecord = bookings[0];
  const recordDate = latestRecord?.date ?? '';
  const recordTime = latestRecord?.time ?? '';
  const recordServiceTitle = latestRecord?.service?.title || 'Запись';
  const recordMonthLabel = useMemo(() => {
    if (!recordDate) return '';
    const date = new Date(recordDate);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('ru-RU', {month: 'short'});
  }, [recordDate]);
  const recordDayLabel = useMemo(() => {
    if (!recordDate) return '';
    const date = new Date(recordDate);
    if (Number.isNaN(date.getTime())) return '';
    return String(date.getDate());
  }, [recordDate]);
  const isLoading = isMiniappLoading || isBookingsLoading;
  const referralLink = profile?.referral_code
    ? `https://t.me/etlazer_bot?start=tg_${profile.referral_code}`
    : null;

  const shareReferralLink = async () => {
    if (!referralLink) return;

    if (shareURL) {
      await shareURL(referralLink);
      return;
    }

    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const updatePhotosScroll = () => {
    const container = photosScrollRef.current;
    if (!container) {
      return;
    }

    const {scrollLeft, scrollWidth, clientWidth} = container;
    if (scrollWidth <= clientWidth) {
      setPhotosScroll({thumbWidth: 0, thumbLeft: 0, isVisible: false});
      return;
    }

    const ratio = clientWidth / scrollWidth;
    const thumbWidth = Math.max(12, photosTrackWidth * ratio);
    const maxThumbLeft = photosTrackWidth - thumbWidth;
    const maxScrollLeft = scrollWidth - clientWidth;
    const thumbLeft =
      maxScrollLeft === 0 ? 0 : (scrollLeft / maxScrollLeft) * maxThumbLeft;

    setPhotosScroll({thumbWidth, thumbLeft, isVisible: true});
  };

  useEffect(() => {
    updatePhotosScroll();
    window.addEventListener('resize', updatePhotosScroll);
    return () => window.removeEventListener('resize', updatePhotosScroll);
  }, []);

  useEffect(() => {
    const target = buttonsBlockRef.current;
    if (!target || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setShowBookingCta(!entry.isIntersecting);
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId && selectedCompany?.id && slug) {
      navigate(getMiniappBasePath(slug, String(selectedCompany.id)), {
        replace: true,
      });
    }
  }, [companyId, navigate, selectedCompany?.id, slug]);

  return (
    <Page back={false}>
      <Page.Content>
        <div className="flex gap-4 items-center pb-4">
          {isLoading ? (
            <Skeleton className="w-24 h-24 rounded-ui-l" />
          ) : miniapp?.logo_url ? (
            <img src={miniapp.logo_url} className="w-24" />
          ) : (
            <img src="/assets/atlazer-logo.png" className="w-24" />
          )}
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-52" />
              </>
            ) : (
              <>
                <form className="relative">
                  <label
                    htmlFor="select-city"
                    className="py-0.5 px-1.5 gap-1.5 bg-blue-500 text-white rounded-xl inline-flex items-center"
                  >
                    <p className="text-[11px] inline uppercase font-medium">
                      {cityLabel}
                    </p>
                    <SelectArrowIcon />
                  </label>
                  <select
                    id="select-city"
                    className="opacity-0 absolute top-0 left-0"
                    value={selectedCompany ? String(selectedCompany.id) : ''}
                    onChange={event => {
                      const nextCompanyId = event.target.value;
                      if (!nextCompanyId || !slug) return;
                      navigate(getMiniappBasePath(slug, nextCompanyId));
                    }}
                  >
                    {companies.length ? (
                      companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.title}
                        </option>
                      ))
                    ) : (
                      <option>Москва</option>
                    )}
                  </select>
                </form>
                <p className="text-3xl font-medium">{title}</p>
                <p className="text-black text-sm opacity-[32%] flex gap-1 items-center">
                  <LocationIcon /> {addressLabel}
                </p>
              </>
            )}
          </div>
        </div>
        <div ref={buttonsBlockRef} className="pt-3 pb-6 grid grid-cols-2 gap-1">
          <ButtonBox onClick={() => navigate(`${basePath}/service`)}>
            Услуги
          </ButtonBox>
          <ButtonBox onClick={() => navigate(`${basePath}/stuff`)}>
            Специалисты
          </ButtonBox>
        </div>
        <div>
          <p className="text-xl font-medium pt-3">Записи</p>
          <div className="pt-4">
            {isLoading ? (
              <div className="rounded-ui-l bg-gray-100 flex gap-1 p-4">
                <Skeleton className="h-16 w-16 rounded-ui-m" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            ) : latestRecord ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`${basePath}/success?id=${latestRecord.id}`)
                }
                className="w-full text-left rounded-ui-l bg-gray-100 flex flex gap-1"
              >
                <div className="border-r border-black/[0.08] py-3 px-4 flex flex-col items-center justify-center">
                  <p className="opacity-40">{recordMonthLabel}</p>
                  <p className="font-medium text-2xl">{recordDayLabel}</p>
                </div>
                <div className="p-4 flex flex-col items-start justify-center gap-1">
                  <p className="font-medium">{recordServiceTitle}</p>
                  <Badge variant="success">
                    {recordTime.split(':').slice(0, 2).join(':') || 'Активная'}
                  </Badge>
                </div>
              </button>
            ) : (
              <div className="text-sm text-black/40">Пока нет записей</div>
            )}
          </div>
        </div>
        <WalletCard companyId={companyId} />
        {referralLink && (
          <div className="mt-8 rounded-ui-l bg-zinc-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-medium">Пригласить друга</p>
                <p className="mt-1 truncate text-sm text-black/40">
                  {referralLink}
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                rounded="full"
                size="icon"
                aria-label="Поделиться"
                onClick={shareReferralLink}
              >
                <Share2 className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
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
        <div className="mt-8">
          <p className="text-xl font-medium pt-3">Фотографии</p>
          {isLoading ? (
            <div className="pt-4 flex gap-3">
              {Array.from({length: 3}).map((_, index) => (
                <Skeleton
                  key={`photo-skeleton-${index}`}
                  className="h-[200px] w-[200px] rounded-ui-l"
                />
              ))}
            </div>
          ) : (
            <>
              <div
                ref={photosScrollRef}
                className="pt-4 overflow-x-auto hide-scrollbar -mx-4 p-4 mt-4"
                onScroll={updatePhotosScroll}
              >
                <div className="flex w-max gap-3 pr-4">
                  {(photos.length
                    ? photos
                    : [{id: 'placeholder', url: '/assets/atlazer-img.png'}]
                  ).map(photo => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      className="h-[200px] w-[200px] shrink-0 rounded-ui-l object-cover"
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                {photosScroll.isVisible && (
                  <div className="h-1 w-10 bg-black/10 rounded-full">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${photosScroll.thumbWidth}px`,
                        transform: `translateX(${photosScroll.thumbLeft}px)`,
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-8">
            <p className="text-xl font-medium pt-3 pb-4">Отзывы</p>
            {isLoading ? (
              <div className="flex flex-col gap-6">
                {Array.from({length: 2}).map((_, index) => (
                  <div key={`review-skeleton-${index}`} className="flex gap-3">
                    <Skeleton className="w-11 h-11 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length ? (
              reviews.map(review => (
                <div key={review.id} className="mb-8">
                  <div className="flex gap-3">
                    {review.author_photo?.url ? (
                      <img
                        src={review.author_photo.url}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-black rounded-full"></div>
                    )}
                    <div className="flex flex-col">
                      <p>{review.author}</p>
                      <p className="flex opacity-40 items-center gap-1 text-sm font-bold">
                        <StarIcon className="w-3 h-3 fill-black" />{' '}
                        {review.rating}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2">{review.text}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-black/40">Пока нет отзывов</div>
            )}
          </div>
        </div>
        <FixedActionBar variant="pill">
          <div className={cn('flex', showBookingCta && 'gap-1')}>
            <Button
              asChild
              variant="secondary"
              rounded="full"
              className="flex-1"
            >
              <a
                href={`tel:${primaryIntegration?.phone?.replace(/[\s-()]+/g, '')}`}
                onClick={() => {
                  if (primaryIntegration?.phone) {
                    window.open(
                      `tel:${primaryIntegration.phone.replace(/[\s-()]+/g, '')}`,
                    );
                  }
                }}
              >
                Позвонить
              </a>
            </Button>
            <div
              className={`min-w-1/2 flex-1 flex transition-all duration-300 ease-out origin-right ${
                showBookingCta
                  ? 'opacity-100 scale-x-100 max-w-[240px]'
                  : 'opacity-0 scale-x-0 max-w-0'
              }`}
            >
              <Button
                variant="primary"
                rounded="full"
                className={`transition-all duration-300 ease-out origin-right w-full ${
                  showBookingCta
                    ? 'opacity-100 scale-x-100 max-w-[240px]'
                    : 'opacity-0 scale-x-0 max-w-0'
                }`}
                onClick={() => navigate(`${basePath}/service`)}
              >
                Записаться
              </Button>
            </div>
          </div>
        </FixedActionBar>
      </Page.Content>
    </Page>
  );
}

function WalletCard({companyId}: {companyId?: string}) {
  const companyIdNumber = Number(companyId);
  const isEnabled = Boolean(companyIdNumber) && !Number.isNaN(companyIdNumber);
  const [amount, setAmount] = useState('100');

  const {
    data: wallet,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWalletPublicControllerBalance(
    {company_id: companyIdNumber},
    {query: {enabled: isEnabled}},
  );

  const {mutate: topup, isPending: isTopupPending} =
    useWalletPublicControllerTopup({
      mutation: {
        onSuccess: () => refetch(),
      },
    });

  const {mutate: spend, isPending: isSpendPending} =
    useWalletPublicControllerSpend({
      mutation: {
        onSuccess: () => refetch(),
      },
    });

  const numericAmount = Number(amount);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const isSubmitting = isTopupPending || isSpendPending;

  return (
    <div className="mt-8 rounded-ui-l bg-zinc-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-medium">Баллы</p>
          <p className="mt-1 text-sm text-black/40">
            Тестовый кошелек лояльности
          </p>
        </div>
        {(isLoading || isFetching) && (
          <Skeleton className="h-8 w-24 rounded-full" />
        )}
      </div>

      {!isLoading && (
        <div className="mt-4">
          <p className="text-4xl font-medium leading-none">
            {wallet?.points ?? 0}
          </p>
          <p className="mt-2 text-sm text-black/40">
            Баланс: {wallet?.balance ?? 0}
          </p>
        </div>
      )}

      {isError && (
        <p className="mt-3 text-sm text-red-500">
          Не удалось загрузить кошелек
        </p>
      )}

      <div className="mt-4">
        <Input
          inputMode="decimal"
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={event => setAmount(event.target.value)}
          placeholder="Сумма"
          className="h-12 bg-white pt-0 text-base"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          rounded="ui"
          disabled={!isEnabled || !isAmountValid || isSubmitting}
          onClick={() =>
            topup({
              data: {
                company_id: companyIdNumber,
                amount: numericAmount,
                title: 'Topup from miniapp',
              },
            })
          }
        >
          Пополнить
        </Button>
        <Button
          variant="secondary"
          rounded="ui"
          disabled={!isEnabled || !isAmountValid || isSubmitting}
          onClick={() =>
            spend({
              data: {
                company_id: companyIdNumber,
                amount: numericAmount,
                title: 'Spend from miniapp',
              },
            })
          }
        >
          Списать
        </Button>
      </div>
    </div>
  );
}

const ButtonBox = (props: PropsWithChildren<{onClick: VoidFunction}>) => {
  return (
    <button
      className="p-4 rounded-ui-l bg-gray-100 h-32 flex flex-col justify-between items-start"
      onClick={props.onClick}
    >
      <p className="font-medium text">{props.children}</p>
      <p className="rounded-full bg-white p-2">
        <ArrowUpRight className="h-6 w-6" />
      </p>
    </button>
  );
};
