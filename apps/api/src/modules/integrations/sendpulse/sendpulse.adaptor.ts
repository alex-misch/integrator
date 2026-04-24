import * as sendpulse from 'sendpulse-api';
import {ApiProperty} from '@nestjs/swagger';
import {normalizePhone} from 'src/utils/phone';

export class SendpulseUserVariable {
  @ApiProperty({nullable: true, required: false})
  Phone?: string | number | null;

  @ApiProperty({nullable: true, required: false})
  tg_referrer?: string | number | null;
}

export class SendpulseUser {
  @ApiProperty({required: false, nullable: true})
  id?: string | null;

  @ApiProperty({required: false, nullable: true})
  username?: string | null;

  @ApiProperty({required: false, nullable: true})
  telegram_id?: string | number | null;

  @ApiProperty({required: false, nullable: true})
  phone?: string | null;

  @ApiProperty({required: false, nullable: true})
  email?: string | null;

  @ApiProperty({required: false, nullable: true, type: SendpulseUserVariable})
  variables?: SendpulseUserVariable | null;
}

export class SendpulseGetByTelegramIdResponse {
  @ApiProperty({required: false, nullable: true, type: SendpulseUser})
  data?: SendpulseUser | null;
}

export class SendpulseApi {
  private token: string;
  private readonly baseUrl = 'https://api.sendpulse.com';
  private readonly ready: Promise<void>;
  private readonly initTimeoutMs = 10_000;

  constructor() {
    const clientId = process.env.SENDPULSE_CLIENT_ID;
    const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        '[Sendpulse] SENDPULSE_CLIENT_ID and SENDPULSE_CLIENT_SECRET are required',
      );
    }

    this.ready = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `[Sendpulse] token initialization timed out after ${this.initTimeoutMs}ms`,
          ),
        );
      }, this.initTimeoutMs);

      sendpulse.init(clientId, clientSecret, process.env.TMPDIR, () => {
        sendpulse.getToken(token => {
          clearTimeout(timeout);

          if (!token) {
            reject(new Error('[Sendpulse] token initialization failed'));
            return;
          }

          this.token = token;
          resolve();
        });
      });
    });
  }

  async getByTelegramId(
    telegramId: number | string,
  ): Promise<SendpulseUser | null> {
    await this.ready;
    const url = new URL('/telegram/contacts/getByTelegramId', this.baseUrl);
    url.searchParams.set('bot_id', process.env.SENDPULSE_BOT_ID ?? '');
    url.searchParams.set('telegram_id', String(telegramId));

    const response = await this.request<SendpulseGetByTelegramIdResponse>({
      method: 'GET',
      path: `${url.pathname}${url.search}`,
    });

    if (!response.ok) {
      return null;
    }

    return response.data?.data ?? null;
  }

  async getPhoneByTelegramId(
    telegramId: number | string,
  ): Promise<string | null> {
    const contact = await this.getByTelegramId(telegramId);
    const rawPhone = contact?.variables?.Phone;
    return normalizePhone(
      typeof rawPhone === 'string' || typeof rawPhone === 'number'
        ? String(rawPhone)
        : null,
    );
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('[Sendpulse] token is not configured');
    }

    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>({
    method,
    path,
    body,
  }: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT';
    path: string;
    body?: unknown;
  }): Promise<{ok: boolean; data?: T}> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        console.error(`[Sendpulse] ${this.baseUrl} ${method} ${path} failed`, {
          status: response.status,
          response: await response.text(),
        });
        return {ok: false};
      }
      try {
        return {
          ok: true,
          data: (await response.json()) as T,
        };
      } catch {
        return {ok: true};
      }
    } catch (error) {
      console.error(`[Sendpulse] ${this.baseUrl} ${method} ${path} error`, {
        error,
      });
      return {ok: false};
    }
  }
}
