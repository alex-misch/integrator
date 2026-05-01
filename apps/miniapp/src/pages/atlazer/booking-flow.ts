export type BookingParams = {
  service?: string;
  specialist?: string;
  date?: string;
  time?: string;
  id?: string;
};

export const getBookingParams = (
  searchParams: URLSearchParams,
): BookingParams => {
  const service = searchParams.get('service') || undefined;
  const specialist = searchParams.get('specialist') || undefined;
  const date = searchParams.get('date') || undefined;
  const time = searchParams.get('time') || undefined;
  const id = searchParams.get('id') || undefined;

  return {service, specialist, date, time, id};
};

export const toSearchParamsString = (params: BookingParams) => {
  const searchParams = new URLSearchParams();
  if (params.service) searchParams.set('service', params.service);
  if (params.specialist) searchParams.set('specialist', params.specialist);
  if (params.date) searchParams.set('date', params.date);
  if (params.time) searchParams.set('time', params.time);
  if (params.id) searchParams.set('id', params.id);
  return searchParams.toString();
};

export const buildBookingUrl = (path: string, params: BookingParams) => {
  const query = toSearchParamsString(params);
  return query ? `${path}?${query}` : path;
};

export const getNextBookingRoute = (
  params: BookingParams,
  basePath: string,
) => {
  if (!params.date || !params.time) return `${basePath}/branch`;
  return `${basePath}/booking`;
};
