# Спека: статусы miniapp-записей, dashboard и webhook YClients

## 0. Контекст

Репозиторий: `alex-misch/integrator`.

Архитектура проекта:

- `apps/api` — NestJS API, TypeORM, Swagger DTO.
- `apps/miniapp` — Vite/React miniapp.
- `packages/api-client` — генерируемый API-клиент.
- Миграции TypeORM лежат в `apps/api/src/migrations`.
- После изменения API/DTO нужно перегенерировать API client.

Команды:

```sh
pnpm -F api migration:run
pnpm -F api-client generate
pnpm -F api typecheck
pnpm -F miniapp build
```

---

## 1. Цель задачи

Нужно доработать статусы записей и их отображение:

1. В dashboard оставить верхнюю полосу метрик как есть.
2. В метрике `"записались"` показывать:
   - общее количество записей через miniapp;
   - сколько дошли;
   - сколько отменили.
3. Статусы записей синхронизировать из webhook YClients.
4. Для старых записей сделать data migration, которая проставит статус по последнему webhook из `yclients_events`.
5. В списке записей убрать фильтр “только по рефералам”.
6. В miniapp для завершённой записи показывать бейдж `"архив"`.

---

## 2. Что уже есть в проекте

### 2.1. Miniapp-записи

Файл:

```txt
apps/api/src/modules/miniapp/miniapp-booking.entity.ts
```

Таблица:

```txt
miniapp_bookings
```

Entity уже содержит нужный enum:

```ts
export enum MiniappBookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Canceled = 'canceled',
  Completed = 'completed',
}
```

Ключевые поля:

```ts
@Column({type: 'varchar', length: 32, default: MiniappBookingStatus.Pending})
status: MiniappBookingStatus;

@Column({type: 'integer', nullable: true})
yclients_record_id: number | null;

@Column({type: 'varchar', length: 128, nullable: true})
yclients_record_hash: string | null;
```

Вывод: новый статус `completed` добавлять не нужно. Он уже есть. Схемная миграция для enum не нужна, потому что статус хранится как `varchar`.

---

### 2.2. Webhook-и YClients

Файл entity:

```txt
apps/api/src/modules/customer-loyalty/yclients-event.entity.ts
```

Таблица:

```txt
yclients_events
```

Ключевые поля:

```txt
id
phone
event_name
resource
resource_id
status
amount
company_id
processed
process_error
date_processed
json
date_created
date_updated
```

Webhook endpoint:

```txt
apps/api/src/interfaces/pub/webhook/webhook.controller.ts
```

Сейчас:

```ts
@All('yclients')
@HttpCode(200)
async yclients(@Body() payload: YClientRequest) {
  return this.yclientsEvents.saveWebhookEvent(payload);
}
```

Основной сервис:

```txt
apps/api/src/modules/customer-loyalty/yclients-events.service.ts
```

Сейчас `saveWebhookEvent`:

1. валидирует payload;
2. нормализует телефон;
3. сохраняет событие в `yclients_events`;
4. пишет referral analytics.

Эту архитектуру оставляем. Не создаём новый webhook controller.

---

## 3. Анализ payload YClients

По последним событиям из `yclients_events`:

- record-события приходят как `resource = 'record'`;
- оплаты приходят как `resource = 'finances_operation'`;
- верхнеуровневый `status` — это тип события webhook: `create` или `update`;
- бизнес-статус записи лежит не в `status`, а в:
  - `json.data.attendance`;
  - `json.data.visit_attendance`;
  - `json.data.deleted`.

Референсный payload:

```json
{
  "resource": "record",
  "status": "update",
  "resource_id": 1680739923,
  "company_id": 122686,
  "data": {
    "id": 1680739923,
    "visit_id": 1463687220,
    "attendance": 1,
    "visit_attendance": 1,
    "deleted": false,
    "paid_full": 1,
    "client": {
      "id": 210562865,
      "phone": "+79653605355",
      "display_name": "..."
    }
  }
}
```

Важно: `payload.status` нельзя использовать как статус записи. Это только тип события webhook.

---

## 4. Бизнес-логика статусов

Используем существующий enum `MiniappBookingStatus`.

Маппинг YClients -> miniapp booking:

```txt
deleted = true       -> canceled
attendance = -1      -> canceled
attendance = 1       -> completed
attendance = 0       -> confirmed
attendance = 2       -> confirmed
unknown/null         -> статус не трогаем
```

Приоритет:

```ts
const attendance = payload.data?.visit_attendance ?? payload.data?.attendance;
```

То есть `visit_attendance` важнее, если он есть.

---

## 5. Общий mapper для webhook

Добавить файл:

```txt
apps/api/src/modules/customer-loyalty/yclients-record-status.ts
```

Содержимое:

```ts
import {MiniappBookingStatus} from '../miniapp/miniapp-booking.entity';
import {YClientRequest} from './yclients-webhook.types';

export function mapYclientsRecordPayloadToBookingStatus(
  payload: YClientRequest,
): MiniappBookingStatus | null {
  if (payload.resource !== 'record') {
    return null;
  }

  if (!['create', 'update', 'delete'].includes(payload.status ?? '')) {
    return null;
  }

  const data = payload.data;
  if (!data) {
    return null;
  }

  const attendance = data.visit_attendance ?? data.attendance;

  if (data.deleted === true || attendance === -1) {
    return MiniappBookingStatus.Canceled;
  }

  if (attendance === 1) {
    return MiniappBookingStatus.Completed;
  }

  if (attendance === 0 || attendance === 2) {
    return MiniappBookingStatus.Confirmed;
  }

  return null;
}

export function getYclientsRecordIdFromPayload(
  payload: YClientRequest,
): number | null {
  const value = payload.resource_id ?? payload.data?.id;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}
```

Если в `YClientRequest` нет полей `attendance`, `visit_attendance`, `deleted`, обновить тип:

```txt
apps/api/src/modules/customer-loyalty/yclients-webhook.types.ts
```

---

## 6. Webhook: обновление `miniapp_bookings`

### 6.1. Подключить `MiniappBooking` в `CustomerLoyaltyModule`

Файл:

```txt
apps/api/src/modules/customer-loyalty/customer-loyalty.module.ts
```

Добавить import:

```ts
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
```

В `TypeOrmModule.forFeature` добавить `MiniappBooking`:

```ts
TypeOrmModule.forFeature([
  LoyaltyTransaction,
  YclientsEvent,
  TelegramCustomer,
  SendpulseClient,
  MiniappBooking,
])
```

Не нужно импортировать `MiniappModule`, достаточно `forFeature`.

---

### 6.2. Обновить `YclientsEventsService`

Файл:

```txt
apps/api/src/modules/customer-loyalty/yclients-events.service.ts
```

Добавить imports:

```ts
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
import {
  getYclientsRecordIdFromPayload,
  mapYclientsRecordPayloadToBookingStatus,
} from './yclients-record-status';
```

В constructor добавить repository:

```ts
@InjectRepository(MiniappBooking)
private readonly bookings: Repository<MiniappBooking>,
```

В `saveWebhookEvent` после успешного сохранения события вызвать синхронизацию:

```ts
const event = await this.events.save(
  this.events.create({
    phone,
    event_name: eventName,
    resource: payload.resource ?? null,
    resource_id: resourceId,
    status: payload.status ?? null,
    amount,
    company_id: companyId,
    processed: false,
    json: this.reducePayload(payload),
  }),
);

await this.syncMiniappBookingStatusFromYclients(payload);

await this.recordAnalyticsEvent({
  payload,
  eventId: event.id,
  amount,
  phone,
  companyId,
  resourceId,
});
```

Добавить private method:

```ts
private async syncMiniappBookingStatusFromYclients(payload: YClientRequest) {
  const nextStatus = mapYclientsRecordPayloadToBookingStatus(payload);
  if (!nextStatus) {
    return;
  }

  const recordId = getYclientsRecordIdFromPayload(payload);
  if (!recordId) {
    return;
  }

  await this.bookings.update(
    {yclients_record_id: recordId},
    {status: nextStatus},
  );
}
```

Поведение:

- если webhook не `record`, ничего не делаем;
- если `recordId` не найден, ничего не делаем;
- если статус не распознан, ничего не делаем;
- если booking не найден, webhook всё равно считается успешно обработанным;
- endpoint должен продолжать возвращать `200`.

---

## 7. Важно: не переиспользовать текущий `isBookEvent`

В `YclientsEventsService` уже есть метод:

```ts
private isBookEvent(payload: YClientRequest): boolean {
  const data = payload?.data;
  return (
    payload?.resource === 'record' &&
    ['update', 'create'].includes(payload?.status ?? '') &&
    (data?.visit_id ?? 0) > 0 &&
    (data?.attendance === 2 || data?.visit_attendance === 2)
  );
}
```

Его не использовать для статусов miniapp-записей.

Причина:

- этот метод относится к referral analytics;
- он сейчас считает booking-событие только при `attendance === 2`;
- для статусов записей нужна другая логика:
  - `1 -> completed`;
  - `-1 -> canceled`;
  - `0/2 -> confirmed`.

В рамках этой задачи `isBookEvent` можно оставить как есть, чтобы не ломать referral analytics.

---

## 8. Backfill-миграция

Создать ручную data migration:

```txt
apps/api/src/migrations/<timestamp>BackfillMiniappBookingStatusesFromYclientsEvents.ts
```

Не использовать `migration:generate`, потому что это data migration, а не schema migration.

Миграция:

```ts
import {MigrationInterface, QueryRunner} from 'typeorm';

export class BackfillMiniappBookingStatusesFromYclientsEventsXXXXXXXXXXXX
  implements MigrationInterface
{
  name = 'BackfillMiniappBookingStatusesFromYclientsEventsXXXXXXXXXXXX';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH latest_record_events AS (
        SELECT DISTINCT ON (resource_id)
          resource_id AS yclients_record_id,
          json,
          date_created,
          id
        FROM yclients_events
        WHERE resource = 'record'
          AND resource_id IS NOT NULL
        ORDER BY resource_id, date_created DESC, id DESC
      ),
      mapped AS (
        SELECT
          yclients_record_id,
          CASE
            WHEN COALESCE((json #>> '{data,deleted}')::boolean, false) = true
              THEN 'canceled'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) = -1
              THEN 'canceled'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) = 1
              THEN 'completed'
            WHEN COALESCE(
              NULLIF(json #>> '{data,visit_attendance}', '')::int,
              NULLIF(json #>> '{data,attendance}', '')::int
            ) IN (0, 2)
              THEN 'confirmed'
            ELSE NULL
          END AS next_status
        FROM latest_record_events
      )
      UPDATE miniapp_bookings b
      SET
        status = mapped.next_status,
        date_updated = NOW()
      FROM mapped
      WHERE b.yclients_record_id = mapped.yclients_record_id
        AND mapped.next_status IS NOT NULL
        AND b.status IS DISTINCT FROM mapped.next_status
    `);
  }

  public async down(): Promise<void> {
    // noop: status backfill cannot be safely reverted
  }
}
```

Почему SQL внутри миграции:

- миграция не зависит от runtime-сервисов;
- не ломается при будущих рефакторах;
- быстрее обновляет данные пачкой.

---

## 9. Dashboard backend

Текущий dashboard controller:

```txt
apps/api/src/interfaces/admin/dashboard/dashboard.controller.ts
```

Он вызывает:

```ts
return this.analytics.getDashboard(filter.period ?? '7d');
```

Текущий dashboard service:

```txt
apps/api/src/modules/analytics/analytics.service.ts
```

Сейчас `"записались"` фактически считается из referral/loyalty логики. По новому ТЗ нужно считать все записи из `miniapp_bookings`.

---

### 9.1. Подключить `MiniappBooking` в `AnalyticsModule`

Файл:

```txt
apps/api/src/modules/analytics/analytics.module.ts
```

Добавить import:

```ts
import {MiniappBooking} from '../miniapp/miniapp-booking.entity';
```

Добавить в `TypeOrmModule.forFeature`:

```ts
TypeOrmModule.forFeature([
  AnalyticsEvent,
  TelegramCustomer,
  LoyaltyTransaction,
  MiniappBooking,
])
```

---

### 9.2. Добавить repository в `AnalyticsService`

Файл:

```txt
apps/api/src/modules/analytics/analytics.service.ts
```

Добавить imports:

```ts
import {
  MiniappBooking,
  MiniappBookingStatus,
} from '../miniapp/miniapp-booking.entity';
```

В constructor добавить:

```ts
@InjectRepository(MiniappBooking)
private readonly bookings: Repository<MiniappBooking>,
```

---

### 9.3. Добавить метод статистики miniapp bookings

```ts
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
```

Dashboard уже работает с `period`, поэтому статистику считаем за выбранный период.

Если бизнесу нужно total за всё время, убрать `.where('booking.date_created BETWEEN :start AND :end')`.

---

### 9.4. Обновить `getDashboard`

Сейчас примерно:

```ts
const [totalCustomers, referralShares, referralOpenTotal, bookingTotal] =
  await Promise.all([
    this.customers.count(),
    this.countEvents('referral_share'),
    this.countWelcomeReferralTransactions(),
    this.countReferralTransactions(),
  ]);
```

Заменить на:

```ts
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
```

В `totals` добавить новые поля, старые не удалять:

```ts
totals: {
  unique_customers: totalCustomers,
  referral_shares: referralShares,
  referral_opens_total: referralOpenTotal,
  referral_bookings_total: referralBookingTotal,

  miniapp_bookings_total: miniappBookings.total,
  miniapp_bookings_completed: miniappBookings.completed,
  miniapp_bookings_canceled: miniappBookings.canceled,

  referral_payments_amount: paymentTotal,
}
```

Почему не заменять `referral_bookings_total`:

- это старое referral-поле;
- оно может использоваться графиками/аналитикой;
- новое ТЗ говорит про все miniapp-записи, поэтому добавляем отдельные поля.

---

## 10. Dashboard DTO

Файл:

```txt
apps/api/src/interfaces/admin/dashboard/dto/dashboard.dto.ts
```

В `DashboardCountersResponse.totals` добавить поля:

```ts
miniapp_bookings_total: number;
miniapp_bookings_completed: number;
miniapp_bookings_canceled: number;
```

Обновить Swagger example:

```ts
@ApiProperty({
  example: {
    unique_customers: 128,
    referral_shares: 45,
    referral_opens_total: 19,
    referral_bookings_total: 7,
    miniapp_bookings_total: 33,
    miniapp_bookings_completed: 21,
    miniapp_bookings_canceled: 4,
    referral_payments_amount: 45000,
  },
})
totals: {
  unique_customers: number;
  referral_shares: number;
  referral_opens_total: number;
  referral_bookings_total: number;
  miniapp_bookings_total: number;
  miniapp_bookings_completed: number;
  miniapp_bookings_canceled: number;
  referral_payments_amount: number;
};
```

После этого обязательно:

```sh
pnpm -F api-client generate
```

---

## 11. Dashboard frontend / admin

Найти компонент верхней полосы метрик dashboard.

Нужно оставить layout как есть.

В карточке `"записались"` использовать:

```ts
value = totals.miniapp_bookings_total
completed = totals.miniapp_bookings_completed
canceled = totals.miniapp_bookings_canceled
```

Пример:

```tsx
<MetricCard
  title="Записались"
  value={data.totals.miniapp_bookings_total}
  description={`Дошли: ${data.totals.miniapp_bookings_completed} · Отменили: ${data.totals.miniapp_bookings_canceled}`}
/>
```

Если текущий `MetricCard` не поддерживает `description`, добавить необязательный prop:

```ts
type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
};
```

Остальные карточки не менять.

---

## 12. Список записей: убрать фильтр только по рефералам

Нужно проверить admin/cms endpoint или frontend, который отображает список записей.

Искать фильтры вида:

```ts
referrer_customer_id IS NOT NULL
referral_code IS NOT NULL
tg_referrer IS NOT NULL
referred_client_record_id IS NOT NULL
source = 'referral_payment_bonus'
```

Для списка записей источник должен быть `miniapp_bookings`.

Если список сейчас строится через referral analytics или loyalty transactions, заменить источник на `MiniappBooking`.

Минимальная backend-логика для списка:

```ts
return this.bookingsRepository.find({
  relations: ['miniapp', 'customer', 'service', 'specialist'],
  order: {date_created: 'DESC'},
});
```

Если уже есть метод в `MiniappService`, расширить его, а не создавать параллельный сервис.

---

## 13. Miniapp: бейдж `архив`

Backend уже отдаёт статус в DTO:

Файл:

```txt
apps/api/src/interfaces/pub/miniapps/dto/miniapp-record.dto.ts
```

DTO:

```ts
export class MiniappPublicBookingDto {
  status: MiniappBookingStatus;
}
```

Endpoint-ы:

```txt
GET /api/public/miniapps/:slug/:companyId/bookings
GET /api/public/miniapps/:slug/:companyId/booking/:bookingId
```

В `apps/miniapp` найти mapper/компонент статуса записи.

Добавить:

```ts
const bookingStatusLabel: Record<string, string> = {
  pending: 'активная запись',
  confirmed: 'активная запись',
  canceled: 'отменена',
  completed: 'архив',
};
```

Если mapper уже существует, расширить существующий.

Правило:

```txt
booking.status === 'completed' -> бейдж "архив"
```

---

## 14. Потенциальный баг с `finances_operation.update`

В последних событиях встречаются оплаты с:

```txt
resource = finances_operation
status = update
```

Сейчас в `YclientsEventsService` payment определяется так:

```ts
payload.resource === 'finances_operation' && payload.status === 'create'
```

Это не относится напрямую к статусам записей, но потенциально ломает payment analytics.

В рамках этой задачи можно не трогать.

Если править рядом, безопасный вариант:

```ts
private isPaymentEvent(payload: YClientRequest, amount: number) {
  if (amount <= 0) {
    return false;
  }

  return (
    payload.resource === 'finances_operation' &&
    ['create', 'update'].includes(payload.status ?? '')
  );
}
```

Уникальность payment уже защищена index-ом на `yclients_events` по `resource_id`, когда `event_name = 'payment'`.

---

## 15. Тесты

Добавить unit-тесты для mapper:

```txt
apps/api/src/modules/customer-loyalty/yclients-record-status.spec.ts
```

Кейсы:

```ts
attendance = 1 -> completed
visit_attendance = 1 -> completed
attendance = -1 -> canceled
deleted = true -> canceled
attendance = 0 -> confirmed
attendance = 2 -> confirmed
resource = finances_operation -> null
unknown attendance -> null
```

Пример:

```ts
import {MiniappBookingStatus} from '../miniapp/miniapp-booking.entity';
import {mapYclientsRecordPayloadToBookingStatus} from './yclients-record-status';

describe('mapYclientsRecordPayloadToBookingStatus', () => {
  it('maps attendance=1 to completed', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'record',
        status: 'update',
        resource_id: 1,
        data: {
          id: 1,
          attendance: 1,
          visit_attendance: 1,
          deleted: false,
        },
      } as any),
    ).toBe(MiniappBookingStatus.Completed);
  });

  it('maps attendance=-1 to canceled', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'record',
        status: 'update',
        resource_id: 1,
        data: {
          id: 1,
          attendance: -1,
          visit_attendance: -1,
          deleted: false,
        },
      } as any),
    ).toBe(MiniappBookingStatus.Canceled);
  });

  it('maps deleted=true to canceled', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'record',
        status: 'update',
        resource_id: 1,
        data: {
          id: 1,
          attendance: 0,
          visit_attendance: 0,
          deleted: true,
        },
      } as any),
    ).toBe(MiniappBookingStatus.Canceled);
  });

  it('maps attendance=0 to confirmed', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'record',
        status: 'update',
        resource_id: 1,
        data: {
          id: 1,
          attendance: 0,
          visit_attendance: 0,
          deleted: false,
        },
      } as any),
    ).toBe(MiniappBookingStatus.Confirmed);
  });

  it('maps attendance=2 to confirmed', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'record',
        status: 'update',
        resource_id: 1,
        data: {
          id: 1,
          attendance: 2,
          visit_attendance: 2,
          deleted: false,
        },
      } as any),
    ).toBe(MiniappBookingStatus.Confirmed);
  });

  it('ignores non-record payloads', () => {
    expect(
      mapYclientsRecordPayloadToBookingStatus({
        resource: 'finances_operation',
        status: 'create',
        resource_id: 1,
        data: {},
      } as any),
    ).toBeNull();
  });
});
```

---

## 16. Acceptance criteria

### Webhook

- `record` webhook с `attendance = 1` обновляет `miniapp_bookings.status` в `completed`.
- `record` webhook с `visit_attendance = 1` обновляет `miniapp_bookings.status` в `completed`.
- `record` webhook с `attendance = -1` обновляет status в `canceled`.
- `record` webhook с `deleted = true` обновляет status в `canceled`.
- `record` webhook с `attendance = 0` или `2` обновляет status в `confirmed`.
- Связь идёт по `miniapp_bookings.yclients_record_id = payload.resource_id`.
- Если запись не найдена, webhook не падает.

### Migration

- Миграция берёт последнее событие из `yclients_events` по каждому `resource_id`.
- Сортировка: `date_created DESC, id DESC`.
- Статус берётся из `json.data.visit_attendance ?? json.data.attendance`.
- Миграция обновляет `miniapp_bookings.status`.
- Миграция не вызывает YClients API.

### Dashboard

- Верхняя полоса визуально не меняется.
- Карточка `"записались"` показывает `miniapp_bookings_total`.
- В карточке есть разбивка:
  - `Дошли: miniapp_bookings_completed`;
  - `Отменили: miniapp_bookings_canceled`.
- Старые referral-поля не удалены.

### Список записей

- Убран фильтр только по рефералам.
- Показываются все `miniapp_bookings`.

### Miniapp

- Для `status = completed` показывается бейдж `"архив"`.

---

## 17. Проверочные SQL

Проверить распределение статусов после миграции:

```sql
SELECT
  status,
  COUNT(*) AS count
FROM miniapp_bookings
GROUP BY status
ORDER BY status;
```

Проверить связку последних YClients events и bookings:

```sql
SELECT
  e.resource_id,
  e.date_created,
  e.json #>> '{data,attendance}' AS attendance,
  e.json #>> '{data,visit_attendance}' AS visit_attendance,
  e.json #>> '{data,deleted}' AS deleted,
  b.id AS booking_id,
  b.status AS booking_status
FROM yclients_events e
JOIN miniapp_bookings b
  ON b.yclients_record_id = e.resource_id
WHERE e.resource = 'record'
ORDER BY e.date_created DESC
LIMIT 100;
```

Проверить dashboard counters напрямую:

```sql
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
  COUNT(*) FILTER (WHERE status = 'canceled')::int AS canceled
FROM miniapp_bookings;
```

Если dashboard должен учитывать период:

```sql
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
  COUNT(*) FILTER (WHERE status = 'canceled')::int AS canceled
FROM miniapp_bookings
WHERE date_created BETWEEN :start AND :end;
```

---

## 18. Проверки после реализации

```sh
pnpm -F api typecheck
pnpm -F api test
pnpm -F api migration:run
pnpm -F api-client generate
pnpm -F miniapp build
```

Если есть отдельная сборка admin/cms, прогнать её тоже.

---

## 19. Self-review

### Что не усложняем

- Не добавляем новую сущность “архив”.
- Не добавляем новый enum — `completed` уже есть.
- Не создаём новый webhook controller.
- Не делаем cron-синхронизацию с YClients.
- Не вызываем YClients API в миграции.
- Не ломаем старые referral-поля dashboard.

### Что обязательно

- Не использовать `payload.status` как статус записи.
- Не использовать `isBookEvent` для miniapp booking status.
- Обновлять записи через `yclients_record_id`.
- В dashboard считать все miniapp-записи, а не только referral.
- В miniapp показывать `completed` как `"архив"`.

### Основной риск

Точный смысл `attendance = 2` в YClients может отличаться в разных филиалах/настройках. По текущим данным его нельзя считать `completed` или `canceled`, поэтому в рамках этой задачи он остаётся `confirmed`.

Если позже подтвердится, что `2` означает отдельный конечный статус, нужно будет расширить enum/логику отдельно.
