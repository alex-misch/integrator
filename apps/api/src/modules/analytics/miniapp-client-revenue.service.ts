import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
import {YClientRequest} from '../customer-loyalty/yclients-webhook.types';
import {YclientsEvent} from '../customer-loyalty/yclients-event.entity';
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
import {
  MiniappClientRevenue,
  MiniappClientRevenueStatus,
} from './miniapp-client-revenue.entity';
import {
  extractServiceTitle,
  getFallbackServiceTitle,
  getPaymentAmount,
  getSoldItemType,
  getYclientsClientId,
  getYclientsCompanyId,
  getYclientsFinanceOperationId,
  getYclientsRecordId,
  getYclientsVisitId,
  isCompletedYclientsRecord,
  isYclientsPayment,
  toInt,
} from './miniapp-client-revenue.mapper';

type MiniappAudience = {
  customerId: number | null;
  miniappSlug: string | null;
  companyId: number | null;
};

@Injectable()
export class MiniappClientRevenueService {
  constructor(
    @InjectRepository(MiniappClientRevenue)
    private readonly revenue: Repository<MiniappClientRevenue>,

    @InjectRepository(MiniappBooking)
    private readonly bookings: Repository<MiniappBooking>,
  ) {}

  async syncFromYclientsEvent(event: YclientsEvent, payload: YClientRequest) {
    if (isCompletedYclientsRecord(payload)) {
      await this.upsertVisitCompleted(event, payload);
      return;
    }

    if (isYclientsPayment(payload)) {
      await this.upsertPayment(event, payload);
    }
  }

  private async upsertVisitCompleted(
    event: YclientsEvent,
    payload: YClientRequest,
  ) {
    const audience = await this.resolveMiniappAudience(payload);
    if (!audience) {
      return;
    }

    const recordId = getYclientsRecordId(payload);
    if (!recordId) {
      return;
    }

    const normalizedPhone = this.getNormalizedPhone(payload) ?? event.phone;

    await this.revenue
      .createQueryBuilder()
      .insert()
      .into(MiniappClientRevenue)
      .values({
        customer_id: audience.customerId,
        yclients_client_id: getYclientsClientId(payload),
        phone: normalizedPhone,
        company_id: audience.companyId,
        miniapp_slug: audience.miniappSlug,
        yclients_record_id: recordId,
        yclients_visit_id: getYclientsVisitId(payload),
        yclients_event_id: event.id,
        source: 'visit',
        status: MiniappClientRevenueStatus.VisitCompleted,
        amount: null,
        happened_at: event.date_created,
        metadata: this.buildMetadata(event),
      })
      .onConflict(
        `("yclients_record_id") WHERE "yclients_record_id" IS NOT NULL AND "source" = 'visit' DO UPDATE SET
          "customer_id" = EXCLUDED."customer_id",
          "yclients_client_id" = EXCLUDED."yclients_client_id",
          "phone" = EXCLUDED."phone",
          "company_id" = EXCLUDED."company_id",
          "miniapp_slug" = EXCLUDED."miniapp_slug",
          "yclients_visit_id" = EXCLUDED."yclients_visit_id",
          "yclients_event_id" = EXCLUDED."yclients_event_id",
          "happened_at" = EXCLUDED."happened_at",
          "metadata" = EXCLUDED."metadata",
          "date_updated" = NOW()`,
      )
      .execute();
  }

  private async upsertPayment(event: YclientsEvent, payload: YClientRequest) {
    const audience = await this.resolveMiniappAudience(payload);
    if (!audience) {
      return;
    }

    const amount = getPaymentAmount(payload);
    const financeOperationId = getYclientsFinanceOperationId(payload);
    const recordId = getYclientsRecordId(payload);
    const soldItemId = toInt(payload.data?.sold_item_id);
    const soldItemType = getSoldItemType(payload);
    const serviceTitle =
      extractServiceTitle(payload) ??
      getFallbackServiceTitle(soldItemType, soldItemId);
    const normalizedPhone = this.getNormalizedPhone(payload) ?? event.phone;

    const values = {
      customer_id: audience.customerId,
      yclients_client_id: getYclientsClientId(payload),
      phone: normalizedPhone,
      company_id: audience.companyId,
      miniapp_slug: audience.miniappSlug,
      yclients_record_id: recordId,
      yclients_visit_id: getYclientsVisitId(payload),
      yclients_event_id: event.id,
      yclients_finance_operation_id: financeOperationId,
      document_id: toInt(payload.data?.document_id),
      sold_item_id: soldItemId,
      sold_item_type: soldItemType,
      service_title: serviceTitle,
      amount,
      source: 'payment' as const,
      status: MiniappClientRevenueStatus.PaymentReceived,
      happened_at: event.date_created,
      metadata: this.buildMetadata(event),
    };

    if (financeOperationId) {
      await this.revenue
        .createQueryBuilder()
        .insert()
        .into(MiniappClientRevenue)
        .values(values)
        .onConflict(
          `("yclients_finance_operation_id") WHERE "yclients_finance_operation_id" IS NOT NULL AND "source" = 'payment' DO UPDATE SET
            "customer_id" = EXCLUDED."customer_id",
            "yclients_client_id" = EXCLUDED."yclients_client_id",
            "phone" = EXCLUDED."phone",
            "company_id" = EXCLUDED."company_id",
            "miniapp_slug" = EXCLUDED."miniapp_slug",
            "yclients_record_id" = EXCLUDED."yclients_record_id",
            "yclients_visit_id" = EXCLUDED."yclients_visit_id",
            "yclients_event_id" = EXCLUDED."yclients_event_id",
            "document_id" = EXCLUDED."document_id",
            "sold_item_id" = EXCLUDED."sold_item_id",
            "sold_item_type" = EXCLUDED."sold_item_type",
            "service_title" = EXCLUDED."service_title",
            "amount" = EXCLUDED."amount",
            "happened_at" = EXCLUDED."happened_at",
            "metadata" = EXCLUDED."metadata",
            "date_updated" = NOW()`,
        )
        .execute();
      return;
    }

    const existing = await this.revenue.findOne({
      where: {
        source: 'payment',
        yclients_record_id: recordId,
        sold_item_id: soldItemId,
        amount,
        document_id: values.document_id,
      },
    });

    if (existing) {
      await this.revenue.update(existing.id, values);
      return;
    }

    await this.revenue.save(this.revenue.create(values));
  }

  private async resolveMiniappAudience(
    payload: YClientRequest,
  ): Promise<MiniappAudience | null> {
    const companyId = getYclientsCompanyId(payload);
    const recordId = getYclientsRecordId(payload);

    if (recordId) {
      const booking = await this.bookings.findOne({
        where: {yclients_record_id: recordId},
        relations: ['miniapp', 'customer'],
      });

      if (booking) {
        return {
          customerId: booking.customer?.id ?? null,
          miniappSlug: booking.miniapp?.slug ?? null,
          companyId,
        };
      }
    }

    return null;
  }

  private getNormalizedPhone(payload: YClientRequest) {
    return normalizePhone(
      payload.data?.client?.phone == null
        ? null
        : String(payload.data.client.phone),
    );
  }

  private buildMetadata(event: YclientsEvent) {
    return {
      yclients_event_name: event.event_name,
      yclients_status: event.status,
      raw_event_id: event.id,
    };
  }
}
