# YCLIENTS Loyalty API (TypeScript / NestJS Client)

## Возможности

- Получить список карт по номеру телефона
- Выдать карту
- Начислить баллы
- Списать баллы

---

## Эндпоинты (по спецификации)

- `GET /api/v1/loyalty/cards/{phone}/{group_id}/{company_id}` — список карт
- `POST /api/v1/loyalty/cards/{company_id}` — выдать карту
- `POST /api/v1/company/{company_id}/loyalty/cards/{card_id}/manual_transaction` — операции с балансом

---

## Типы

```ts
export interface LoyaltyCardProgramRule {
  id: number;
  loyalty_program_id: number;
  loyalty_type_id: number;
  value: number;
  parameter: number;
}

export interface LoyaltyTypeInfo {
  id: number;
  title: string;
  is_discount: boolean;
  is_cashback: boolean;
  is_static: boolean;
  is_accumulative: boolean;
}

export interface LoyaltyCardProgram {
  id: number;
  title: string;
  value: number;
  loyalty_type_id: number;
  item_type_id: number;
  value_unit_id: number;
  group_id: number;
  loyalty_type: LoyaltyTypeInfo;
  rules: LoyaltyCardProgramRule[];
}

export interface LoyaltyCardTypeRef {
  id: number;
  title: string;
  salon_group_id: number;
}

export interface LoyaltySalonGroupRef {
  id: number;
  title: string;
}

export interface LoyaltyCard {
  id: number;
  balance: number;
  points: number;
  paid_amount: number;
  sold_amount: number;
  visits_count: number;
  number: string | number;
  type_id: number;
  salon_group_id: number;
  type: LoyaltyCardTypeRef;
  salon_group: LoyaltySalonGroupRef;
  programs: LoyaltyCardProgram[];
}

export type LoyaltyCardsResponse = YclientsSuccessResponse<
  LoyaltyCard[],
  MetaEmptyArray
>;
export type LoyaltyCardResponse = YclientsSuccessResponse<
  LoyaltyCard,
  MetaEmptyObject
>;

export interface IssueLoyaltyCardRequest {
  loyalty_card_number: number;
  loyalty_card_type_id: number;
  phone: number;
}

export interface LoyaltyCardManualTransactionRequest {
  amount: number;
  title?: string;
}
```
