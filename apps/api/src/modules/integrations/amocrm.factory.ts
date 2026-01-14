import {normalizePhone} from '../../utils/phone';

export interface AmoLookupResult {
  contactId: number;
  leadId: number;
}

type AmoClient = {
  phone: string;
  name?: string;
  email?: string;
  yclientId?: string;
  yclientLeadId?: string;
};

type AmoContact = {
  id?: number;
  custom_fields_values?: Array<AmoContactFieldValue>;
  _embedded?: {leads?: Array<{id?: number}>};
};

type AmoLead = {
  id?: number;
  pipeline_id?: number;
  status_id?: number;
  custom_fields_values?: Array<AmoContactFieldValue>;
};

type AmoContactsResponse = {
  _embedded?: {contacts?: AmoContact[]};
};

type AmoLeadsResponse = {
  _embedded?: {leads?: AmoLead[]};
};

export type AmoContactFieldValue = {
  field_code?: string;
  field_id?: number;
  values: Array<{value: unknown}>;
};

type AmoContactPayload = {
  name?: string;
  custom_fields_values: AmoContactFieldValue[];
};

export class IntegrationAmocrmFactory {
  private readonly amoUrl: string;
  private readonly token: string;
  private readonly pipelineId: number;

  private leadFieldTypesCache: Map<number, string>;
  private contactFieldTypesCache: Map<number, string>;

  constructor(props: {token: string; amoUrl: string; pipelineId: number}) {
    this.amoUrl = props.amoUrl;
    this.token = props.token;
    this.pipelineId = props.pipelineId;
  }

  async moveLeadToStage(leadId: number, stageId: number): Promise<boolean> {
    const payload: Array<Record<string, unknown>> = [
      {
        id: leadId,
        status_id: +stageId,
        pipeline_id: this.pipelineId,
      },
    ];

    return (
      await this.request({
        method: 'PATCH',
        path: '/api/v4/leads',
        body: payload,
      })
    ).ok;
  }

  async setLeadCustomFields(
    leadId: number,
    customFields: AmoContactFieldValue | Array<AmoContactFieldValue>,
    name?: string,
    price?: number,
  ): Promise<boolean> {
    const normalized = Array.isArray(customFields)
      ? customFields
      : [customFields];
    const payload: Array<Record<string, unknown>> = [
      {
        id: leadId,
        pipeline_id: this.pipelineId,
        ...(name ? {name} : {}),
        ...(price ? {price: +price} : {}),
        custom_fields_values: normalized,
      },
    ];

    return (
      await this.request({
        method: 'PATCH',
        path: '/api/v4/leads',
        body: payload,
      })
    ).ok;
  }

  async setContactCustomFields(
    contactId: number,
    customFields: AmoContactFieldValue | Array<AmoContactFieldValue>,
    name?: string,
  ): Promise<boolean> {
    const normalized = Array.isArray(customFields)
      ? customFields
      : [customFields];
    const payload = {
      ...(name ? {name} : {}),
      custom_fields_values: normalized,
    };

    return (
      await this.request({
        method: 'PATCH',
        path: `/api/v4/contacts/${contactId}`,
        body: payload,
      })
    ).ok;
  }

  async addPaymentNote(
    leadId: number,
    serviceName: string,
    amount: number,
  ): Promise<boolean> {
    const noteText = `${new Date()
      .toLocaleDateString('ru-RU')
      .replace(/\u200f/g, '')} • ${serviceName} • ${Math.round(amount)} ₽`;

    const body = [{note_type: 'common', params: {text: noteText}}];
    return (
      await this.request({
        method: 'POST',
        path: `/api/v4/leads/${leadId}/notes`,
        body,
      })
    ).ok;
  }

  async createContactAndLead(client: AmoClient) {
    const contactId = await this.createContact(client);
    return {
      contactId: contactId,
      leadId: await this.createLeadForContact(contactId),
    };
  }

  async findOrCreateClient(rawClient: AmoClient): Promise<AmoLookupResult> {
    const normalizedPhone = normalizePhone(rawClient.phone);
    if (!normalizedPhone) return null;

    const searchPhone = normalizedPhone.slice(-10);
    const params = new URLSearchParams({query: searchPhone, with: 'leads'});
    const response = await this.request<AmoContactsResponse>({
      method: 'GET',
      path: `/api/v4/contacts?${params.toString()}`,
    });
    if (!response.ok) return null;
    if (!response.data) {
      return await this.createContactAndLead(rawClient);
    }

    const contacts = response.data._embedded?.contacts ?? [];
    for (const contact of contacts) {
      const contactId = contact.id;
      const phones = contact.custom_fields_values?.find(
        f => f.field_code === 'PHONE',
      )?.values;
      const match = phones?.some(value =>
        normalizePhone((value?.value as string) || '')?.endsWith(searchPhone),
      );
      if (!match) continue;

      const leads = contact._embedded?.leads ?? [];
      for (const lead of leads) {
        const details = await this.getLeadDetails(lead.id);
        if (!details || details.pipeline_id !== this.pipelineId) continue;
        return {
          contactId,
          leadId: lead.id,
        };
      }

      return {
        contactId,
        leadId: contactId ? await this.createLeadForContact(contactId) : null,
      };
    }
    return await this.createContactAndLead(rawClient);
  }

  private async createLeadForContact(
    contactId: number,
  ): Promise<number | null> {
    const stages = await this.getPipelineStages(this.pipelineId);
    const payload = [
      {
        name: 'New lead',
        pipeline_id: this.pipelineId,
        status_id: stages._embedded.statuses[1].id,
        created_by: 0,
        _embedded: {contacts: [{id: contactId, is_main: true}]},
      },
    ];

    try {
      const response = await this.request<AmoLeadsResponse>({
        method: 'POST',
        path: '/api/v4/leads',
        body: payload,
      });
      if (!response.ok) return null;

      const data = response.data;
      return data._embedded?.leads?.[0]?.id ?? null;
    } catch (error) {
      console.error('[AmoCRM] POST createLeadForContact error', {error});
      return null;
    }
  }

  private async createContact(client: AmoClient): Promise<number | null> {
    const normalizedPhone = normalizePhone(client.phone);
    if (!normalizedPhone) return null;

    const amoClient: AmoContactPayload = {
      custom_fields_values: [
        {field_code: 'PHONE', values: [{value: normalizedPhone}]},
      ],
    };

    if (client.name) {
      amoClient.name = client.name;
    }

    if (client.email) {
      amoClient.custom_fields_values.push({
        field_code: 'EMAIL',
        values: [{value: client.email}],
      });
    }

    try {
      const response = await this.request<AmoContactsResponse>({
        method: 'POST',
        path: '/api/v4/contacts',
        body: [amoClient],
      });
      if (!response.ok) return null;

      const data = response.data;
      return data._embedded?.contacts?.[0]?.id ?? null;
    } catch (error) {
      console.error('[AmoCRM] POST createContact error', {error});
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('[AMO] token is not configured');
    }

    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getContactDetails(contactId: number): Promise<AmoContact | null> {
    const response = await this.request<AmoContact>({
      method: 'GET',
      path: `/api/v4/contacts/${contactId}?with=leads`,
    });
    return response.ok ? (response.data ?? null) : null;
  }

  async getLeadDetails(leadId: number): Promise<AmoLead | null> {
    const response = await this.request<AmoLead>({
      method: 'GET',
      path: `/api/v4/leads/${leadId}`,
    });
    return response.ok ? (response.data ?? null) : null;
  }

  private async request<T>({
    method,
    path,
    body,
  }: {
    method: 'GET' | 'POST' | 'PATCH';
    path: string;
    body?: unknown;
  }): Promise<{ok: boolean; data?: T}> {
    let response: Response;
    try {
      response = await fetch(`${this.amoUrl}${path}`, {
        method,
        headers: this.getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        console.error(`[AmoCRM] ${this.amoUrl} ${method} ${path} failed`, {
          request: JSON.stringify(body),
          status: response.status,
          reponse: await response.text(),
          headers: this.getAuthHeaders(),
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
      console.error(
        `[AmoCRM] ${this.amoUrl} ${method} ${path} error`,
        response,
        error,
      );
      return {ok: false};
    }
  }

  async getLeadFields(): Promise<unknown> {
    const response = await this.request<{_embedded?: unknown}>({
      method: 'GET',
      path: '/api/v4/leads/custom_fields',
    });
    return response.ok ? (response.data ?? null) : null;
  }

  async getContactFields(): Promise<unknown> {
    const response = await this.request<{_embedded?: unknown}>({
      method: 'GET',
      path: '/api/v4/contacts/custom_fields',
    });
    return response.ok ? (response.data ?? null) : null;
  }

  async getPipelineStages(pipelineId: string | number) {
    const response = await this.request<{
      _embedded?: {statuses: {id: string}[]};
    }>({
      method: 'GET',
      path: `/api/v4/leads/pipelines/${pipelineId}/statuses`,
    });
    return response.ok ? (response.data ?? null) : null;
  }

  async getPipelines(): Promise<unknown> {
    const response = await this.request<{_embedded?: unknown}>({
      method: 'GET',
      path: '/api/v4/leads/pipelines',
    });
    return response.ok ? (response.data ?? null) : null;
  }

  async getLeadFieldType(fieldId: number) {
    if (!this.leadFieldTypesCache) {
      const fields = await this.getLeadFields();
      this.leadFieldTypesCache = this.buildFieldTypeMap(fields);
    }
    return this.leadFieldTypesCache.get(fieldId);
  }

  async getContactFieldType(fieldId: number) {
    if (!this.contactFieldTypesCache) {
      const fields = await this.getContactFields();
      this.contactFieldTypesCache = this.buildFieldTypeMap(fields);
    }
    return this.contactFieldTypesCache.get(fieldId);
  }

  private buildFieldTypeMap(fields: unknown): Map<number, string> {
    if (!fields || typeof fields !== 'object') return new Map();
    const embedded = (fields as {_embedded?: {custom_fields?: unknown}})
      ._embedded;
    const list =
      (embedded?.custom_fields as Array<Record<string, unknown>>) ??
      (fields as {custom_fields?: Array<Record<string, unknown>>})
        .custom_fields ??
      (Array.isArray(fields) ? (fields as Array<Record<string, unknown>>) : []);

    const map = new Map<number, string>();
    for (const field of list ?? []) {
      const id = this.toNumber(field.id as string | number | undefined);
      if (!id) continue;
      const type =
        (typeof field.type === 'string' && field.type) ||
        (typeof field.field_type === 'string' && field.field_type) ||
        (typeof field.value_type === 'string' && field.value_type) ||
        '';
      if (type) map.set(id, type);
    }
    return map;
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
