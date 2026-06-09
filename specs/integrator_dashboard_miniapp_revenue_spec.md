# Спека: нижние блоки dashboard без привязки к рефералам

## 0. Контекст

Репозиторий: `alex-misch/integrator`.

Текущая архитектура:

- Backend: `apps/api`, NestJS, TypeORM.
- Dashboard API: `apps/api/src/interfaces/admin/dashboard`.
- Dashboard данные: `apps/api/src/modules/analytics/analytics.service.ts`.
- YClients webhook endpoint: `apps/api/src/interfaces/pub/webhook/webhook.controller.ts`.
- YClients webhook service: `apps/api/src/modules/customer-loyalty/yclients-events.service.ts`.
- YClients webhook log table: `yclients_events`.
- Miniapp bookings: `miniapp_bookings`.
- Miniapp openings уже пишутся в `analytics_events` как `event_name = 'visit'`.

Сейчас нижние блоки dashboard завязаны на referral-логику:

- график “Оплаты рефералов” строится из `loyalty_transactions`;
- блок “Услуги и суммы” тоже строится из `loyalty_transactions` + join на `yclients_events`;
- общий query использует `referralTransactionsQuery()`.

Нужно отвязать эти блоки от рефералов и строить их по всем клиентам, которые открывали miniapp.

---

## 1. Цель

Нужно изменить нижние блоки dashboard.

### 1.1. “Оплаты рефералов”

Переименовать по смыслу в UI, если возможно:

```txt
Оплаты клиентов
```

или оставить старый заголовок временно, если UI-тексты не входят в задачу.

Новая логика:

```txt
Оплаты = оплаты всех клиентов, которые открывали miniapp
```

То есть не только referral-клиенты.

---

### 1.2. “Услуги и суммы”

Новая логика:

```txt
Услуги и суммы = услуги и суммы всех клиентов, которые:
1. открывали miniapp;
2. хотя бы 1 раз записывались через miniapp;
3. успешно посетили клинику или оплатили что-то.
```

Источник данных — новая таблица, а не `loyalty_transactions`.

---

## 2. Что есть в webhook YClients

По выгрузке последних 1000 `yclients_events` видно 2 важных типа событий.

### 2.1. `record`

Пример:

```json
{
  "resource": "record",
  "status": "update",
  "resource_id": 1680739923,
  "company_id": 122686,
  "data": {
    "id": 1680739923,
    "visit_id": 1463687220,
    "client": {
      "id": 210562865,
      "phone": "+79653605355",
      "display_name": "..."
    },
    "attendance": 1,
    "visit_attendance": 1,
    "paid_full": 1,
    "deleted": false
  }
}
```

Назначение:

- `resource = 'record'` — событие по записи;
- `resource_id` / `data.id` — YClients record id;
- `data.visit_id` — YClients visit id;
- `data.client.id` — YClients client id;
- `data.client.phone` — телефон клиента;
- `data.attendance` / `data.visit_attendance` — статус посещения;
- `attendance = 1` — клиент успешно посетил клинику.

---

### 2.2. `finances_operation`

Пример:

```json
{
  "resource": "finances_operation",
  "status": "create",
  "resource_id": 1458701445,
  "company_id": 122686,
  "data": {
    "id": 1458701445,
    "amount": 3000,
    "client": {
      "id": 73768744,
      "phone": "+79647711711"
    },
    "visit_id": 1459559847,
    "record_id": 1676003634,
    "document_id": 1910871438,
    "sold_item_id": 21115815,
    "sold_item_type": "service"
  }
}
```

Назначение:

- `resource = 'finances_operation'` — финансовая операция;
- `resource_id` / `data.id` — id финансовой операции;
- `data.amount` — сумма;
- `data.record_id` — YClients record id;
- `data.visit_id` — YClients visit id;
- `data.sold_item_id` — id проданной услуги/товара;
- `data.sold_item_type`:
  - `service`;
  - `goods_transaction`;
- `data.client.id` — YClients client id;
- `data.client.phone` — телефон клиента.

---

## 3. Главная проблема

Факт посещения и факт оплаты приходят разными webhook-событиями.

Например:

1. Сначала приходит `finances_operation.create` с суммой и `record_id`.
2. Потом приходит `record.update` с `attendance = 1`.
3. Иногда приходит `finances_operation.update` с той же финансовой операцией.
4. По одной записи может быть несколько оплат/услуг.
5. Один `visit_id` может связывать несколько `record_id` / несколько финансовых операций.

Поэтому нельзя строить dashboard напрямую из одного webhook-события.

Нужно завести нормализованную таблицу, которая будет собирать эти факты в одну аналитику.

---

## 4. Новая таблица

Добавить entity:

```txt
apps/api/src/modules/analytics/miniapp-client-revenue.entity.ts
```

Таблица:

```txt
miniapp_client_revenue
```

Назначение таблицы:

```txt
Хранить нормализованные факты посещений и оплат клиентов, которые открывали miniapp.
```

---

## 5. Поля таблицы

Минимальная entity:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const numberTransformer = {
  to(value?: number | null) {
    return value ?? null;
  },
  from(value?: string | number | null) {
    return value == null ? null : Number(value);
  },
};

export enum MiniappClientRevenueStatus {
  VisitCompleted = 'visit_completed',
  PaymentReceived = 'payment_received',
}

export enum MiniappClientRevenueItemType {
  Service = 'service',
  GoodsTransaction = 'goods_transaction',
  Unknown = 'unknown',
}

@Index('IDX_miniapp_client_revenue_yclients_event_unique', ['yclients_event_id'], {
  unique: true,
  where: `"yclients_event_id" IS NOT NULL`,
})
@Entity('miniapp_client_revenue')
export class MiniappClientRevenue {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Index()
  @Column({type: 'bigint', nullable: true})
  customer_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_client_id: number | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  phone: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  company_id: number | null;

  @Index()
  @Column({type: 'varchar', nullable: true})
  miniapp_slug: string | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_record_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_visit_id: number | null;

  @Index()
  @Column({type: 'bigint', nullable: true})
  yclients_event_id: number | null;

  @Index()
  @Column({type: 'int', nullable: true})
  yclients_finance_operation_id: number | null;

  @Column({type: 'int', nullable: true})
  document_id: number | null;

  @Column({type: 'int', nullable: true})
  sold_item_id: number | null;

  @Column({type: 'varchar', length: 64, default: MiniappClientRevenueItemType.Unknown})
  sold_item_type: MiniappClientRevenueItemType;

  @Column({type: 'varchar', nullable: true})
  service_title: string | null;

  @Column({type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numberTransformer})
  amount: number | null;

  @Column({type: 'varchar', length: 64})
  source: 'visit' | 'payment';

  @Column({type: 'varchar', length: 64})
  status: MiniappClientRevenueStatus;

  @Column({type: 'timestamptz'})
  happened_at: Date;

  @Column({type: 'jsonb', nullable: true})
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({type: 'timestamptz'})
  date_created: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  date_updated: Date;
}
```

---

## 6. Почему такая модель

### 6.1. Зачем `source`

```txt
source = 'visit'
```

Факт успешного посещения, пришёл из `record` webhook с `attendance = 1`.

```txt
source = 'payment'
```

Факт оплаты, пришёл из `finances_operation` webhook с `amount > 0`.

---

### 6.2. Зачем `status`

`status` нужен для читаемости аналитики и будущих фильтров:

```txt
visit_completed
payment_received
```

---

### 6.3. Зачем nullable `amount`

У `record` webhook нет суммы. Поэтому запись о посещении может иметь:

```txt
amount = null
source = visit
status = visit_completed
```

А запись об оплате:

```txt
amount = 3000
source = payment
status = payment_received
```

---

### 6.4. Зачем `service_title`

В последних webhook-ах `finances_operation` часто содержит только:

```txt
sold_item_id
sold_item_type
amount
record_id
visit_id
```

Название услуги в payload может отсутствовать.

Поэтому `service_title` nullable.

Если название можно достать из payload — сохраняем. Если нельзя — fallback:

```txt
Услуга #<sold_item_id>
```

или `null`, если продукт решит не показывать неизвестные названия.

---

## 7. Кого включать в таблицу

Запись в `miniapp_client_revenue` создаём только если клиент связан с miniapp-аудиторией.

Клиент считается miniapp-аудиторией, если выполняется хотя бы одно условие:

1. Есть `miniapp_bookings.yclients_record_id = yclients record_id`.
2. Есть `miniapp_bookings.customer_id`, и customer совпадает по телефону с webhook client phone.
3. Есть `analytics_events`:
   - `event_name = 'visit'`;
   - `customer_id` совпадает с Telegram customer;
   - `company_id` совпадает с YClients company id, если он есть.
4. Есть `TelegramCustomer.phone`, совпадающий с webhook client phone, и у этого customer есть хотя бы один `visit` event.

Главный практический путь:

```txt
YClients webhook client.phone -> normalizePhone -> TelegramCustomer.phone -> analytics_events.visit
```

Если удалось найти miniapp booking по `yclients_record_id`, это самый сильный матч.

---

## 8. Heuristics для записи данных

### 8.1. Успешное посещение

Webhook:

```txt
resource = 'record'
status IN ('create', 'update')
attendance/visit_attendance = 1
deleted = false
```

Действие:

- найти miniapp-аудиторию;
- создать/обновить `miniapp_client_revenue` с:
  - `source = 'visit'`;
  - `status = 'visit_completed'`;
  - `amount = null`;
  - `yclients_record_id = payload.resource_id`;
  - `yclients_visit_id = payload.data.visit_id`;
  - `yclients_client_id = payload.data.client.id`;
  - `phone = normalized client phone`;
  - `company_id = payload.company_id ?? payload.data.company_id`;
  - `happened_at = yclients_event.date_created`.

Deduplication:

```txt
source + yclients_record_id
```

То есть по одной записи не создавать несколько visit rows, даже если YClients пришлёт несколько `record.update` с `attendance = 1`.

---

### 8.2. Оплата

Webhook:

```txt
resource = 'finances_operation'
status IN ('create', 'update')
amount > 0
data.deleted IS NOT true
```

Действие:

- найти miniapp-аудиторию;
- создать/обновить `miniapp_client_revenue` с:
  - `source = 'payment'`;
  - `status = 'payment_received'`;
  - `amount = payload.data.amount`;
  - `yclients_finance_operation_id = payload.resource_id`;
  - `yclients_event_id = yclients_event.id`;
  - `yclients_record_id = payload.data.record_id`;
  - `yclients_visit_id = payload.data.visit_id`;
  - `document_id = payload.data.document_id`;
  - `sold_item_id = payload.data.sold_item_id`;
  - `sold_item_type = payload.data.sold_item_type`;
  - `service_title = extracted title or null`;
  - `happened_at = yclients_event.date_created`.

Deduplication:

Primary:

```txt
yclients_finance_operation_id
```

Fallback:

```txt
source + yclients_record_id + sold_item_id + amount + document_id
```

Почему важно: в выгрузке есть `finances_operation.create` и `finances_operation.update` по одной финансовой операции. Нельзя удваивать сумму.

---

### 8.3. Оплата пришла до успешного посещения

Это нормальный сценарий.

Если пришла оплата, но ещё нет `record.update attendance = 1`:

- всё равно записываем payment row, если клиент относится к miniapp-аудитории;
- когда позже придёт `record.update attendance = 1`, добавится visit row;
- dashboard payments уже сможет учитывать оплату.

---

### 8.4. Успешное посещение пришло без оплаты

Это тоже нормальный сценарий.

Создаём visit row с `amount = null`.

В график оплат оно не попадёт, но может использоваться для аудита посещений.

---

### 8.5. Оплата клиента, который не открывал miniapp

Не записывать в `miniapp_client_revenue`.

Новая логика dashboard — “все клиенты, которые открывали miniapp”, а не все клиенты YClients вообще.

---

## 9. Где реализовать

### 9.1. Новый сервис

Добавить:

```txt
apps/api/src/modules/analytics/miniapp-client-revenue.service.ts
```

Ответственность:

- принимать сохранённый `YclientsEvent` и payload;
- определять, нужно ли создать revenue row;
- искать miniapp-аудиторию;
- делать upsert в `miniapp_client_revenue`.

Пример API сервиса:

```ts
@Injectable()
export class MiniappClientRevenueService {
  constructor(
    @InjectRepository(MiniappClientRevenue)
    private readonly revenue: Repository<MiniappClientRevenue>,

    @InjectRepository(MiniappBooking)
    private readonly bookings: Repository<MiniappBooking>,

    @InjectRepository(TelegramCustomer)
    private readonly customers: Repository<TelegramCustomer>,

    @InjectRepository(AnalyticsEvent)
    private readonly events: Repository<AnalyticsEvent>,
  ) {}

  async syncFromYclientsEvent(event: YclientsEvent, payload: YClientRequest) {
    if (this.isCompletedRecord(payload)) {
      await this.upsertVisitCompleted(event, payload);
      return;
    }

    if (this.isPayment(payload)) {
      await this.upsertPayment(event, payload);
    }
  }
}
```

---

### 9.2. Подключение в `AnalyticsModule`

Файл:

```txt
apps/api/src/modules/analytics/analytics.module.ts
```

Добавить:

```ts
TypeOrmModule.forFeature([
  AnalyticsEvent,
  TelegramCustomer,
  LoyaltyTransaction,
  MiniappBooking,
  MiniappClientRevenue,
])
```

И provider:

```ts
providers: [AnalyticsService, MiniappClientRevenueService],
exports: [AnalyticsService, MiniappClientRevenueService],
```

---

### 9.3. Подключение в `CustomerLoyaltyModule`

Файл:

```txt
apps/api/src/modules/customer-loyalty/customer-loyalty.module.ts
```

Так как `YclientsEventsService` уже живёт в `CustomerLoyaltyModule`, можно:

```ts
imports: [
  TypeOrmModule.forFeature([...]),
  TelegramCustomerModule,
  SendpulseModule,
  AnalyticsModule,
]
```

`AnalyticsModule` уже импортирован, поэтому достаточно экспортировать `MiniappClientRevenueService` из `AnalyticsModule`.

---

### 9.4. Вызов из webhook service

Файл:

```txt
apps/api/src/modules/customer-loyalty/yclients-events.service.ts
```

В constructor добавить:

```ts
private readonly miniappClientRevenue: MiniappClientRevenueService,
```

В `saveWebhookEvent` после сохранения `YclientsEvent`:

```ts
const event = await this.events.save(...);

await this.syncMiniappBookingStatusFromYclients(payload);

await this.miniappClientRevenue.syncFromYclientsEvent(event, payload);

await this.recordAnalyticsEvent(...);
```

Важно:

- если revenue sync упал, webhook не должен отвечать 500 без необходимости;
- лучше логировать ошибку, но не ломать сохранение webhook;
- если в проекте нет logger-паттерна, можно оставить fail-fast на первом этапе, но безопаснее не блокировать webhook.

Рекомендуемый вариант:

```ts
try {
  await this.miniappClientRevenue.syncFromYclientsEvent(event, payload);
} catch (error) {
  // log error, but do not reject webhook
}
```

---

## 10. Поиск miniapp-аудитории

Добавить метод:

```ts
private async resolveMiniappAudience(payload: YClientRequest): Promise<{
  customerId: number | null;
  miniappSlug: string | null;
  companyId: number | null;
} | null>
```

Алгоритм:

### 10.1. По record id

Если есть record id:

```ts
const recordId =
  payload.resource === 'record'
    ? payload.resource_id ?? payload.data?.id
    : payload.data?.record_id;
```

Ищем booking:

```ts
const booking = await this.bookings.findOne({
  where: {yclients_record_id: recordId},
  relations: ['miniapp', 'customer'],
});
```

Если найден:

```ts
return {
  customerId: booking.customer.id,
  miniappSlug: booking.miniapp.slug,
  companyId,
};
```

Это самый точный матч.

---

### 10.2. По телефону

Если booking не найден:

1. Нормализовать `payload.data.client.phone`.
2. Найти `TelegramCustomer` по телефону.
3. Проверить, что у customer есть `analytics_events.visit`.

```ts
const visit = await this.events.findOne({
  where: {
    event_name: 'visit',
    customer_id: String(customer.id),
    company_id: companyId,
  },
  order: {date_created: 'DESC'},
});
```

Если `company_id` отсутствует — искать без него, но это fallback.

---

### 10.3. Если аудитория не найдена

Не создавать строку в `miniapp_client_revenue`.

---

## 11. Extractors

Добавить маленькие pure functions, чтобы не размазывать JSON-логику:

```txt
apps/api/src/modules/analytics/miniapp-client-revenue.mapper.ts
```

Пример:

```ts
export function isCompletedYclientsRecord(payload: YClientRequest) {
  if (payload.resource !== 'record') return false;

  const attendance = payload.data?.visit_attendance ?? payload.data?.attendance;

  return (
    ['create', 'update'].includes(payload.status ?? '') &&
    payload.data?.deleted !== true &&
    attendance === 1
  );
}

export function isYclientsPayment(payload: YClientRequest) {
  const amount = Number(payload.data?.amount ?? 0);

  return (
    payload.resource === 'finances_operation' &&
    ['create', 'update'].includes(payload.status ?? '') &&
    payload.data?.deleted !== true &&
    Number.isFinite(amount) &&
    amount > 0
  );
}

export function getYclientsRecordId(payload: YClientRequest) {
  if (payload.resource === 'record') {
    return toInt(payload.resource_id) ?? toInt(payload.data?.id);
  }

  return toInt(payload.data?.record_id);
}

export function getYclientsVisitId(payload: YClientRequest) {
  return toInt(payload.data?.visit_id);
}

export function extractServiceTitle(payload: YClientRequest) {
  const data = payload.data as any;

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
```

В `YclientsEventsService` уже есть похожий `extractServiceTitle`, можно вынести его и переиспользовать, а не дублировать.

---

## 12. Миграции

### 12.1. Schema migration

Создать таблицу:

```txt
apps/api/src/migrations/<timestamp>CreateMiniappClientRevenue.ts
```

Пример SQL:

```ts
await queryRunner.query(`
  CREATE TABLE "miniapp_client_revenue" (
    "id" BIGSERIAL PRIMARY KEY,
    "customer_id" BIGINT NULL,
    "yclients_client_id" INT NULL,
    "phone" VARCHAR NULL,
    "company_id" INT NULL,
    "miniapp_slug" VARCHAR NULL,
    "yclients_record_id" INT NULL,
    "yclients_visit_id" INT NULL,
    "yclients_event_id" BIGINT NULL,
    "yclients_finance_operation_id" INT NULL,
    "document_id" INT NULL,
    "sold_item_id" INT NULL,
    "sold_item_type" VARCHAR(64) NOT NULL DEFAULT 'unknown',
    "service_title" VARCHAR NULL,
    "amount" NUMERIC(12,2) NULL,
    "source" VARCHAR(64) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "happened_at" TIMESTAMPTZ NOT NULL,
    "metadata" JSONB NULL,
    "date_created" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "date_updated" TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

await queryRunner.query(`
  CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_yclients_event_unique"
  ON "miniapp_client_revenue" ("yclients_event_id")
  WHERE "yclients_event_id" IS NOT NULL
`);

await queryRunner.query(`
  CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_finance_operation_unique"
  ON "miniapp_client_revenue" ("yclients_finance_operation_id")
  WHERE "yclients_finance_operation_id" IS NOT NULL AND "source" = 'payment'
`);

await queryRunner.query(`
  CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_visit_record_unique"
  ON "miniapp_client_revenue" ("yclients_record_id")
  WHERE "yclients_record_id" IS NOT NULL AND "source" = 'visit'
`);

await queryRunner.query(`
  CREATE INDEX "IDX_miniapp_client_revenue_period"
  ON "miniapp_client_revenue" ("happened_at")
`);

await queryRunner.query(`
  CREATE INDEX "IDX_miniapp_client_revenue_company"
  ON "miniapp_client_revenue" ("company_id")
`);

await queryRunner.query(`
  CREATE INDEX "IDX_miniapp_client_revenue_source"
  ON "miniapp_client_revenue" ("source")
`);

await queryRunner.query(`
  CREATE INDEX "IDX_miniapp_client_revenue_record"
  ON "miniapp_client_revenue" ("yclients_record_id")
`);

await queryRunner.query(`
  CREATE INDEX "IDX_miniapp_client_revenue_visit"
  ON "miniapp_client_revenue" ("yclients_visit_id")
`);
```

---

### 12.2. Backfill migration

Создать data migration:

```txt
apps/api/src/migrations/<timestamp>BackfillMiniappClientRevenueFromYclientsEvents.ts
```

Задача:

- пройти по старым `yclients_events`;
- взять:
  - completed visits из `record`;
  - payments из `finances_operation`;
- оставить только клиентов, которые связаны с miniapp-аудиторией;
- вставить строки в `miniapp_client_revenue`;
- не задвоить платежи.

Backfill лучше писать SQL-first, но для MVP можно сделать TS loop, потому что логика матчинга по телефону/booking сложнее.

Рекомендуемый подход:

1. Сначала backfill по точному `miniapp_bookings.yclients_record_id`.
2. Потом отдельным шагом backfill по телефону + `analytics_events.visit`.

#### Шаг 1: точный матч по booking

```sql
INSERT INTO miniapp_client_revenue (
  customer_id,
  yclients_client_id,
  phone,
  company_id,
  miniapp_slug,
  yclients_record_id,
  yclients_visit_id,
  yclients_event_id,
  yclients_finance_operation_id,
  document_id,
  sold_item_id,
  sold_item_type,
  service_title,
  amount,
  source,
  status,
  happened_at,
  metadata
)
SELECT
  b.customer_id,
  NULLIF(e.json #>> '{data,client,id}', '')::int AS yclients_client_id,
  e.phone,
  e.company_id,
  m.slug AS miniapp_slug,
  COALESCE(NULLIF(e.json #>> '{data,record_id}', '')::int, e.resource_id) AS yclients_record_id,
  NULLIF(e.json #>> '{data,visit_id}', '')::int AS yclients_visit_id,
  e.id AS yclients_event_id,
  CASE
    WHEN e.resource = 'finances_operation' THEN e.resource_id
    ELSE NULL
  END AS yclients_finance_operation_id,
  NULLIF(e.json #>> '{data,document_id}', '')::int AS document_id,
  NULLIF(e.json #>> '{data,sold_item_id}', '')::int AS sold_item_id,
  COALESCE(e.json #>> '{data,sold_item_type}', 'unknown') AS sold_item_type,
  NULL AS service_title,
  CASE
    WHEN e.resource = 'finances_operation' THEN e.amount
    ELSE NULL
  END AS amount,
  CASE
    WHEN e.resource = 'finances_operation' THEN 'payment'
    ELSE 'visit'
  END AS source,
  CASE
    WHEN e.resource = 'finances_operation' THEN 'payment_received'
    ELSE 'visit_completed'
  END AS status,
  e.date_created AS happened_at,
  jsonb_build_object(
    'yclients_event_name', e.event_name,
    'yclients_status', e.status,
    'raw_event_id', e.id
  ) AS metadata
FROM yclients_events e
JOIN miniapp_bookings b
  ON b.yclients_record_id = COALESCE(
    NULLIF(e.json #>> '{data,record_id}', '')::int,
    e.resource_id
  )
JOIN miniapps m
  ON m.id = b.miniapp_id
WHERE (
    e.resource = 'record'
    AND COALESCE(
      NULLIF(e.json #>> '{data,visit_attendance}', '')::int,
      NULLIF(e.json #>> '{data,attendance}', '')::int
    ) = 1
  )
  OR (
    e.resource = 'finances_operation'
    AND e.amount > 0
  )
ON CONFLICT DO NOTHING;
```

Проверить реальные имена join columns:
- `miniapp_bookings.customer_id`;
- `miniapp_bookings.miniapp_id`;
- `miniapps.slug`.

Если имена отличаются, адаптировать SQL под entity.

---

## 13. Dashboard backend

Файл:

```txt
apps/api/src/modules/analytics/analytics.service.ts
```

### 13.1. Добавить repository

```ts
@InjectRepository(MiniappClientRevenue)
private readonly miniappRevenue: Repository<MiniappClientRevenue>,
```

---

### 13.2. Заменить график оплат

Сейчас график оплат строится через:

```ts
referralTransactionPaymentsByDay(start, end)
```

Нужно сделать новый метод:

```ts
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
```

В `getDashboard` заменить:

```ts
referralTransactionPaymentsByDay(range.start, range.end)
```

на:

```ts
miniappClientPaymentsByDay(range.start, range.end)
```

Можно оставить поле в response как `referral_payments`, чтобы не ломать frontend сразу, но лучше добавить новое поле.

---

### 13.3. Заменить сумму оплат

Сейчас сумма оплат:

```ts
sumReferralTransactionPayments(start, end)
```

Новый метод:

```ts
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
```

В `getDashboard` заменить источник `paymentTotal`.

---

### 13.4. Заменить “Услуги и суммы”

Сейчас:

```ts
referralTransactionServices(start, end)
```

Новый метод:

```ts
private async miniappClientRevenueServices(start: Date, end: Date) {
  const rows = await this.miniappRevenue
    .createQueryBuilder('revenue')
    .select('revenue.id', 'id')
    .addSelect(
      `
        COALESCE(
          revenue.service_title,
          CASE
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
    .where('revenue.source = :source', {source: 'payment'})
    .andWhere('revenue.happened_at BETWEEN :start AND :end', {start, end})
    .orderBy('revenue.happened_at', 'DESC')
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
```

---

## 14. Dashboard DTO

Файл:

```txt
apps/api/src/interfaces/admin/dashboard/dto/dashboard.dto.ts
```

Текущие поля можно оставить для совместимости:

```ts
referral_payments_amount
referral_payments
payment_services
```

Но лучше добавить новые поля:

```ts
miniapp_payments_amount: number;
```

В `DashboardSeriesItem` добавить:

```ts
miniapp_payments: number;
```

Если frontend не готов к новым полям, временно можно маппить новые данные в старые поля:

```ts
referral_payments_amount: miniappPaymentTotal
series.referral_payments: miniappPaymentsByDay
payment_services: miniappRevenueServices
```

Self-review: лучше добавить новые поля и потом перейти frontend на них, но для минимального изменения можно переиспользовать старые поля.

---

## 15. Dashboard frontend

Нижние блоки:

### 15.1. График оплат

Источник:

```ts
series[].miniapp_payments
```

или временно:

```ts
series[].referral_payments
```

Заголовок желательно поменять:

```txt
Оплаты клиентов
```

### 15.2. Услуги и суммы

Источник:

```ts
payment_services
```

Но теперь это не referral services, а строки из `miniapp_client_revenue`.

Если DTO переименовываем:

```ts
miniapp_payment_services
```

---

## 16. Что делать с `loyalty_transactions`

Не удалять.

`loyalty_transactions` продолжает отвечать за:

- начисления referral bonuses;
- старую referral-аналитику;
- бизнес-логику лояльности.

Новые dashboard-блоки просто перестают использовать её как источник.

---

## 17. Что делать с `YclientsEventsProcessor`

Если в проекте есть processor, который обрабатывает `yclients_events.processed`, не переносить новую логику туда без необходимости.

Причина:

- webhook уже сохраняется синхронно;
- dashboard должен обновляться близко к real-time;
- новая таблица может заполняться сразу после сохранения event.

Но если в проекте уже есть стабильная batch-обработка webhook-ов, можно использовать её. Главное — не дублировать логику одновременно и в webhook, и в processor без idempotency.

---

## 18. Idempotency

Обязательно обеспечить защиту от дублей.

### Для payment rows

Основной ключ:

```txt
yclients_finance_operation_id
```

или:

```txt
yclients_event_id
```

Но если `create` и `update` приходят по одной операции, `yclients_event_id` будет разный. Поэтому лучше:

```txt
yclients_finance_operation_id = payload.resource_id
```

Уникальный индекс:

```sql
CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_finance_operation_unique"
ON "miniapp_client_revenue" ("yclients_finance_operation_id")
WHERE "yclients_finance_operation_id" IS NOT NULL AND "source" = 'payment';
```

### Для visit rows

Основной ключ:

```txt
yclients_record_id + source='visit'
```

Уникальный индекс:

```sql
CREATE UNIQUE INDEX "IDX_miniapp_client_revenue_visit_record_unique"
ON "miniapp_client_revenue" ("yclients_record_id")
WHERE "yclients_record_id" IS NOT NULL AND "source" = 'visit';
```

---

## 19. Обработка `finances_operation.update`

В текущем `YclientsEventsService` payment event сейчас может быть завязан только на `status = create`.

Для новой таблицы обязательно учитывать:

```txt
finances_operation.create
finances_operation.update
```

Правило:

```ts
payload.resource === 'finances_operation' &&
['create', 'update'].includes(payload.status ?? '') &&
amount > 0
```

При `update` делать upsert по `yclients_finance_operation_id`.

---

## 20. Service title

В выгрузке `finances_operation` часто содержит только:

```txt
sold_item_id
sold_item_type
amount
```

Название услуги может отсутствовать.

Fallback-стратегия:

1. Пробуем извлечь title из payload:
   - `data.service_title`;
   - `data.service.title`;
   - `data.service.name`;
   - `data.services[0].title`;
   - `data.goods_transactions[0].service.title`;
   - `data.goods_transactions[0].title`;
   - `data.title`.
2. Если title нет:
   - если `sold_item_type = 'service'`, показываем `Услуга #<sold_item_id>`;
   - если `sold_item_type = 'goods_transaction'`, показываем `Товар #<sold_item_id>`;
   - иначе `null`.

---

## 21. Acceptance criteria

### Webhook

- При `record.update` / `record.create` с `attendance = 1` создаётся visit row в `miniapp_client_revenue`, если клиент относится к miniapp-аудитории.
- При `finances_operation.create` с `amount > 0` создаётся payment row.
- При `finances_operation.update` по той же операции строка обновляется, а не дублируется.
- Клиенты, которые не открывали miniapp, не попадают в `miniapp_client_revenue`.
- Повторные webhook-и не создают дубли.

### Dashboard

- Нижний график оплат строится из `miniapp_client_revenue`, а не из `loyalty_transactions`.
- “Услуги и суммы” строятся из `miniapp_client_revenue`, а не из `loyalty_transactions`.
- Данные включают всех клиентов, которые открывали miniapp, а не только referral-клиентов.
- Старые referral bonus механики не ломаются.

### Backfill

- Backfill заполняет `miniapp_client_revenue` из старых `yclients_events`.
- Backfill учитывает:
  - `record` с `attendance = 1`;
  - `finances_operation` с `amount > 0`;
  - `create` и `update`;
  - связь по `record_id`, `visit_id`, phone.
- Backfill idempotent: повторный запуск не создаёт дубли.

---

## 22. Проверочные SQL

### Распределение новых записей

```sql
SELECT
  source,
  status,
  COUNT(*) AS count,
  COALESCE(SUM(amount), 0) AS amount
FROM miniapp_client_revenue
GROUP BY source, status
ORDER BY source, status;
```

### Проверить платежи по дням

```sql
SELECT
  to_char(date_trunc('day', happened_at), 'YYYY-MM-DD') AS day,
  COUNT(*) AS payments_count,
  SUM(amount) AS payments_amount
FROM miniapp_client_revenue
WHERE source = 'payment'
GROUP BY date_trunc('day', happened_at)
ORDER BY day DESC;
```

### Проверить дубли финансовых операций

```sql
SELECT
  yclients_finance_operation_id,
  COUNT(*) AS count
FROM miniapp_client_revenue
WHERE source = 'payment'
  AND yclients_finance_operation_id IS NOT NULL
GROUP BY yclients_finance_operation_id
HAVING COUNT(*) > 1;
```

### Проверить visit-дубли

```sql
SELECT
  yclients_record_id,
  COUNT(*) AS count
FROM miniapp_client_revenue
WHERE source = 'visit'
  AND yclients_record_id IS NOT NULL
GROUP BY yclients_record_id
HAVING COUNT(*) > 1;
```

### Сравнить с webhook payments

```sql
SELECT
  COUNT(*) AS webhook_payments,
  SUM(amount) AS webhook_amount
FROM yclients_events
WHERE resource = 'finances_operation'
  AND amount > 0;
```

```sql
SELECT
  COUNT(*) AS normalized_payments,
  SUM(amount) AS normalized_amount
FROM miniapp_client_revenue
WHERE source = 'payment';
```

Разница ожидаема, потому что новая таблица должна включать только клиентов, которые открывали miniapp.

---

## 23. Тесты

Добавить unit-тесты для mapper:

```txt
apps/api/src/modules/analytics/miniapp-client-revenue.mapper.spec.ts
```

Кейсы:

```txt
record attendance=1 -> visit_completed
record visit_attendance=1 -> visit_completed
record attendance=0 -> ignore
record attendance=2 -> ignore
record attendance=-1 -> ignore
finances_operation create amount>0 -> payment_received
finances_operation update amount>0 -> payment_received
finances_operation amount=0 -> ignore
finances_operation deleted=true -> ignore
```

Добавить service tests, если есть test infra:

```txt
- payment create inserts row
- payment update updates same row
- completed record inserts only one visit row
- client without miniapp visit is ignored
- booking by yclients_record_id has priority over phone matching
```

---

## 24. Команды проверки

```sh
pnpm -F api typecheck
pnpm -F api test
pnpm -F api migration:run
pnpm -F api-client generate
pnpm -F miniapp build
```

Если есть отдельный admin/cms build — прогнать его тоже.

---

## 25. Self-review

### Что не усложняем

- Не удаляем referral analytics.
- Не переписываем `loyalty_transactions`.
- Не делаем внешний sync с YClients API.
- Не пытаемся восстановить service title через дополнительный API-запрос.
- Не блокируем webhook, если revenue-normalization временно не смогла сматчить клиента.

### Что обязательно

- Новая таблица должна быть idempotent.
- Учитывать `finances_operation.create` и `finances_operation.update`.
- Не считать всех клиентов YClients — только тех, кто открывал miniapp.
- Не строить нижние блоки dashboard из `loyalty_transactions`.
- Не удваивать суммы при повторных webhook-ах.
- Не привязывать новую аналитику к referral-коду/referrer.

### Главный риск

В webhook-ах не всегда есть название услуги. Есть `sold_item_id`, `sold_item_type`, `amount`, `record_id`, `visit_id`, но title часто отсутствует. Поэтому для блока “Услуги и суммы” нужно принять fallback:

```txt
Услуга #sold_item_id
```

или добавить отдельную фазу enrich через YClients API позже.

### Второй риск

Матчинг “клиент открывал miniapp” по телефону зависит от качества телефонов. Поэтому приоритет матчинга должен быть:

```txt
1. miniapp_bookings.yclients_record_id
2. TelegramCustomer.phone + analytics_events.visit
3. только phone без visit — не подходит
```
