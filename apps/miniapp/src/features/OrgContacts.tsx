import {useEffect, useRef} from 'react';
import {EarthIcon, PhoneIcon} from 'lucide-react';
import type ymaps from 'yandex-maps';
import {Telegram, WhatsApp} from '@/uikit/icons';

const YMAPS_API_KEY = import.meta.env.VITE_YMAPS_API_KEY;
const YMAPS_SCRIPT_ID = 'ymaps-script';
const YMAPS_LANG = 'ru_RU';
const DEFAULT_COORDS: [number, number] = [55.72878, 37.64296];

type YMapsApi = typeof ymaps;

const getYmaps = () => window.ymaps;

const loadYmaps = (): Promise<YMapsApi> => {
  const existingYmaps = getYmaps();
  if (existingYmaps) {
    return new Promise(resolve => {
      existingYmaps.ready(() => resolve(existingYmaps));
    });
  }

  const existingScript = document.getElementById(YMAPS_SCRIPT_ID);
  if (existingScript) {
    return new Promise(resolve => {
      const intervalId = window.setInterval(() => {
        const ymapsInstance = getYmaps();
        if (ymapsInstance) {
          window.clearInterval(intervalId);
          ymapsInstance.ready(() => resolve(ymapsInstance));
        }
      }, 50);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const apiKeyParam = YMAPS_API_KEY ? `apikey=${YMAPS_API_KEY}&` : '';
    script.id = YMAPS_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?${apiKeyParam}lang=${YMAPS_LANG}`;
    script.async = true;
    script.onload = () => {
      const ymapsInstance = getYmaps();
      if (!ymapsInstance) {
        reject(new Error('Yandex Maps API not available'));
        return;
      }
      ymapsInstance.ready(() => resolve(ymapsInstance));
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps API'));
    document.head.appendChild(script);
  });
};

type OrgContactsProps = {
  title?: string | null;
  address?: string | null;
  coords?: [number, number] | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  website?: string | null;
};

export function OrgContacts({
  title,
  address,
  coords,
  phone,
  whatsapp,
  telegram,
  website,
}: OrgContactsProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<ymaps.Map | null>(null);
  const mapCoords = coords ?? DEFAULT_COORDS;
  const placemarkTitle = title ?? 'Компания';
  const placemarkAddress = address ?? 'Адрес';

  useEffect(() => {
    let cancelled = false;

    if (!mapRef.current) {
      return () => {};
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    }

    loadYmaps()
      .then(ymapsApi => {
        if (
          cancelled ||
          !mapRef.current ||
          mapInstanceRef.current ||
          !ymapsApi?.Map
        ) {
          return;
        }

        const map = new ymapsApi.Map(
          mapRef.current,
          {
            center: mapCoords,
            zoom: 16,
            controls: [],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        const placemark = new ymapsApi.Placemark(
          mapCoords,
          {
            hintContent: placemarkTitle,
            balloonContent: placemarkAddress,
          },
          {
            preset: 'islands#redDotIcon',
          },
        );

        map.geoObjects.add(placemark);
        mapInstanceRef.current = map;
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.warn('Failed to initialize Yandex map', error);
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [mapCoords, placemarkTitle, placemarkAddress]);

  return (
    <div className="mt-8">
      <p className="text-xl font-medium pt-3">Контакты</p>
      <div className="pt-4 rounded-ui-l h-48 w-full relative">
        <div
          ref={mapRef}
          className="ymaps h-full w-full rounded-ui-l overflow-hidden bg-gray-100"
        />
        <button className="shadow-[0_4px_8px_rgba(0,0,0,0.06),0_0_4px_rgba(0,0,0,0.04)] text-xs absolute bottom-1 left-1 right-1 w-[calc(100%-8px)] px-3 py-2.5 bg-white text-left rounded-ui-m">
          {address || 'Адрес не указан'}
        </button>
      </div>
      <div className="mt-6">
        {phone && (
          <p className="flex items-center gap-2.5 py-1">
            <PhoneIcon className="h-[16px] w-[16px] fill-black" />
            {phone}
          </p>
        )}
        {whatsapp && (
          <p className="flex items-center gap-2.5 py-1">
            <WhatsApp className="h-[18px] w-[18px]" />
            {whatsapp}
          </p>
        )}
        {telegram && (
          <p className="flex items-center gap-2.5 py-1">
            <Telegram className="h-[18px] w-[18px]" /> {telegram}
          </p>
        )}
        {website && (
          <p className="flex items-center gap-2.5 py-1 text-blue-500">
            <EarthIcon className="h-[18px] w-[18px]" /> {website}
          </p>
        )}
      </div>
    </div>
  );
}
