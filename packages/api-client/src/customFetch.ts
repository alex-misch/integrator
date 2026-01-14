import {stringify} from 'qs';

export type ApiErrorType = {
  status: number;
  message?: string;
  body: {
    error: string;
    path: string;
    timestamp: string;
    message: {
      [key: string]: unknown;
      error: string;
      statusCode: number;
      message: string[];
    };
    statusCode: number;
  };
  statusText: string;
};

export interface ErrorType<T> extends Error {
  status: ApiErrorType['status'];
  body: T extends unknown ? ApiErrorType['body'] : T;
  statusText: ApiErrorType['statusText'];
}

export class _ErrorType extends Error {
  status: ApiErrorType['status'];
  body: ApiErrorType['body'];
  statusText: ApiErrorType['statusText'];

  constructor({status, body, statusText}: ApiErrorType) {
    super(
      'message' in body
        ? body.message.message?.toString() ||
            (body.message as unknown as string)
        : body,
    );
    this.status = status;
    this.body = body;
    this.statusText = statusText;
  }
}

let apiUrl: string;

export function configureApi(options: {apiUrl: string}) {
  apiUrl = options.apiUrl;
}

export async function customFetch<
  Response,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Params = any,
  RequestBody = unknown,
>({
  url,
  headers,
  data,
  params,
  ...props
}: Partial<Pick<Request, 'url' | 'method' | 'signal'>> & {
  data?: RequestBody;
  headers?: Record<string, string>;
  params?: Params;
}) {
  if (headers) delete headers['Content-Type'];

  const query = stringify(params);

  // try {
  const res = await fetch(apiUrl + url + (query ? `?${query}` : ''), {
    credentials: 'include',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: {
      ...(headers ?? {}),
      ...(data instanceof FormData ? {} : {'Content-Type': 'application/json'}),
    },
    ...props,
  });

  if (!res.ok) {
    throw new _ErrorType({
      status: res.status,
      body: await res.json(),
      statusText: res.statusText,
    });
  }

  return (await res.json()) as Response;
  // } catch (err) {
  //   toast('Fail to fetch', err.message);
  //   return null;
  // }

  // return handleDates(body);
}

// const isoDateFormat =
//   /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?$/;

// function isIsoDateString(value: unknown): boolean {
//   return value && typeof value === 'string' && isoDateFormat.test(value);
// }

// export function handleDates<T>(body: T): T {
//   if (body === null || body === undefined || typeof body !== 'object')
//     return body;

//   for (const key of Object.keys(body)) {
//     const value = body[key];
//     if (isIsoDateString(value)) {
//       body[key] = new Date(value);
//     } else if (typeof value === 'object') {
//       body[key] = handleDates(value);
//     }
//   }
//   return body;
// }
