import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {QueryFailedError, Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
import {YclientsEvent} from './yclients-event.entity';
import {YClientRequest} from './yclients-webhook.types';
import {AnalyticsService} from '../analytics/analytics.service';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {SendpulseClient} from '../integrations/sendpulse/sendpulse-clients.entity';
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
import {
  getYclientsRecordIdFromPayload,
  mapYclientsRecordPayloadToBookingStatus,
} from './yclients-record-status';

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

type ReferredCustomerContext = {
  customer: TelegramCustomer;
  referrer: TelegramCustomer;
  referralCode: string;
};

@Injectable()
export class YclientsEventsService {
  constructor(
    @InjectRepository(YclientsEvent)
    private readonly events: Repository<YclientsEvent>,

    @InjectRepository(TelegramCustomer)
    private readonly customers: Repository<TelegramCustomer>,

    @InjectRepository(SendpulseClient)
    private readonly sendpulseClients: Repository<SendpulseClient>,

    @InjectRepository(MiniappBooking)
    private readonly bookings: Repository<MiniappBooking>,

    private readonly analytics: AnalyticsService,
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

      await this.syncMiniappBookingStatusFromYclients(payload);

      await this.recordAnalyticsEvent({
        payload,
        eventId: event.id,
        amount,
        phone,
        companyId,
        resourceId,
      });

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

      await this.syncMiniappBookingStatusFromYclients(payload);

      await this.recordAnalyticsEvent({
        payload,
        eventId: duplicate.id,
        amount,
        phone,
        companyId,
        resourceId,
      });

      return {
        status: 'saved',
        event_id: duplicate.id,
        event_name: duplicate.event_name,
      };
    }
  }

  private async syncMiniappBookingStatusFromYclients(payload: YClientRequest) {
    const nextStatus = mapYclientsRecordPayloadToBookingStatus(payload);
    if (!nextStatus) {
      return;
    }

    const recordId = getYclientsRecordIdFromPayload(payload);
    if (!recordId) {
      return;
    }

    await this.bookings.update(
      {yclients_record_id: recordId},
      {status: nextStatus},
    );
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

  private async recordAnalyticsEvent(props: {
    payload: YClientRequest;
    eventId: number;
    amount: number;
    phone: string;
    companyId: number | null;
    resourceId: number | null;
  }) {
    const eventName = this.resolveAnalyticsEventName(
      props.payload,
      props.amount,
    );
    if (!eventName) {
      return;
    }

    const referred = await this.findReferredCustomerByPhone(props.phone);
    if (!referred) {
      return;
    }

    await this.analytics.recordEventOnce({
      eventName,
      customerId: referred.customer.id,
      referrerCustomerId: referred.referrer.id,
      referralCode: referred.referralCode,
      phone: props.phone,
      amount: eventName === 'referral_payment' ? props.amount : null,
      serviceTitle:
        eventName === 'referral_payment'
          ? this.extractServiceTitle(props.payload)
          : null,
      resource: props.payload.resource ?? null,
      resourceId: props.resourceId,
      externalEventId: props.eventId,
      companyId: props.companyId,
      metadata: this.reduceAnalyticsPayload(props.payload),
    });
  }

  private resolveAnalyticsEventName(payload: YClientRequest, amount: number) {
    if (this.isBookEvent(payload)) {
      return 'referral_booking' as const;
    }

    if (this.isPaymentEvent(payload, amount)) {
      return 'referral_payment' as const;
    }

    return null;
  }

  private isBookEvent(payload: YClientRequest): boolean {
    const data = payload?.data;
    return (
      payload?.resource === 'record' &&
      ['update', 'create'].includes(payload?.status ?? '') &&
      (data?.visit_id ?? 0) > 0 &&
      (data?.attendance === 2 || data?.visit_attendance === 2)
    );
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

  private reduceAnalyticsPayload(
    payload: YClientRequest,
  ): Record<string, unknown> {
    return {
      resource: payload.resource ?? null,
      resource_id: payload.resource_id ?? null,
      status: payload.status ?? null,
      data: {
        id: payload.data?.id ?? null,
        record_id: payload.data?.record_id ?? null,
        visit_id: payload.data?.visit_id ?? null,
        amount: payload.data?.amount ?? null,
        client: payload.data?.client
          ? {
              id: payload.data.client.id ?? null,
              phone: payload.data.client.phone ?? null,
              name:
                payload.data.client.display_name ??
                [payload.data.client.name, payload.data.client.surname]
                  .filter(Boolean)
                  .join(' '),
            }
          : null,
      },
    };
  }

  private async findReferredCustomerByPhone(
    phone: string,
  ): Promise<ReferredCustomerContext | null> {
    const customers = await this.customers
      .createQueryBuilder('customer')
      .where('customer.phone IS NOT NULL')
      .getMany();

    const customer =
      customers.find(item => normalizePhone(item.phone) === phone) ?? null;
    if (!customer) {
      return null;
    }

    const referralCode =
      this.extractReferralCode(customer.start_param) ??
      (await this.findSendpulseReferrerCode(phone, customer.id));
    if (!referralCode) {
      return null;
    }

    const referrer = await this.customers.findOne({
      where: {referral_code: referralCode, is_blocked: false},
    });
    if (!referrer || String(referrer.id) === String(customer.id)) {
      return null;
    }

    return {customer, referrer, referralCode};
  }

  private async findSendpulseReferrerCode(phone: string, customerId: number) {
    const clients = await this.sendpulseClients
      .createQueryBuilder('client')
      .where('client.tg_referrer IS NOT NULL')
      .andWhere('client.phone IS NOT NULL')
      .orderBy('client.date_created', 'ASC')
      .getMany();

    const client = clients.find(item => normalizePhone(item.phone) === phone);
    if (!client?.tg_referrer) {
      return null;
    }

    if (
      client.telegram_id &&
      String(client.telegram_id) === String(customerId)
    ) {
      return null;
    }

    return client.tg_referrer;
  }

  private extractReferralCode(startParam?: string | null) {
    if (!startParam) {
      return null;
    }

    const match = String(startParam).match(/^tg_([a-z0-9_-]+)$/i);
    if (match?.[1]) {
      return match[1];
    }

    return /^[a-z0-9_-]+$/i.test(startParam) ? startParam : null;
  }

  private extractServiceTitle(payload: YClientRequest) {
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
      data?.goods_transactions?.[0]?.title ??
      data?.goods_transactions?.[0]?.name ??
      data?.title ??
      null
    );
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
