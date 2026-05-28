import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {YclientsClient} from '../integrations/yclients/yclients.service';
import {TelegramCustomerService} from '../telegram/telegram-customer.service';
import {normalizePhone} from 'src/utils/phone';
import type {YclientsClientListItem} from '../integrations/yclients/yclient.types';
import {SendpulseService} from '../integrations/sendpulse/sendpulse.service';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {SendpulseClient} from '../integrations/sendpulse/sendpulse-clients.entity';
import {LoyaltyTransaction} from './loyalty-transaction.entity';
import {YclientsEvent} from './yclients-event.entity';

type AccrueReferralPaymentBonusParams = {
  donor: TelegramCustomer;
  companyId: number;
  purchaseAmount: number;
  event: YclientsEvent;
  referredClient: SendpulseClient;
};

const REFERRAL_FIRST_PURCHASE_BONUS = 1000;

@Injectable()
export class CustomerLoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly transactions: Repository<LoyaltyTransaction>,
    private readonly yclients: YclientsClient,
    private readonly customers: TelegramCustomerService,
    private readonly sendpulse: SendpulseService,
  ) {}

  async getBalance(customerId: number, companyId: number) {
    const context = await this.getWalletContext(customerId, companyId);

    return {
      company_id: companyId,
      yclients_client_id: context.yclientsClient?.id ?? null,
      card_id: context.card.id,
      card_number: String(context.card.number),
      balance: context.card.balance,
      points: context.card.points,
    };
  }

  async getReferralPaymentBonusTotal(customerId: number) {
    const row = await this.transactions
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.customer_id = :customerId', {customerId})
      .andWhere('transaction.source = :source', {
        source: 'referral_payment_bonus',
      })
      .getRawOne<{total: string}>();

    return Number(row?.total ?? 0);
  }

  async accrueReferralPaymentBonus({
    donor,
    companyId,
    purchaseAmount,
    event,
    referredClient,
  }: AccrueReferralPaymentBonusParams) {
    const existingTransaction = await this.transactions.findOne({
      where: {
        source: 'referral_payment_bonus',
        yclients_event_id: event.id,
      },
    });
    if (existingTransaction) {
      return existingTransaction;
    }

    const existingFirstPurchaseTransaction = await this.transactions.findOne({
      where: {
        source: 'referral_payment_bonus',
        referred_client_record_id: referredClient.record_id,
      },
    });
    if (existingFirstPurchaseTransaction) {
      return existingFirstPurchaseTransaction;
    }

    const context = await this.getWalletContext(donor.id, companyId);
    const title = '1000 ₽ за первую покупку реферала';
    const card = await this.yclients.loyaltyCardManualTransaction(
      companyId,
      context.card.id,
      {
        amount: REFERRAL_FIRST_PURCHASE_BONUS,
        title,
      },
    );

    return this.transactions.save(
      this.transactions.create({
        source: 'referral_payment_bonus',
        customer_id: donor.id,
        referred_client_record_id: referredClient.record_id,
        yclients_event_id: event.id,
        company_id: companyId,
        card_id: card.id,
        amount: REFERRAL_FIRST_PURCHASE_BONUS,
        purchase_amount: purchaseAmount,
        title,
        metadata: {
          event_name: event.event_name,
          referred_phone: referredClient.phone,
          tg_referrer: referredClient.tg_referrer,
          bonus_policy: 'first_purchase_fixed_1000',
          service_title: this.extractServiceTitle(event.json),
        },
      }),
    );
  }

  private extractServiceTitle(payload: Record<string, unknown> | null) {
    const data = payload?.data as
      | {
          title?: string;
          service_title?: string;
          service?: {title?: string; name?: string};
          services?: Array<{title?: string; name?: string}>;
          goods_transactions?: Array<{
            title?: string;
            name?: string;
            service?: {title?: string; name?: string};
          }>;
        }
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

  private async getWalletContext(customerId: number, companyId: number) {
    const customer = await this.customers.findOne({
      where: {id: customerId},
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const phone = normalizePhone(
      customer.phone ??
        (await this.sendpulse.getPhoneByTelegramId(customer.id)),
    );
    if (!phone) {
      throw new BadRequestException('Customer phone is required');
    }

    if (normalizePhone(customer.phone ?? null) !== phone) {
      await this.customers.update(customer.id, {phone});
    }

    const company = await this.yclients.company(companyId);
    const cardTypes = await this.yclients.loyaltyCardTypes(companyId);
    const rawYclientsClients = await this.yclients.searchClientsByPhone(
      companyId,
      phone,
    );

    const yclientsClient = this.findYclientsClientByPhone(
      rawYclientsClients,
      phone,
    );

    await this.customers.syncFromYclientsClient(customer, yclientsClient);

    const groupId =
      company.main_group_id ??
      company.main_group?.id ??
      cardTypes[0]?.salon_group_id ??
      null;

    if (!groupId) {
      throw new BadRequestException('Failed to resolve loyalty group_id');
    }

    const clientCards = await this.yclients.loyaltyCards({
      phone,
      groupId,
      companyId,
    });

    let cashbackCard = clientCards.find(card =>
      card?.type.title?.includes('реферальной'),
    );

    if (cashbackCard) {
      const card = await this.applyPendingReferralBonus(
        customer.id,
        companyId,
        cashbackCard,
      );

      return {card, yclientsClient};
    }

    cashbackCard = await this.yclients.issueLoyaltyCard(companyId, {
      loyalty_card_number: this.generateCardNumber(phone),
      loyalty_card_type_id: cardTypes[0].id,
      phone: Number(phone),
    });

    const card = await this.applyPendingReferralBonus(
      customer.id,
      companyId,
      cashbackCard,
    );

    return {card, yclientsClient};
  }

  private async applyPendingReferralBonus(
    customerId: number,
    companyId: number,
    card: Awaited<ReturnType<YclientsClient['issueLoyaltyCard']>>,
  ) {
    const bonusResult = await this.sendpulse.applyPendingReferralPoints(
      customerId,
      async points => {
        const cardWithBonus = await this.yclients.loyaltyCardManualTransaction(
          companyId,
          card.id,
          {
            amount: points,
            title: 'Приветственный бонус по рефералке',
          },
        );

        await this.transactions.save(
          this.transactions.create({
            source: 'welcome_referral_bonus',
            customer_id: customerId,
            referred_client_record_id: null,
            yclients_event_id: null,
            company_id: companyId,
            card_id: cardWithBonus.id,
            amount: points,
            purchase_amount: null,
            title: 'Приветственный бонус по рефералке',
            metadata: null,
          }),
        );

        return {card: cardWithBonus};
      },
    );

    return bonusResult?.card ?? card;
  }

  private findYclientsClientByPhone(
    clients: YclientsClientListItem[],
    phone: string,
  ) {
    return (
      clients.find(
        client => normalizePhone(String(client.phone ?? '')) === phone,
      ) ??
      clients[0] ??
      null
    );
  }

  private generateCardNumber(phone: string) {
    const seed = `${phone.slice(-6)}${Date.now()}`.slice(-15);
    return Number(seed);
  }
}
