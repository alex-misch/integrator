import {YClientRequest} from '../customer-loyalty/yclients-webhook.types';
import {
  isCompletedYclientsRecord,
  isYclientsPayment,
} from './miniapp-client-revenue.mapper';

describe('miniapp-client-revenue.mapper', () => {
  it('matches record attendance=1 as completed visit', () => {
    expect(
      isCompletedYclientsRecord(recordPayload({attendance: 1})),
    ).toBeTruthy();
  });

  it('prefers record visit_attendance=1 as completed visit', () => {
    expect(
      isCompletedYclientsRecord(
        recordPayload({attendance: 0, visit_attendance: 1}),
      ),
    ).toBeTruthy();
  });

  it.each([0, 2, -1])('ignores record attendance=%s', attendance => {
    expect(isCompletedYclientsRecord(recordPayload({attendance}))).toBeFalsy();
  });

  it('matches finances_operation create amount>0 as payment', () => {
    expect(
      isYclientsPayment(paymentPayload({status: 'create', amount: 3000})),
    ).toBeTruthy();
  });

  it('matches finances_operation update amount>0 as payment', () => {
    expect(
      isYclientsPayment(paymentPayload({status: 'update', amount: 3000})),
    ).toBeTruthy();
  });

  it('ignores finances_operation amount=0', () => {
    expect(
      isYclientsPayment(paymentPayload({status: 'create', amount: 0})),
    ).toBeFalsy();
  });

  it('ignores deleted finances_operation', () => {
    expect(
      isYclientsPayment(
        paymentPayload({status: 'create', amount: 3000, deleted: true}),
      ),
    ).toBeFalsy();
  });
});

function recordPayload(data: {
  attendance?: number;
  visit_attendance?: number;
  deleted?: boolean;
}): YClientRequest {
  return {
    resource: 'record',
    status: 'update',
    resource_id: 1,
    data: {
      id: 1,
      ...data,
    },
  };
}

function paymentPayload(data: {
  status: 'create' | 'update';
  amount: number;
  deleted?: boolean;
}): YClientRequest {
  return {
    resource: 'finances_operation',
    status: data.status,
    resource_id: 1,
    data: {
      id: 1,
      amount: data.amount,
      deleted: data.deleted,
    },
  };
}
