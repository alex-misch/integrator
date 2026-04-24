import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {normalizePhone} from 'src/utils/phone';
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
  private sendpulseApi: SendpulseApi | null = null;

  constructor(
    @InjectRepository(SendpulseClient)
    private readonly sendpulseClient: Repository<SendpulseClient>,

    @InjectRepository(SendpulseLog)
    private readonly sendpulseLog: Repository<SendpulseLog>,
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
      nextFields.tg_referrer =
        existingClient?.tg_referrer ?? fields.tg_referrer;
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
    return this.extractTgReferrer(
      contact.last_message_data?.message?.tracking_data?.start,
    );
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
    const referrer = stringValue?.match(/^tg_(\d+)$/i)?.[1];

    return referrer ?? null;
  }
}
