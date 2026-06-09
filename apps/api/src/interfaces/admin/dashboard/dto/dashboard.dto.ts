import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsIn, IsOptional} from 'class-validator';

export class DashboardFilter {
  @ApiPropertyOptional({enum: ['7d', '30d', '3m'], default: '7d'})
  @IsOptional()
  @IsIn(['7d', '30d', '3m'])
  period?: '7d' | '30d' | '3m';
}

export class DashboardSeriesItem {
  @ApiProperty({example: '2026-05-14'})
  date: string;

  @ApiProperty({example: 12})
  visits: number;

  @ApiProperty({example: 4})
  referral_opens: number;

  @ApiProperty({example: 2})
  referral_bookings: number;

  @ApiProperty({example: 12000})
  referral_payments: number;

  @ApiProperty({example: 12000})
  miniapp_payments: number;
}

export class DashboardPaymentService {
  @ApiProperty({example: 1})
  id: number;

  @ApiProperty({example: 'Лазерная эпиляция'})
  service_title: string | null;

  @ApiProperty({example: 123456789, nullable: true})
  customer_id: number | null;

  @ApiProperty({example: 'username', nullable: true})
  customer_username: string | null;

  @ApiProperty({example: '+79031111111', nullable: true})
  customer_phone: string | null;

  @ApiProperty({example: '2026-05-14', nullable: true})
  booking_date: string | null;

  @ApiProperty({example: '10:00', nullable: true})
  booking_time: string | null;

  @ApiProperty({example: 4500})
  amount: number | null;

  @ApiProperty({example: '2026-05-14T10:00:00.000Z'})
  date_created: Date;
}

export class DashboardCountersResponse {
  @ApiProperty({example: {slug: 'etlazer', name: 'ET Laser'}})
  project: {slug: string; name: string};

  @ApiProperty({enum: ['7d', '30d', '3m']})
  period: '7d' | '30d' | '3m';

  @ApiProperty({example: {from: '2026-05-08', to: '2026-05-14'}})
  range: {from: string; to: string};

  @ApiProperty({
    example: {
      unique_customers: 128,
      referral_shares: 45,
      referral_opens_total: 19,
      referral_bookings_total: 7,
      miniapp_bookings_total: 33,
      miniapp_bookings_completed: 21,
      miniapp_bookings_canceled: 4,
      miniapp_payments_amount: 45000,
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
    miniapp_payments_amount: number;
    referral_payments_amount: number;
  };

  @ApiProperty({type: DashboardSeriesItem, isArray: true})
  series: DashboardSeriesItem[];

  @ApiProperty({type: DashboardPaymentService, isArray: true})
  payment_services: DashboardPaymentService[];
}
