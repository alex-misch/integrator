import {ApiProperty} from '@nestjs/swagger';
import {DBFile} from '../../../../modules/files/files.entity';
import {MiniappYclientsIntegration} from '../../../../modules/miniapp/miniapp-yclients.entity';
import {MiniappReview} from '../../../../modules/miniapp/miniapp-review.entity';
import {MiniappService} from '../../../../modules/miniapp/miniapp-service.entity';
import {MiniappSpecialist} from '../../../../modules/miniapp/miniapp-specialist.entity';
import {MiniappBooking} from '../../../../modules/miniapp/miniapp-booking.entity';

export class MiniappDetailDto {
  @ApiProperty({example: 1})
  id: number;

  @ApiProperty({example: 'ET.Lazer'})
  name: string;

  @ApiProperty({example: 'etlazer', nullable: true})
  slug: string | null;

  @ApiProperty({example: '123456:ABC-DEF', nullable: true})
  telegram_bot_token: string | null;

  @ApiProperty({
    example: 'https://be.cdn.yclients.com/images/yclients-default-logo.png',
    nullable: true,
  })
  logo_url: string | null;

  @ApiProperty({example: 'Дисфуксия', nullable: true})
  title: string | null;

  @ApiProperty({example: 'Дисфуксия', nullable: true})
  public_title: string | null;

  @ApiProperty({example: 'Салон красоты', nullable: true})
  short_descr: string | null;

  @ApiProperty({example: 'Описание', nullable: true})
  description: string | null;

  @ApiProperty({type: () => [DBFile]})
  photos: DBFile[];

  @ApiProperty({type: () => [MiniappYclientsIntegration]})
  yclientsIntegrations: MiniappYclientsIntegration[];

  @ApiProperty({type: () => [MiniappReview]})
  reviews: MiniappReview[];

  @ApiProperty({type: () => [MiniappService]})
  services: MiniappService[];

  @ApiProperty({type: () => [MiniappSpecialist]})
  specialists: MiniappSpecialist[];

  @ApiProperty({type: () => [MiniappBooking]})
  bookings: MiniappBooking[];
}
