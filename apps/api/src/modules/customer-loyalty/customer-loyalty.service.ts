import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {YclientsClient} from '../integrations/yclients/yclients.service';
import {TelegramCustomerService} from '../telegram/telegram-customer.service';
import {normalizePhone} from 'src/utils/phone';
import type {YclientsClientListItem} from '../integrations/yclients/yclient.types';

@Injectable()
export class CustomerLoyaltyService {
  constructor(
    private readonly yclients: YclientsClient,
    private readonly customers: TelegramCustomerService,
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

  async topup(
    customerId: number,
    companyId: number,
    amount: number,
    title?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const context = await this.getWalletContext(customerId, companyId);
    const card = await this.yclients.loyaltyCardManualTransaction(
      companyId,
      context.card.id,
      {
        amount,
        title,
      },
    );

    return {
      company_id: companyId,
      yclients_client_id: context.yclientsClient?.id ?? null,
      card_id: card.id,
      card_number: String(card.number),
      balance: card.balance,
      points: card.points,
    };
  }

  async spend(
    customerId: number,
    companyId: number,
    amount: number,
    title?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const context = await this.getWalletContext(customerId, companyId);
    const card = await this.yclients.loyaltyCardManualTransaction(
      companyId,
      context.card.id,
      {
        amount: -Math.abs(amount),
        title,
      },
    );

    return {
      company_id: companyId,
      yclients_client_id: context.yclientsClient?.id ?? null,
      card_id: card.id,
      card_number: String(card.number),
      balance: card.balance,
      points: card.points,
    };
  }

  private async getWalletContext(customerId: number, companyId: number) {
    const customer = await this.customers.findOne({
      where: {id: customerId},
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const phone = normalizePhone(customer.phone ?? null);
    if (!phone) {
      throw new BadRequestException('Customer phone is required');
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

    if (yclientsClient?.id && customer.yclients_id !== yclientsClient.id) {
      await this.customers.update(customer.id, {
        yclients_id: yclientsClient.id,
      });
    }

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

    const cashbackCard = clientCards.find(card =>
      card?.type.title?.includes('реферальной'),
    );

    if (cashbackCard) {
      return {card: cashbackCard, yclientsClient};
    }
    const issuedCard = await this.yclients.issueLoyaltyCard(companyId, {
      loyalty_card_number: this.generateCardNumber(phone),
      loyalty_card_type_id: cardTypes[0].id,
      phone: Number(phone),
    });

    return {card: issuedCard, yclientsClient};
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
