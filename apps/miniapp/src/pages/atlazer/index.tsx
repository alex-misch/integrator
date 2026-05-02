import {Page} from '@/components/Layout/Page.tsx';
import {Badge} from '@/components/ui/badge';
import {FixedActionBar} from '@/components/Layout/FixedActionBar.tsx';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet';
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
  useMiniappsPublicControllerYclientsRecordsStatus,
  useWalletPublicControllerBalance,
} from '@integrator/api-client/public';
import {
  getStoredMiniappCompanyId,
  getMiniappBasePath,
  setStoredMiniappCompanyId,
  useMiniappParams,
} from '@/lib/miniapp';
import {openTelegramLink, shareURL} from '@telegram-apps/sdk-react';
import {ReviewsYclientsCompany} from './ReviewsYclientsCompany';

export function AtlazerPage() {
  const buttonsBlockRef = useRef<HTMLDivElement | null>(null);
  const photosScrollRef = useRef<HTMLDivElement | null>(null);
  const [photosScroll, setPhotosScroll] = useState({
    thumbWidth: 0,
    thumbLeft: 0,
    isVisible: false,
  });
  const [showBookingCta, setShowBookingCta] = useState(false);
  const [repeatBookingOpen, setRepeatBookingOpen] = useState(false);
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
  const {
    data: yclientsRecordsStatus,
    isLoading: isYclientsRecordsStatusLoading,
  } = useMiniappsPublicControllerYclientsRecordsStatus(slug, companyId, {
    query: {
      enabled: !!(slug && companyId) && !isBookingsLoading && !bookings.length,
    },
  });
  const {data: profile} = useCustomerPublicControllerProfile();
  const primaryIntegration = miniapp?.integration ?? null;
  const companies = miniapp?.companies ?? [];
  const selectedCompany =
    companies.find(item => String(item.id) === companyId) ?? companies[0];
  const primaryCompanyId =
    companies.find(company => company.is_primary)?.id ??
    primaryIntegration?.company_id ??
    selectedCompany?.id ??
    companyId;
  const title =
    miniapp?.public_title || miniapp?.title || miniapp?.name || 'Miniapp';
  const cityLabel =
    primaryIntegration?.city || primaryIntegration?.address_text || 'Город';
  const addressLabel = primaryIntegration?.address_text || 'Адрес не указан';
  const photos = miniapp?.photos ?? [];
  const reviews = miniapp?.reviews ?? [];
  const latestRecord = bookings[0];
  const hasAnyRecord = Boolean(
    latestRecord || yclientsRecordsStatus?.has_records,
  );
  const isCheckingRecords =
    isBookingsLoading || (!bookings.length && isYclientsRecordsStatusLoading);
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
  const storedCompanyId = slug ? getStoredMiniappCompanyId(slug) : undefined;
  const bookingStartPath = storedCompanyId
    ? `${getMiniappBasePath(slug, storedCompanyId)}/datetime`
    : `${basePath}/branch`;
  const managerUrl = 'https://t.me/etlaser_admin';

  const openManagerChat = () => {
    if (openTelegramLink) {
      openTelegramLink(managerUrl);
      return;
    }

    window.open(managerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBookingClick = () => {
    if (isCheckingRecords) {
      return;
    }

    if (hasAnyRecord) {
      setRepeatBookingOpen(true);
      return;
    }

    navigate(bookingStartPath);
  };

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
                      setStoredMiniappCompanyId(slug, nextCompanyId);
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
        <div ref={buttonsBlockRef} className="pt-3 pb-6">
          <ButtonBox onClick={handleBookingClick}>Записаться</ButtonBox>
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
        <WalletCard companyId={primaryCompanyId} />
        {referralLink && (
          <button
            type="button"
            className="mt-8 w-full overflow-hidden rounded-ui-l bg-[#dbeafe] text-left text-[#0f172a] shadow-[0_14px_34px_rgba(59,130,246,0.14)] transition active:scale-[0.99]"
            onClick={shareReferralLink}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700/60">
                    Реферальная программа
                  </p>
                  <p className="mt-1 text-2xl font-medium">Пригласить друга</p>
                  <p className="mt-2 text-sm leading-snug text-blue-900/55">
                    Вам - 5% от покупок друга <br />
                    другу - 3000 приветственных бонусов
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-blue-600">
                  <Share2 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4">
                <p className="truncate rounded-2xl bg-white/75 px-3 py-2 text-sm font-medium text-blue-700">
                  {referralLink}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center rounded-2xl bg-white/55 px-3 py-3">
                  <p className="text-3xl font-medium leading-none">
                    {profile?.referral_count ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-blue-700/60">приглашений</p>
                </div>
                <div className="flex flex-col items-center rounded-2xl bg-white/55 px-3 py-3">
                  <p className="text-3xl font-medium leading-none">
                    {formatRubles(profile?.referral_payments_amount ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-blue-700/60">с оплат</p>
                </div>
              </div>
            </div>
          </button>
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
        <div className="mt-8 pb-24">
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
              <>
                <ReviewsYclientsCompany slug={slug} companyId={companyId} />
                {reviews.map(review => (
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
                ))}
              </>
            ) : (
              <ReviewsYclientsCompany slug={slug} companyId={companyId} />
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
                onClick={handleBookingClick}
              >
                Записаться
              </Button>
            </div>
          </div>
        </FixedActionBar>

        <Sheet open={repeatBookingOpen} onOpenChange={setRepeatBookingOpen}>
          <SheetContent side="bottom">
            <SheetTitle className="text-2xl font-bold">
              Повторная запись
            </SheetTitle>
            <SheetDescription className="text-black/60 mt-2 text-center">
              Запись на повторные процедуры доступны через менеджера{' '}
              <button
                type="button"
                className="font-medium text-blue-600"
                onClick={openManagerChat}
              >
                @etlaser_admin
              </button>
            </SheetDescription>
            <SheetFooter className="mt-6">
              <Button
                type="button"
                variant="primary"
                size="lg"
                rounded="full"
                className="w-full"
                onClick={openManagerChat}
              >
                Написать менеджеру
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Page.Content>
    </Page>
  );
}

function WalletCard({companyId}: {companyId?: number | string}) {
  const companyIdNumber = Number(companyId);
  const isEnabled = Boolean(companyIdNumber) && !Number.isNaN(companyIdNumber);
  const {
    data: wallet,
    isLoading,
    isError,
  } = useWalletPublicControllerBalance(
    {company_id: companyIdNumber},
    {query: {enabled: isEnabled}},
  );
  const cardNumber = wallet?.card_number
    ? formatCardNumber(wallet.card_number)
    : '••••• ••••• •••••';
  const formattedBalance = formatRubles(wallet?.balance ?? 0);

  return (
    <div className="mt-8">
      <div className="relative aspect-[2.2] overflow-hidden rounded-ui-l bg-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
        {isLoading ? (
          <Skeleton className="h-full w-full bg-white/50" />
        ) : (
          <div className="p-5 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-white/50">
                  Карта лояльности
                </p>
                <p className="mt-1 text-lg font-medium">ATLazer</p>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase text-white/40">Номер карты</p>
                  <p className="mt-1 truncate font-mono text-sm">
                    {cardNumber}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-white/50">Баланс</p>
              <p className="mt-1 text-[42px] font-medium leading-none">
                {formattedBalance}
              </p>
            </div>
          </div>
        )}
      </div>

      {isError && (
        <p className="mt-3 text-sm text-red-500">
          Не удалось загрузить кошелек
        </p>
      )}
    </div>
  );
}

function formatRubles(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 15)
    .replace(/(.{5})/g, '$1 ')
    .trim();
}

const ButtonBox = (props: PropsWithChildren<{onClick: VoidFunction}>) => {
  return (
    <button
      className="w-full flex-1 p-4 rounded-ui-l bg-gray-100 h-32 flex flex-col justify-between items-start"
      onClick={props.onClick}
    >
      <p className="font-medium text">{props.children}</p>
      <p className="rounded-full bg-white p-2">
        <ArrowUpRight className="h-6 w-6" />
      </p>
    </button>
  );
};
