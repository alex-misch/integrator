export type BookingParams = {
  service?: string;
  specialist?: string;
  date?: string;
  time?: string;
};

export const getBookingParams = (searchParams: URLSearchParams): BookingParams => {
  const service = searchParams.get('service') || undefined;
  const specialist = searchParams.get('specialist') || undefined;
  const date = searchParams.get('date') || undefined;
  const time = searchParams.get('time') || undefined;

  return {service, specialist, date, time};
};

export const toSearchParamsString = (params: BookingParams) => {
  const searchParams = new URLSearchParams();
  if (params.service) searchParams.set('service', params.service);
  if (params.specialist) searchParams.set('specialist', params.specialist);
  if (params.date) searchParams.set('date', params.date);
  if (params.time) searchParams.set('time', params.time);
  return searchParams.toString();
};

export const buildBookingUrl = (path: string, params: BookingParams) => {
  const query = toSearchParamsString(params);
  return query ? `${path}?${query}` : path;
};

export const getNextBookingRoute = (params: BookingParams, basePath: string) => {
  if (!params.service) return `${basePath}/service`;
  if (!params.specialist) return `${basePath}/stuff`;
  if (!params.date || !params.time) return `${basePath}/datetime`;
  return `${basePath}/booking`;
};
