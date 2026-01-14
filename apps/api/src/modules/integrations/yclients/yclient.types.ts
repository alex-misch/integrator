// src/yclients/types.ts

export type IsoDate = string; // "2025-09-30"
export type IsoDateTime = string; // "2023-03-23T10:10:00+0300"

// --- common response envelopes ---
export interface YclientsSuccessResponse<TData, TMeta = unknown> {
  success: true;
  data: TData;
  meta: TMeta;
}

export interface YclientsFailResponse<TMeta = unknown> {
  success: false;
  meta: TMeta;
}

export type YclientsResponse<TData, TMeta = unknown> =
  | YclientsSuccessResponse<TData, TMeta>
  | YclientsFailResponse<TMeta>;

// встречается как [] или {} в разных методах (например companies/company)
export type MetaEmptyArray = unknown[];
export type MetaEmptyObject = Record<string, never>;
export type MetaAccepted = {message: string}; // "Accepted"

// --- ONLINE BOOKING (Онлайн-запись) ---
// /api/v1/book_services/{company_id}
export interface BookService {
  id: number;
  title: string;
  category_id: number;
  price_min: number;
  price_max: number;
  discount: number;
  comment: string;
  weight: number;
  active: number;
  sex: number;
  image: string;
  prepaid: 'forbidden' | string;
  seance_length: number; // seconds
  staff_ids?: number[];
  staff?: Array<{id: number}> | number[];
}
export interface BookCategory {
  id: number;
  title: string;
  sex: number;
  api_id: number;
  weight: number;
}
export interface BookServicesData {
  events: unknown[];
  services: BookService[];
  category: BookCategory[];
}
export type BookServicesResponse = YclientsSuccessResponse<
  BookServicesData,
  MetaEmptyArray
>;

// /api/v1/book_staff/{company_id}
export interface StaffPosition {
  id: number;
  title: string;
}
export interface BookStaffMember {
  id: string; // в примере "16"
  name: string;
  bookable: boolean;
  specialization: string;
  position: StaffPosition | []; // в примере бывает []
  show_rating: string; // в примере "1"
  rating: string;
  votes_count: string;
  avatar: string;
  hidden: boolean;
  fired: boolean;
  status: number;
  comments_count: string;
  weight: string;
  information: string;
  seance_date?: number;
  seances?: unknown[];
}
export type BookStaffResponse = YclientsSuccessResponse<
  BookStaffMember[],
  MetaEmptyArray
>;

// /api/v1/book_times/{company_id}/{staff_id}/{date}
export interface BookTimeSlot {
  time: string; // "17:30"
  seance_length: number; // seconds
  datetime: IsoDateTime; // ISO8601 (нужно передавать при создании записи)
}
export type BookTimesResponse = YclientsSuccessResponse<
  BookTimeSlot[],
  MetaEmptyArray
>;

// /api/v1/book_record/{company_id}
export interface BookRecordRequest {
  staff_id?: number;
  services: Array<{id: number}>;
  datetime: string;
  fullname: string;
  phone: string;
  email?: string;
  comment?: string;
}

export interface BookRecordResponseData {
  id?: number;
  record_id?: number;
  client_id?: number;
  client?: {id: number};
}

export type BookRecordResponse = YclientsSuccessResponse<
  BookRecordResponseData,
  MetaEmptyObject
>;

// --- COMPANIES ---
// /api/v1/companies
export interface CompanyListItem {
  id: number;
  title: string;
  short_descr: string;
  logo: string;
  active: string;
  phone: string;
  country_id: number;
  schedule: string;
  country: string;
  city_id: number;
  city: string;
  timezone_name: string;
  address: string;
  coordinate_lat: number;
  coordinate_lon: number;
  phone_confirmation: boolean;
  active_staff_count: number;
  next_slot?: IsoDateTime; // только если forBooking=1
  app_ios: string;
  app_android: string;
  currency_short_title: string;
  group_priority: number;
}
export type CompaniesResponse = YclientsSuccessResponse<
  CompanyListItem[],
  MetaEmptyObject
>;

// /api/v1/company/{id}/  (детали)
export interface CompanyBookform {
  id: number;
  title: string;
  is_default: number;
  url: string;
}
export interface CompanyGroup {
  id: number;
  title: string;
}
export interface CompanyDetails {
  id: number;
  title: string;
  public_title?: string;
  country_id: number;
  country: string;
  country_iso?: string;
  city_id: number;
  city: string;
  active?: number;
  phone?: string;
  phones?: string[];
  email?: string;
  timezone?: number;
  timezone_name: string;
  schedule?: string;
  address: string;
  zip: number;
  coordinate_lat: number;
  coordinate_lon: number;
  short_descr: string;
  logo?: string;
  currency_short_title?: string;
  social: {
    facebook: string;
    vk: string;
    instagram: string;
    telegram: string;
    whatsapp: string;
    viber: string;
  };
  site: string;
  business_type_id: number;
  description: string;
  phone_confirmation: boolean;
  active_staff_count: number;
  next_slot?: IsoDateTime;
  group_priority: number;
  push_notification_phone_confirm?: number;
  main_group_id?: number;
  main_group?: CompanyGroup;
  groups?: Record<string, CompanyGroup>;
  bookforms?: CompanyBookform[];
  online_sales_form_url?: string;
  access?: Record<string, unknown>;
}
export type CompanyResponse = YclientsSuccessResponse<
  CompanyDetails,
  MetaEmptyObject
>;

// --- RECORDS (Журнал/записи) ---
// /api/v1/records/{company_id}  (типов там много; ниже — “безопасный минимум”, который точно есть в корне)
export interface RecordsListItem {
  id: number;
  company_id: number;
  staff_id: number;
  services: Array<{
    id: number;
    title: string;
    cost: number;
    manual_cost: number;
    cost_per_unit: number;
    discount: number;
    first_cost: number;
    amount: number;
  }>;
  // в ответе есть ещё goods_transactions/finance_transactions и т.п.
  [k: string]: unknown;
}
export type RecordsResponse = YclientsSuccessResponse<
  RecordsListItem[],
  MetaEmptyArray
>;

// --- OPTIONS ---
export interface YclientsOptions {
  baseUrl: string;
  partnerToken: string;
  userToken?: string;
  accept: string;
}

// --- BOOK STAFF SEANCES ---
// GET /api/v1/book_staff_seances/{company_id}/{staff_id}/ :contentReference[oaicite:4]{index=4}

export interface BookStaffSeanceSlot {
  time: string;
  seance_length: number;
  datetime: string; // format date-time :contentReference[oaicite:5]{index=5}
}

export interface BookStaffSeancesData {
  seance_date: string; // format date :contentReference[oaicite:6]{index=6}
  seances: BookStaffSeanceSlot[];
}

export type BookStaffSeancesResponse = YclientsSuccessResponse<
  BookStaffSeancesData,
  MetaEmptyArray
>;
