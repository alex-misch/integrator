import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {SendpulseClient} from './sendpulse-clients.entity';
import {SendpulseLog} from './sendpulse-logs.entity';
import {SendpulseApi, SendpulseUser} from './sendpulse.adaptor';

type SendpulseWebhookPayload = SendpulseWebhookEvent | SendpulseWebhookEvent[];

type SendpulseWebhookEvent = {
  contact?: SendpulseWebhookContact | null;
  [key: string]: unknown;
} | null;

type SendpulseWebhookContact = {
  username?: string | null;
  telegram_id?: string | number | null;
  id?: string | null;
  variables?: {
    Phone?: string | number | null;
    tg_referrer?: string | number | null;
    [key: string]: unknown;
  } | null;
  last_message_data?: {
    message?: {
      tracking_data?: {
        start?: string | number | null;
        tg_referrer?: string | number | null;
      } | null;
    } | null;
  } | null;
  [key: string]: unknown;
} | null;

type SendpulseClientFields = {
  username: string | null;
  telegram_id: string | null;
  id: string | null;
  tg_referrer: string | null;
  phone: string | null;
};

@Injectable()
export class SendpulseService {
  private readonly referralWelcomeBonusPoints = 3000;
  private sendpulseApi: SendpulseApi | null = null;

  constructor(
    @InjectRepository(SendpulseClient)
    private readonly sendpulseClient: Repository<SendpulseClient>,

    @InjectRepository(SendpulseLog)
    private readonly sendpulseLog: Repository<SendpulseLog>,

    @InjectRepository(TelegramCustomer)
    private readonly telegramCustomers: Repository<TelegramCustomer>,
  ) {}

  async saveStartEvent(payload: unknown) {
    const log = await this.sendpulseLog.save(
      this.sendpulseLog.create({
        json: payload,
        processed: false,
      }),
    );

    const clients = await this.saveClient(payload);

    if (clients.length > 0) {
      await this.sendpulseLog.update(log.id, {processed: true});
    }

    return {processed: clients.length > 0, clients};
  }

  async saveClient(payload: unknown) {
    const events = this.unwrapEvents(payload as SendpulseWebhookPayload);
    const savedClients: SendpulseClient[] = [];

    for (const event of events) {
      const fields = this.extractClientFromWebhook(event);
      if (!fields) continue;

      savedClients.push(await this.upsertClient(fields));
    }

    return savedClients;
  }

  async getPhoneByTelegramId(
    telegramId: number | string,
  ): Promise<string | null> {
    const dbClient = await this.sendpulseClient.findOne({
      where: {telegram_id: String(telegramId)},
    });
    const dbPhone = normalizePhone(dbClient?.phone ?? null);

    if (dbPhone) {
      return dbPhone;
    }

    const contact = await this.getApi().getByTelegramId(telegramId);
    if (!contact) {
      console.log('NULL CONTACT', contact);
      return null;
    }
    console.log('FOUND CONTACT', contact);

    const [savedClient] = await this.saveClient(
      this.buildWebhookPayloadFromApiContact(contact, telegramId),
    );
    return normalizePhone(savedClient.phone ?? null);
  }

  countReferrals(referralCode: string, telegramId?: number | string) {
    const query = this.sendpulseClient
      .createQueryBuilder('client')
      .where('client.tg_referrer = :referralCode', {referralCode});

    if (telegramId) {
      query.andWhere(
        '(client.telegram_id IS NULL OR client.telegram_id != :telegramId)',
        {telegramId: String(telegramId)},
      );
    }

    return query.getCount();
  }

  async findReferredClientByPhone(phone: string) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return null;
    }

    const clients = await this.sendpulseClient
      .createQueryBuilder('client')
      .where('client.tg_referrer IS NOT NULL')
      .andWhere('client.phone IS NOT NULL')
      .orderBy('client.date_created', 'ASC')
      .getMany();

    return (
      clients.find(
        client => normalizePhone(client.phone) === normalizedPhone,
      ) ?? null
    );
  }

  async findReferrerCustomer(referrer: string) {
    return this.telegramCustomers.findOne({
      where: {referral_code: referrer, is_blocked: false},
    });
  }

  private async upsertClient(fields: SendpulseClientFields) {
    const existingClient = await this.findExistingClient(fields);
    const isNewClient = !fields.phone;
    const nextFields: Partial<SendpulseClient> = {
      username: fields.username,
      telegram_id: fields.telegram_id,
      id: fields.id,
      phone: fields.phone,
    };

    // /start without phone means first bot entry: no phone was collected for this tg id yet, so we treat the client as new.
    if (isNewClient && fields.tg_referrer) {
      const isFirstReferralStart = !existingClient?.tg_referrer;

      nextFields.tg_referrer =
        existingClient?.tg_referrer ?? fields.tg_referrer;

      // This is not a business condition. It keeps repeated /start webhooks from re-queueing the bonus after wallet resets it to 0.
      if (isFirstReferralStart) {
        nextFields.pending_referral_points =
          await this.getReferralWelcomeBonusPoints(fields);
      }
    }

    if (!existingClient) {
      return this.sendpulseClient.save(this.sendpulseClient.create(nextFields));
    }

    await this.sendpulseClient.update(existingClient.record_id, nextFields);

    return (
      (await this.sendpulseClient.findOne({
        where: {record_id: existingClient.record_id},
      })) ?? existingClient
    );
  }

  async applyPendingReferralPoints<T>(
    telegramId: number | string,
    apply: (points: number) => Promise<T>,
  ): Promise<T | null> {
    return this.sendpulseClient.manager.transaction(async manager => {
      const repo = manager.getRepository(SendpulseClient);
      const client = await repo
        .createQueryBuilder('client')
        .where('client.telegram_id = :telegramId', {
          telegramId: String(telegramId),
        })
        .andWhere('client.pending_referral_points > 0')
        .orderBy('client.date_created', 'ASC')
        .setLock('pessimistic_write')
        .getOne();

      if (!client || client.pending_referral_points <= 0) {
        return null;
      }

      const result = await apply(client.pending_referral_points);

      await repo.update(client.record_id, {
        pending_referral_points: 0,
      });

      return result;
    });
  }

  private async findExistingClient(fields: SendpulseClientFields) {
    if (fields.telegram_id) {
      const byTelegramId = await this.sendpulseClient.findOne({
        where: {telegram_id: fields.telegram_id},
      });

      if (byTelegramId) return byTelegramId;
    }

    if (fields.id) {
      return this.sendpulseClient.findOne({where: {id: fields.id}});
    }

    return null;
  }

  private extractClientFromWebhook(
    event: SendpulseWebhookEvent,
  ): SendpulseClientFields | null {
    const contact = event?.contact;
    if (!contact || typeof contact !== 'object') {
      return null;
    }

    return {
      username: this.toStringOrNull(contact.username),
      telegram_id: this.toBigintStringOrNull(contact.telegram_id),
      id: this.toStringOrNull(contact.id),
      tg_referrer: this.extractReferrer(contact),
      phone: this.extractPhone(contact.variables?.Phone),
    };
  }

  private buildWebhookPayloadFromApiContact(
    contact: SendpulseUser,
    telegramId: number | string,
  ): SendpulseWebhookPayload {
    return [
      {
        contact: {
          ...contact,
          telegram_id: contact.telegram_id ?? telegramId,
          variables: {
            ...(contact.variables ?? {}),
            Phone: contact.variables?.Phone ?? contact.phone ?? null,
          },
        },
      },
    ];
  }

  private extractPhone(phone: unknown) {
    return this.toStringOrNull(phone);
  }

  private extractReferrer(contact: SendpulseWebhookContact) {
    const candidates = [
      contact.last_message_data?.message?.tracking_data?.start,
      contact.last_message_data?.message?.tracking_data?.tg_referrer,
      contact.variables?.tg_referrer,
    ];

    for (const candidate of candidates) {
      const referrer = this.extractTgReferrer(candidate);
      if (referrer) return referrer;
    }

    return null;
  }

  private unwrapEvents(payload: SendpulseWebhookPayload) {
    return Array.isArray(payload) ? payload : [payload];
  }

  private getApi() {
    if (!this.sendpulseApi) {
      this.sendpulseApi = new SendpulseApi();
    }

    return this.sendpulseApi;
  }

  private toStringOrNull(value: unknown) {
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number') return String(value);
    return null;
  }

  private toBigintStringOrNull(value: unknown) {
    const stringValue = this.toStringOrNull(value);
    if (!stringValue) {
      return null;
    }

    if (/^\d+$/.test(stringValue)) {
      return stringValue;
    }

    return null;
  }

  private extractTgReferrer(value: unknown) {
    const stringValue = this.toStringOrNull(value);
    if (!stringValue) return null;

    const referrer = stringValue.match(/^tg_([a-z0-9_-]+)$/i)?.[1];
    if (referrer) return referrer;

    if (/^[a-z0-9_-]+$/i.test(stringValue)) {
      return stringValue;
    }

    return null;
  }

  private async getReferralWelcomeBonusPoints(fields: SendpulseClientFields) {
    if (!fields.tg_referrer) {
      return 0;
    }

    const referrer = await this.findReferrerCustomer(fields.tg_referrer);
    if (!referrer) {
      return 0;
    }

    if (fields.telegram_id && String(referrer.id) === fields.telegram_id) {
      return 0;
    }

    return this.referralWelcomeBonusPoints;
  }
}
