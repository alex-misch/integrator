import {Injectable} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
import {SendpulseService} from '../integrations/sendpulse/sendpulse.service';
import {CustomerLoyaltyService} from './customer-loyalty.service';
import {YclientsEvent} from './yclients-event.entity';

@Injectable()
export class YclientsEventsProcessor {
  private isProcessing = false;

  constructor(
    @InjectRepository(YclientsEvent)
    private readonly events: Repository<YclientsEvent>,
    private readonly sendpulse: SendpulseService,
    private readonly loyalty: CustomerLoyaltyService,
  ) {}

  @Cron('*/5 * * * *')
  async processPaymentEvents() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const events = await this.events
        .createQueryBuilder('event')
        .where('event.processed = false')
        .andWhere('lower(event.event_name) = :eventName', {
          eventName: 'payment',
        })
        .orderBy('event.date_created', 'ASC')
        .limit(100)
        .getMany();

      for (const event of events) {
        await this.processPaymentEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processPaymentEvent(event: YclientsEvent) {
    const phone = normalizePhone(event.phone);
    if (!phone) {
      await this.markProcessed(event, 'Payment event phone is invalid');
      return;
    }

    if (!event.company_id) {
      await this.markUnprocessed(event, 'Payment event company_id is required');
      return;
    }

    if (!event.amount || event.amount <= 0) {
      await this.markProcessed(event, 'Payment event amount must be positive');
      return;
    }

    const referredClient =
      await this.sendpulse.findReferredClientByPhone(phone);
    if (!referredClient?.tg_referrer) {
      await this.markProcessed(event, 'Referred SendPulse client not found');
      return;
    }

    const donor = await this.sendpulse.findReferrerCustomer(
      referredClient.tg_referrer,
    );
    if (!donor) {
      await this.markProcessed(event, 'Referral donor not found');
      return;
    }
    if (
      referredClient.telegram_id &&
      String(donor.id) === referredClient.telegram_id
    ) {
      await this.markProcessed(event, 'Self-referral payment is ignored');
      return;
    }

    try {
      await this.loyalty.accrueReferralPaymentBonus({
        donor,
        companyId: event.company_id,
        purchaseAmount: event.amount,
        event,
        referredClient,
      });

      await this.markProcessed(event);
    } catch (error) {
      await this.markUnprocessed(
        event,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async markProcessed(event: YclientsEvent, error?: string) {
    await this.events.update(event.id, {
      processed: true,
      process_error: error ?? null,
      date_processed: new Date(),
    });
  }

  private async markUnprocessed(event: YclientsEvent, error: string) {
    await this.events.update(event.id, {
      processed: false,
      process_error: error,
    });
  }
}
