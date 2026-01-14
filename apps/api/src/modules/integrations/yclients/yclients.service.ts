import {Injectable, UnauthorizedException} from '@nestjs/common';
import type {
  BookServicesResponse,
  BookStaffResponse,
  BookTimesResponse,
  BookRecordResponse,
  BookRecordRequest,
  CompaniesResponse,
  CompanyResponse,
  RecordsResponse,
  YclientsOptions,
  YclientsResponse,
  MetaAccepted,
  IsoDate,
  BookStaffSeancesResponse,
} from './yclient.types';
import {ConfigService} from '@nestjs/config';

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;
type QueryParams = Record<string, QueryValue>;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

@Injectable()
export class YclientsClient {
  private readonly options: YclientsOptions;

  constructor(private readonly cfg: ConfigService) {
    this.options = {
      baseUrl: cfg.getOrThrow<string>('YCLIENTS_BASE_URL'),
      partnerToken: cfg.getOrThrow<string>('YCLIENTS_PARTNER_TOKEN'),
      userToken: cfg.getOrThrow<string>('YCLIENTS_USER_TOKEN'),
      accept:
        cfg.get<string>('YCLIENTS_ACCEPT') ??
        'application/vnd.yclients.v2+json',
    };
  }

  // --- helpers ---
  private ц(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.options.baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private headers(): HeadersInit {
    const {partnerToken, userToken, accept} = this.options;

    if (!userToken)
      throw new Error(
        'Missing env: YCLIENTS_USER_TOKEN (required for this method)',
      );

    return {
      Accept: accept,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${partnerToken}, User ${userToken}`,
    };
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(path, this.options.baseUrl);

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;

        if (Array.isArray(v)) {
          for (const item of v) {
            url.searchParams.append(k, String(item));
          }
        } else {
          url.searchParams.set(k, String(v));
        }
      }
    }

    return url.toString();
  }

  private async request<TData, TMeta = unknown>(
    method: HttpMethod,
    path: string,
    opts?: {
      query?: QueryParams;
      body?: unknown;
    },
  ): Promise<YclientsResponse<TData, TMeta>> {
    const url = this.buildUrl(path, opts?.query);
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();
    const json = (text ? JSON.parse(text) : null) as YclientsResponse<
      TData,
      TMeta
    >;

    // если API вернул не-2xx, но тело читаемое — пробрасываем как ошибку
    if (!res.ok) {
      if (res.status === 403) throw new UnauthorizedException();
      throw new Error(`YCLIENTS HTTP ${res.status}: ${text}`);
    }
    return json;
  }

  private unwrap<TData, TMeta>(
    r: YclientsResponse<TData, TMeta>,
    ctx: string,
  ): {data: TData; meta: TMeta} {
    if (!r.success) {
      throw new Error(`YCLIENTS ${ctx} failed: ${JSON.stringify(r.meta)}`);
    }

    return {data: r.data, meta: r.meta};
  }

  // ------------------------------------------------------------
  // ONLINE BOOKING (Онлайн-запись)
  // ------------------------------------------------------------

  /** Список услуг доступных для бронирования (/api/v1/book_services/{company_id}) :contentReference[oaicite:23]{index=23} */

  async bookServices(
    companyId: number,
    query?: {
      staffId?: number;
      datetime?: string;
      serviceIds?: number[];
    },
  ): Promise<BookServicesResponse['data']> {
    const r = await this.request<
      BookServicesResponse['data'],
      BookServicesResponse['meta']
    >('GET', `/api/v1/book_services/${companyId}`, {
      query: {
        staff_id: query?.staffId,
        datetime: query?.datetime,
        'service_ids[]': query?.serviceIds,
      },
    });

    return this.unwrap(r, 'bookServices').data;
  }

  async bookStaff(
    companyId: number,
    query?: {
      serviceIds?: number[];
      datetime?: string; // как в спеке
    },
  ): Promise<BookStaffResponse['data']> {
    const r = await this.request<
      BookStaffResponse['data'],
      BookStaffResponse['meta']
    >('GET', `/api/v1/book_staff/${companyId}`, {
      query: {
        datetime: query?.datetime,
        'service_ids[]': query?.serviceIds, // массив -> append
      },
    });

    return this.unwrap(r, 'bookStaff').data;
  }

  /** Список сеансов доступных для бронирования (/api/v1/book_times/{company_id}/{staff_id}/{date}) :contentReference[oaicite:25]{index=25} */
  async bookTimes(params: {
    companyId: number;
    staffId: number;
    date: IsoDate; // YYYY-MM-DD
    serviceIds?: number[]; // service_ids[]=123&service_ids[]=234 :contentReference[oaicite:26]{index=26}
  }): Promise<BookTimesResponse['data']> {
    const {companyId, staffId, date, serviceIds} = params;

    // const query: Record<string, string> = {};
    // fetch не умеет массивы как axios params — соберём вручную через URLSearchParams:
    // сделаем это простым способом: добавим их прямо в path через query string ниже
    const baseUrl = this.ц(
      `/api/v1/book_times/${companyId}/${staffId}/${date}`,
    );
    const url = new URL(baseUrl);

    if (serviceIds?.length) {
      for (const id of serviceIds)
        url.searchParams.append('service_ids[]', String(id));
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(),
    });
    const text = await res.text();
    const json = JSON.parse(text) as BookTimesResponse;

    if (!res.ok) {
      if (res.status === 403) {
        throw new UnauthorizedException();
      } else {
        throw new Error(`YCLIENTS HTTP ${res.status}: ${text}`);
      }
    }
    if (!json.success)
      throw new Error(
        `YCLIENTS bookTimes failed: ${JSON.stringify(json.meta)}`,
      );
    return json.data;
  }

  async bookStaffSeances(
    params: {companyId: number; staffId: number},
    query?: {serviceIds?: number[]},
  ): Promise<BookStaffSeancesResponse['data']> {
    const r = await this.request<
      BookStaffSeancesResponse['data'],
      BookStaffSeancesResponse['meta']
    >(
      'GET',
      `/api/v1/book_staff_seances/${params.companyId}/${params.staffId}/`,
      {
        query: {
          'service_ids[]': query?.serviceIds,
        },
      },
    );

    return this.unwrap(r, 'bookStaffSeances').data;
  }

  /** Создание записи (/api/v1/book_record/{company_id}) */
  async bookRecord(
    companyId: number,
    body: BookRecordRequest,
  ): Promise<BookRecordResponse['data']> {
    const r = await this.request<
      BookRecordResponse['data'],
      BookRecordResponse['meta']
    >('POST', `/api/v1/book_record/${companyId}`, {body});
    return this.unwrap(r, 'bookRecord').data;
  }

  // ------------------------------------------------------------
  // RECORDS (Записи по клиентам)
  // ------------------------------------------------------------

  /** Список записей (/api/v1/records/{company_id}) — фильтруй по client_id и датам :contentReference[oaicite:27]{index=27} */
  async recordsByClient(params: {
    companyId: number;
    clientId?: number;
    startDate?: IsoDate;
    endDate?: IsoDate;
  }): Promise<RecordsResponse['data']> {
    const {companyId, clientId, startDate, endDate} = params;

    const r = await this.request<
      RecordsResponse['data'],
      RecordsResponse['meta']
    >('GET', `/api/v1/records/${companyId}`, {
      query: {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
      },
    });

    return this.unwrap(r, 'recordsByClient').data;
  }

  // ------------------------------------------------------------
  // COMPANIES (Данные о компании)
  // ------------------------------------------------------------

  /** Список компаний (/api/v1/companies) :contentReference[oaicite:28]{index=28} */
  async companies(params?: {
    forBooking?: 0 | 1;
    count?: number;
    page?: number;
  }): Promise<CompaniesResponse['data']> {
    const r = await this.request<
      CompaniesResponse['data'],
      CompaniesResponse['meta']
    >('GET', `/api/v1/companies`, {query: params});
    return this.unwrap(r, 'companies').data;
  }

  /** Компания (детали) (/api/v1/company/{id}/) :contentReference[oaicite:29]{index=29} */
  async company(
    id: number,
    params?: {
      my?: 0 | 1;
      forBooking?: 0 | 1;
      show_groups?: 0 | 1;
      showBookforms?: 0 | 1;
    },
  ): Promise<CompanyResponse['data']> {
    const r = await this.request<
      CompanyResponse['data'],
      CompanyResponse['meta']
    >('GET', `/api/v1/company/${id}/`, {query: params});
    return this.unwrap(r, 'company').data;
  }

  // ------------------------------------------------------------
  // BOOKING USER: update user info/password (202 Accepted / 200 OK)
  // ------------------------------------------------------------

  /** PUT /api/v1/booking/user → 202 Accepted с meta.message="Accepted" :contentReference[oaicite:30]{index=30} */
  async bookingUserUpdate(
    body: Record<string, unknown>,
  ): Promise<MetaAccepted> {
    const r = await this.request<null, MetaAccepted>(
      'PUT',
      `/api/v1/booking/user`,
      {body},
    );
    if (!r.success)
      throw new Error(
        `YCLIENTS bookingUserUpdate failed: ${JSON.stringify(r.meta)}`,
      );
    return r.meta;
  }
}
