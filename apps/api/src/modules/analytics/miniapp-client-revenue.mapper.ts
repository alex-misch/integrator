import {YClientRequest} from '../customer-loyalty/yclients-webhook.types';
import {MiniappClientRevenueItemType} from './miniapp-client-revenue.entity';

export function isCompletedYclientsRecord(payload: YClientRequest) {
  if (payload.resource !== 'record') {
    return false;
  }

  const attendance = payload.data?.visit_attendance ?? payload.data?.attendance;

  return (
    ['create', 'update'].includes(payload.status ?? '') &&
    payload.data?.deleted !== true &&
    attendance === 1
  );
}

export function isYclientsPayment(payload: YClientRequest) {
  const amount = Number(payload.data?.amount ?? 0);

  return (
    payload.resource === 'finances_operation' &&
    ['create', 'update'].includes(payload.status ?? '') &&
    payload.data?.deleted !== true &&
    Number.isFinite(amount) &&
    amount > 0
  );
}

export function getYclientsRecordId(payload: YClientRequest) {
  if (payload.resource === 'record') {
    return toInt(payload.resource_id) ?? toInt(payload.data?.id);
  }

  return toInt(payload.data?.record_id);
}

export function getYclientsVisitId(payload: YClientRequest) {
  return toInt(payload.data?.visit_id);
}

export function getYclientsClientId(payload: YClientRequest) {
  return toInt(payload.data?.client?.id);
}

export function getYclientsFinanceOperationId(payload: YClientRequest) {
  if (payload.resource !== 'finances_operation') {
    return null;
  }

  return toInt(payload.resource_id) ?? toInt(payload.data?.id);
}

export function getYclientsCompanyId(payload: YClientRequest) {
  return toInt(payload.company_id) ?? toInt(payload.data?.company_id);
}

export function getPaymentAmount(payload: YClientRequest) {
  const amount = Number(payload.data?.amount ?? 0);
  return Number.isFinite(amount) ? amount : null;
}

export function extractServiceTitle(payload: YClientRequest) {
  const data = payload.data as
    | (YClientRequest['data'] & {
        title?: string;
        service_title?: string;
        service?: {title?: string; name?: string};
        services?: Array<{title?: string; name?: string}>;
        goods_transactions?: Array<{
          title?: string;
          name?: string;
          service?: {title?: string; name?: string};
        }>;
      })
    | null
    | undefined;

  return (
    data?.service_title ??
    data?.service?.title ??
    data?.service?.name ??
    data?.services?.[0]?.title ??
    data?.services?.[0]?.name ??
    data?.goods_transactions?.[0]?.service?.title ??
    data?.goods_transactions?.[0]?.service?.name ??
    data?.goods_transactions?.[0]?.title ??
    data?.goods_transactions?.[0]?.name ??
    data?.title ??
    null
  );
}

export function getSoldItemType(payload: YClientRequest) {
  const value = payload.data?.sold_item_type;
  if (value === MiniappClientRevenueItemType.Service) {
    return MiniappClientRevenueItemType.Service;
  }

  if (value === MiniappClientRevenueItemType.GoodsTransaction) {
    return MiniappClientRevenueItemType.GoodsTransaction;
  }

  return MiniappClientRevenueItemType.Unknown;
}

export function getFallbackServiceTitle(
  soldItemType: MiniappClientRevenueItemType,
  soldItemId: number | null,
) {
  if (!soldItemId) {
    return null;
  }

  if (soldItemType === MiniappClientRevenueItemType.GoodsTransaction) {
    return `Товар #${soldItemId}`;
  }

  return `Услуга #${soldItemId}`;
}

export function toInt(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}
