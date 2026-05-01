import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {QueryFailedError, Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
import {YclientsEvent} from './yclients-event.entity';
import {YClientRequest} from './yclients-webhook.types';

type WebhookSaveResult =
  | {
      status: 'saved';
      event_id: number;
      event_name: string;
    }
  | {
      status: 'ignored';
      details: string;
    };

@Injectable()
export class YclientsEventsService {
  constructor(
    @InjectRepository(YclientsEvent)
    private readonly events: Repository<YclientsEvent>,
  ) {}

  async saveWebhookEvent(
    payload: YClientRequest | null,
  ): Promise<WebhookSaveResult> {
    if (!payload || typeof payload !== 'object') {
      return {status: 'ignored', details: 'empty_payload'};
    }

    const phone = normalizePhone(
      payload.data?.client?.phone == null
        ? null
        : String(payload.data.client.phone),
    );
    if (!phone) {
      return {status: 'ignored', details: 'client_phone_missing'};
    }

    const amount = this.toMoney(payload.data?.amount) ?? 0;
    const companyId =
      this.toInt(payload.data?.company_id) ?? this.toInt(payload.company_id);
    const eventName = this.resolveEventName(payload, amount);
    const resourceId =
      this.toInt(payload.resource_id) ?? this.toInt(payload.data?.id);

    try {
      const event = await this.events.save(
        this.events.create({
          phone,
          event_name: eventName,
          resource: payload.resource ?? null,
          resource_id: resourceId,
          status: payload.status ?? null,
          amount,
          company_id: companyId,
          processed: false,
          json: this.reducePayload(payload),
        }),
      );

      return {
        status: 'saved',
        event_id: event.id,
        event_name: event.event_name,
      };
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      const duplicate = await this.findExistingPayment(resourceId);
      if (!duplicate) {
        throw error;
      }

      return {
        status: 'saved',
        event_id: duplicate.id,
        event_name: duplicate.event_name,
      };
    }
  }

  private resolveEventName(payload: YClientRequest, amount: number) {
    if (this.isPaymentEvent(payload, amount)) {
      return 'payment';
    }

    if (payload.resource && payload.status) {
      return `${payload.resource}.${payload.status}`;
    }

    return payload.resource ?? 'unknown';
  }

  private isPaymentEvent(payload: YClientRequest, amount: number) {
    if (amount <= 0) {
      return false;
    }

    return (
      payload.resource === 'finances_operation' && payload.status === 'create'
    );
  }

  private reducePayload(payload: YClientRequest): Record<string, unknown> {
    return {
      company_id: payload.company_id ?? null,
      resource: payload.resource ?? null,
      resource_id: payload.resource_id ?? null,
      status: payload.status ?? null,
      data: {
        id: payload.data?.id ?? null,
        company_id: payload.data?.company_id ?? null,
        visit_id: payload.data?.visit_id ?? null,
        record_id: payload.data?.record_id ?? null,
        document_id: payload.data?.document_id ?? null,
        sold_item_id: payload.data?.sold_item_id ?? null,
        sold_item_type: payload.data?.sold_item_type ?? null,
        amount: payload.data?.amount ?? null,
        paid_full: payload.data?.paid_full ?? null,
        attendance: payload.data?.attendance ?? null,
        visit_attendance: payload.data?.visit_attendance ?? null,
        deleted: payload.data?.deleted ?? null,
        client: payload.data?.client
          ? {
              id: payload.data.client.id ?? null,
              name: payload.data.client.name ?? null,
              surname: payload.data.client.surname ?? null,
              display_name: payload.data.client.display_name ?? null,
              phone: payload.data.client.phone ?? null,
              email: payload.data.client.email ?? null,
            }
          : null,
      },
    };
  }

  private toInt(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  }

  private toMoney(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
  }

  private findExistingPayment(resourceId: number | null) {
    if (!resourceId) {
      return null;
    }

    return this.events.findOne({
      where: {
        resource_id: resourceId,
        event_name: 'payment',
      },
    });
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof QueryFailedError &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    );
  }
}
