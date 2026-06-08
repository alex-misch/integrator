import {MiniappBookingStatus} from '../miniapp/miniapp-booking.entity';
import {YClientRequest} from './yclients-webhook.types';

export function mapYclientsRecordPayloadToBookingStatus(
  payload: YClientRequest,
): MiniappBookingStatus | null {
  if (payload.resource !== 'record') {
    return null;
  }

  if (!['create', 'update', 'delete'].includes(payload.status ?? '')) {
    return null;
  }

  const data = payload.data;
  if (!data) {
    return null;
  }

  const attendance = data.visit_attendance ?? data.attendance;

  if (data.deleted === true || attendance === -1) {
    return MiniappBookingStatus.Canceled;
  }

  if (attendance === 1) {
    return MiniappBookingStatus.Completed;
  }

  if (attendance === 0 || attendance === 2) {
    return MiniappBookingStatus.Confirmed;
  }

  return null;
}

export function getYclientsRecordIdFromPayload(
  payload: YClientRequest,
): number | null {
  const value: unknown = payload.resource_id ?? payload.data?.id;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}
