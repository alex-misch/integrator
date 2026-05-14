import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Between, Repository} from 'typeorm';
import {AnalyticsEvent, AnalyticsEventName} from './analytics-event.entity';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';

export type DashboardPeriod = '7d' | '30d' | '3m';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly events: Repository<AnalyticsEvent>,

    @InjectRepository(TelegramCustomer)
    private readonly customers: Repository<TelegramCustomer>,
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
    const [totalCustomers, referralShares, referralOpenTotal, bookingTotal] =
      await Promise.all([
        this.customers.count(),
        this.countEvents('referral_share'),
        this.countEvents('referral_open'),
        this.countEvents('referral_booking'),
      ]);

    const [visitsByDay, referralsByDay, bookingsByDay, paymentsByDay] =
      await Promise.all([
        this.countByDay('visit', range.start, range.end),
        this.countByDay('referral_open', range.start, range.end),
        this.countByDay('referral_booking', range.start, range.end),
        this.sumByDay('referral_payment', range.start, range.end),
      ]);

    const [paymentTotal, paymentServices] = await Promise.all([
      this.sumEvents('referral_payment', range.start, range.end),
      this.paymentServices(range.start, range.end),
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
        referral_bookings_total: bookingTotal,
        referral_payments_amount: paymentTotal,
      },
      series: this.buildSeries(range.start, range.days, {
        visits: visitsByDay,
        referral_opens: referralsByDay,
        referral_bookings: bookingsByDay,
        referral_payments: paymentsByDay,
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

  private async sumEvents(
    eventName: AnalyticsEventName,
    start: Date,
    end: Date,
  ) {
    const result = await this.events
      .createQueryBuilder('event')
      .select('COALESCE(SUM(event.amount), 0)', 'total')
      .where('event.event_name = :eventName', {eventName})
      .andWhere('event.date_created BETWEEN :start AND :end', {start, end})
      .getRawOne<{total: string}>();

    return Number(result?.total ?? 0);
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

  private async sumByDay(
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
      .addSelect('COALESCE(SUM(event.amount), 0)', 'value')
      .where({event_name: eventName, date_created: Between(start, end)})
      .groupBy(`date_trunc('day', event.date_created)`)
      .orderBy(`date_trunc('day', event.date_created)`, 'ASC')
      .getRawMany<{day: string; value: string}>();

    return new Map(rows.map(row => [row.day, Number(row.value)]));
  }

  private async paymentServices(start: Date, end: Date) {
    return this.events.find({
      where: {
        event_name: 'referral_payment',
        date_created: Between(start, end),
      },
      order: {date_created: 'DESC'},
      take: 8,
      select: {
        id: true,
        service_title: true,
        amount: true,
        date_created: true,
      },
    });
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

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
