import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Between, Repository} from 'typeorm';
import {AnalyticsEvent, AnalyticsEventName} from './analytics-event.entity';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {LoyaltyTransaction} from '../customer-loyalty/loyalty-transaction.entity';
import {YclientsEvent} from '../customer-loyalty/yclients-event.entity';
import {
  MiniappBooking,
  MiniappBookingStatus,
} from '../miniapp/miniapp-booking.entity';
import {MiniappClientRevenue} from './miniapp-client-revenue.entity';

export type DashboardPeriod = '7d' | '30d' | '3m';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly events: Repository<AnalyticsEvent>,

    @InjectRepository(TelegramCustomer)
    private readonly customers: Repository<TelegramCustomer>,

    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactions: Repository<LoyaltyTransaction>,

    @InjectRepository(MiniappBooking)
    private readonly bookings: Repository<MiniappBooking>,

    @InjectRepository(MiniappClientRevenue)
    private readonly miniappRevenue: Repository<MiniappClientRevenue>,
  ) {}

  async recordVisit(props: {
    customer: TelegramCustomer;
    companyId?: number | null;
    miniappSlug?: string | null;
  }) {
    await this.events.save(
      this.events.create({
        event_name: 'visit',
        customer_id: String(props.customer.id),
        company_id: props.companyId ?? null,
        miniapp_slug: props.miniappSlug ?? null,
      }),
    );

    await this.recordReferralOpen(props.customer, {
      companyId: props.companyId,
      miniappSlug: props.miniappSlug,
    });
  }

  async recordPublicEvent(props: {
    eventName: AnalyticsEventName;
    customer?: TelegramCustomer | null;
    companyId?: number | null;
    miniappSlug?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    await this.events.save(
      this.events.create({
        event_name: props.eventName,
        customer_id: props.customer ? String(props.customer.id) : null,
        company_id: props.companyId ?? null,
        miniapp_slug: props.miniappSlug ?? null,
        metadata: props.metadata ?? null,
      }),
    );
  }

  async recordEventOnce(props: {
    eventName: AnalyticsEventName;
    customerId?: number | string | null;
    referrerCustomerId?: number | string | null;
    referralCode?: string | null;
    phone?: string | null;
    amount?: number | null;
    serviceTitle?: string | null;
    resource?: string | null;
    resourceId?: number | null;
    externalEventId?: number | string | null;
    companyId?: number | null;
    miniappSlug?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    if (props.resourceId) {
      const duplicate = await this.events.findOne({
        where: {
          event_name: props.eventName,
          resource_id: props.resourceId,
        },
      });
      if (duplicate) {
        return;
      }
    }

    await this.events.save(
      this.events.create({
        event_name: props.eventName,
        customer_id: props.customerId == null ? null : String(props.customerId),
        referrer_customer_id:
          props.referrerCustomerId == null
            ? null
            : String(props.referrerCustomerId),
        referral_code: props.referralCode ?? null,
        phone: props.phone ?? null,
        amount: props.amount ?? null,
        service_title: props.serviceTitle ?? null,
        resource: props.resource ?? null,
        resource_id: props.resourceId ?? null,
        external_event_id:
          props.externalEventId == null ? null : String(props.externalEventId),
        company_id: props.companyId ?? null,
        miniapp_slug: props.miniappSlug ?? null,
        metadata: props.metadata ?? null,
      }),
    );
  }

  async getDashboard(period: DashboardPeriod = '7d') {
    const range = this.getDateRange(period);
    const [
      totalCustomers,
      referralShares,
      referralOpenTotal,
      referralBookingTotal,
      miniappBookings,
    ] = await Promise.all([
      this.customers.count(),
      this.countEvents('referral_share'),
      this.countWelcomeReferralTransactions(),
      this.countReferralTransactions(),
      this.getMiniappBookingStats(range.start, range.end),
    ]);

    const [visitsByDay, referralsByDay, bookingsByDay, paymentsByDay] =
      await Promise.all([
        this.countByDay('visit', range.start, range.end),
        this.welcomeReferralTransactionsByDay(range.start, range.end),
        this.referralTransactionsByDay(range.start, range.end),
        this.miniappClientPaymentsByDay(range.start, range.end),
      ]);

    const [paymentTotal, paymentServices] = await Promise.all([
      this.sumMiniappClientPayments(range.start, range.end),
      this.miniappClientRevenueServices(range.start, range.end),
    ]);

    return {
      project: {slug: 'etlazer', name: 'ET Laser'},
      period,
      range: {
        from: this.formatDate(range.start),
        to: this.formatDate(range.end),
      },
      totals: {
        unique_customers: totalCustomers,
        referral_shares: referralShares,
        referral_opens_total: referralOpenTotal,
        referral_bookings_total: referralBookingTotal,
        miniapp_bookings_total: miniappBookings.total,
        miniapp_bookings_completed: miniappBookings.completed,
        miniapp_bookings_canceled: miniappBookings.canceled,
        miniapp_payments_amount: paymentTotal,
        referral_payments_amount: paymentTotal,
      },
      series: this.buildSeries(range.start, range.days, {
        visits: visitsByDay,
        referral_opens: referralsByDay,
        referral_bookings: bookingsByDay,
        referral_payments: paymentsByDay,
        miniapp_payments: paymentsByDay,
      }),
      payment_services: paymentServices,
    };
  }

  private async recordReferralOpen(
    customer: TelegramCustomer,
    props: {companyId?: number | null; miniappSlug?: string | null},
  ) {
    const referralCode = this.extractReferralCode(customer.start_param);
    if (!referralCode) {
      return;
    }

    const referrer = await this.customers.findOne({
      where: {referral_code: referralCode, is_blocked: false},
    });
    if (!referrer || String(referrer.id) === String(customer.id)) {
      return;
    }

    const existing = await this.events.findOne({
      where: {
        event_name: 'referral_open',
        customer_id: String(customer.id),
        referral_code: referralCode,
      },
    });
    if (existing) {
      return;
    }

    await this.events.save(
      this.events.create({
        event_name: 'referral_open',
        customer_id: String(customer.id),
        referrer_customer_id: String(referrer.id),
        referral_code: referralCode,
        company_id: props.companyId ?? null,
        miniapp_slug: props.miniappSlug ?? null,
      }),
    );
  }

  private countEvents(eventName: AnalyticsEventName) {
    return this.events.count({where: {event_name: eventName}});
  }

  private async countByDay(
    eventName: AnalyticsEventName,
    start: Date,
    end: Date,
  ) {
    const rows = await this.events
      .createQueryBuilder('event')
      .select(
        `to_char(date_trunc('day', event.date_created), 'YYYY-MM-DD')`,
        'day',
      )
      .addSelect('COUNT(*)', 'value')
      .where({event_name: eventName, date_created: Between(start, end)})
      .groupBy(`date_trunc('day', event.date_created)`)
      .orderBy(`date_trunc('day', event.date_created)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private buildSeries(
    start: Date,
    days: number,
    maps: Record<string, Map<string, number>>,
  ) {
    return Array.from({length: days}, (_, index) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + index);
      const key = this.formatDate(day);

      return {
        date: key,
        visits: maps.visits.get(key) ?? 0,
        referral_opens: maps.referral_opens.get(key) ?? 0,
        referral_bookings: maps.referral_bookings.get(key) ?? 0,
        referral_payments: maps.referral_payments.get(key) ?? 0,
        miniapp_payments: maps.miniapp_payments.get(key) ?? 0,
      };
    });
  }

  private getDateRange(period: DashboardPeriod) {
    const days = period === '3m' ? 90 : period === '30d' ? 30 : 7;
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - days + 1);
    start.setUTCHours(0, 0, 0, 0);
    return {start, end, days};
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

  private welcomeReferralTransactionsQuery() {
    return this.loyaltyTransactions
      .createQueryBuilder('transaction')
      .where('transaction.source = :source', {
        source: 'welcome_referral_bonus',
      });
  }

  private async countWelcomeReferralTransactions() {
    return this.welcomeReferralTransactionsQuery().getCount();
  }

  private async welcomeReferralTransactionsByDay(start: Date, end: Date) {
    const rows = await this.welcomeReferralTransactionsQuery()
      .select(
        `to_char(date_trunc('day', transaction.date_created), 'YYYY-MM-DD')`,
        'day',
      )
      .addSelect('COUNT(*)', 'value')
      .andWhere('transaction.date_created BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`date_trunc('day', transaction.date_created)`)
      .orderBy(`date_trunc('day', transaction.date_created)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private referralTransactionsQuery() {
    return this.loyaltyTransactions
      .createQueryBuilder('transaction')
      .where('transaction.source = :source', {
        source: 'referral_payment_bonus',
      })
      .andWhere('transaction.referred_client_record_id IS NOT NULL');
  }

  private async countReferralTransactions() {
    return this.referralTransactionsQuery().getCount();
  }

  private async getMiniappBookingStats(start: Date, end: Date) {
    const result = await this.bookings
      .createQueryBuilder('booking')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE booking.status = :completed)`,
        'completed',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE booking.status = :canceled)`,
        'canceled',
      )
      .where('booking.date_created BETWEEN :start AND :end', {start, end})
      .setParameters({
        completed: MiniappBookingStatus.Completed,
        canceled: MiniappBookingStatus.Canceled,
      })
      .getRawOne<{
        total: string;
        completed: string;
        canceled: string;
      }>();

    return {
      total: Number(result?.total ?? 0),
      completed: Number(result?.completed ?? 0),
      canceled: Number(result?.canceled ?? 0),
    };
  }

  private async referralTransactionsByDay(start: Date, end: Date) {
    const rows = await this.referralTransactionsQuery()
      .select(
        `to_char(date_trunc('day', transaction.date_created), 'YYYY-MM-DD')`,
        'day',
      )
      .addSelect('COUNT(*)', 'value')
      .andWhere('transaction.date_created BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`date_trunc('day', transaction.date_created)`)
      .orderBy(`date_trunc('day', transaction.date_created)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private async miniappClientPaymentsByDay(start: Date, end: Date) {
    const rows = await this.miniappRevenue
      .createQueryBuilder('revenue')
      .select(
        `to_char(date_trunc('day', revenue.happened_at), 'YYYY-MM-DD')`,
        'day',
      )
      .addSelect('COALESCE(SUM(revenue.amount), 0)', 'value')
      .where('revenue.source = :source', {source: 'payment'})
      .andWhere('revenue.amount IS NOT NULL')
      .andWhere('revenue.happened_at BETWEEN :start AND :end', {start, end})
      .groupBy(`date_trunc('day', revenue.happened_at)`)
      .orderBy(`date_trunc('day', revenue.happened_at)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private async referralTransactionPaymentsByDay(start: Date, end: Date) {
    const rows = await this.referralTransactionsQuery()
      .select(
        `to_char(date_trunc('day', transaction.date_created), 'YYYY-MM-DD')`,
        'day',
      )
      .addSelect('COALESCE(SUM(transaction.purchase_amount), 0)', 'value')
      .andWhere('transaction.date_created BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`date_trunc('day', transaction.date_created)`)
      .orderBy(`date_trunc('day', transaction.date_created)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private async sumReferralTransactionPayments(start: Date, end: Date) {
    const result = await this.referralTransactionsQuery()
      .select('COALESCE(SUM(transaction.purchase_amount), 0)', 'total')
      .andWhere('transaction.date_created BETWEEN :start AND :end', {
        start,
        end,
      })
      .getRawOne<{total: string}>();

    return Number(result?.total ?? 0);
  }

  private async sumMiniappClientPayments(start: Date, end: Date) {
    const result = await this.miniappRevenue
      .createQueryBuilder('revenue')
      .select('COALESCE(SUM(revenue.amount), 0)', 'total')
      .where('revenue.source = :source', {source: 'payment'})
      .andWhere('revenue.amount IS NOT NULL')
      .andWhere('revenue.happened_at BETWEEN :start AND :end', {start, end})
      .getRawOne<{total: string}>();

    return Number(result?.total ?? 0);
  }

  private async referralTransactionServices(start: Date, end: Date) {
    const rows = await this.referralTransactionsQuery()
      .select('transaction.id', 'id')
      .addSelect(
        `
          COALESCE(
            transaction.metadata->>'service_title',
            event.json->'data'->>'service_title',
            event.json->'data'->'service'->>'title',
            event.json->'data'->'service'->>'name',
            event.json->'data'->'services'->0->>'title',
            event.json->'data'->'services'->0->>'name',
            event.json->'data'->'goods_transactions'->0->'service'->>'title',
            event.json->'data'->'goods_transactions'->0->>'title',
            event.json->'data'->'goods_transactions'->0->>'name',
            event.json->'data'->>'title'
          )
        `,
        'service_title',
      )
      .addSelect('transaction.purchase_amount', 'amount')
      .addSelect('transaction.date_created', 'date_created')
      .leftJoin(
        YclientsEvent,
        'event',
        'event.id = transaction.yclients_event_id',
      )
      .andWhere('transaction.date_created BETWEEN :start AND :end', {
        start,
        end,
      })
      .orderBy('transaction.date_created', 'DESC')
      .take(8)
      .getRawMany<{
        id: string;
        service_title: string | null;
        amount: string | null;
        date_created: Date;
      }>();

    return rows.map(row => ({
      id: Number(row.id),
      service_title: row.service_title,
      amount: row.amount == null ? null : Number(row.amount),
      date_created: row.date_created,
    }));
  }

  private async miniappClientRevenueServices(start: Date, end: Date) {
    const rows = await this.miniappRevenue
      .createQueryBuilder('revenue')
      .select('revenue.id', 'id')
      .addSelect(
        `
          COALESCE(
            revenue.service_title,
            CASE
              WHEN revenue.sold_item_id IS NOT NULL AND revenue.sold_item_type = 'goods_transaction'
                THEN CONCAT('Товар #', revenue.sold_item_id::text)
              WHEN revenue.sold_item_id IS NOT NULL
                THEN CONCAT('Услуга #', revenue.sold_item_id::text)
              ELSE NULL
            END
          )
        `,
        'service_title',
      )
      .addSelect('revenue.amount', 'amount')
      .addSelect('revenue.happened_at', 'date_created')
      .addSelect('revenue.customer_id', 'customer_id')
      .addSelect('customer.username', 'customer_username')
      .addSelect('COALESCE(customer.phone, revenue.phone)', 'customer_phone')
      .addSelect('booking.date', 'booking_date')
      .addSelect('booking.time', 'booking_time')
      .leftJoin(
        TelegramCustomer,
        'customer',
        'customer.id = revenue.customer_id',
      )
      .leftJoin(
        MiniappBooking,
        'booking',
        'booking.yclients_record_id = revenue.yclients_record_id',
      )
      .where('revenue.source = :source', {source: 'payment'})
      .andWhere('revenue.happened_at BETWEEN :start AND :end', {start, end})
      .orderBy('revenue.happened_at', 'DESC')
      .take(8)
      .getRawMany<{
        id: string;
        service_title: string | null;
        amount: string | null;
        date_created: Date;
        customer_id: string | null;
        customer_username: string | null;
        customer_phone: string | null;
        booking_date: string | null;
        booking_time: string | null;
      }>();

    return rows.map(row => ({
      id: Number(row.id),
      service_title: row.service_title,
      customer_id: row.customer_id == null ? null : Number(row.customer_id),
      customer_username: row.customer_username,
      customer_phone: row.customer_phone,
      booking_date: row.booking_date,
      booking_time: row.booking_time,
      amount: row.amount == null ? null : Number(row.amount),
      date_created: row.date_created,
    }));
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
