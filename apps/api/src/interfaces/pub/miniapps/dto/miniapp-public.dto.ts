import {ApiProperty, PickType} from '@nestjs/swagger';
import {DBFile} from '../../../../modules/files/files.entity';
import {Miniapp} from '../../../../modules/miniapp/miniapp.entity';
import {MiniappReview} from '../../../../modules/miniapp/miniapp-review.entity';
import {MiniappYclientsIntegration} from '../../../../modules/miniapp/miniapp-yclients.entity';
import {MiniappService} from '../../../../modules/miniapp/miniapp-service.entity';
import {MiniappSpecialist} from '../../../../modules/miniapp/miniapp-specialist.entity';

export class MiniappPublicIntegrationDto extends PickType(
  MiniappYclientsIntegration,
  [
    'id',
    'company_id',
    'is_primary',
    'city',
    'country',
    'address_text',
    'lat',
    'lng',
    'phone',
    'email',
    'telegram',
    'whatsapp',
    'website',
    'timezone',
    'timezone_name',
  ],
) {}

export class MiniappPublicCompanyDto {
  @ApiProperty({example: 1714663})
  id: number;

  @ApiProperty({example: 'Москва, Летниковская улица, 10с2'})
  title: string;
}

export class MiniappPublicReviewDto extends PickType(MiniappReview, [
  'id',
  'text',
  'rating',
  'author',
  'author_photo',
]) {}

export class MiniappPublicDto extends PickType(Miniapp, [
  'id',
  'name',
  'slug',
  'logo_url',
  'title',
  'public_title',
  'short_descr',
  'description',
]) {
  @ApiProperty({type: () => [DBFile]})
  photos: DBFile[];

  @ApiProperty({type: () => [MiniappPublicReviewDto]})
  reviews: MiniappPublicReviewDto[];

  @ApiProperty({type: () => [MiniappPublicCompanyDto]})
  companies: MiniappPublicCompanyDto[];

  @ApiProperty({type: MiniappPublicIntegrationDto, nullable: true})
  integration: MiniappPublicIntegrationDto | null;
}

export class MiniappPublicServiceDto extends PickType(MiniappService, [
  'id',
  'title',
  'price_text',
  'duration_text',
  'price_min',
  'price_max',
  'duration_sec',
  'service_type',
  'weight',
  'yclients_id',
  'is_active',
]) {
  @ApiProperty({example: 1})
  id: number;
}

export class MiniappPublicSpecialistDto extends PickType(MiniappSpecialist, [
  'id',
  'name',
  'role',
  'photo_url',
  'yclients_id',
  'is_active',
]) {
  @ApiProperty({example: 1})
  id: number;
}

export class MiniappTimeslotDto {
  @ApiProperty({example: '17:30'})
  time: string;

  @ApiProperty({example: 1800})
  seance_length: number;

  @ApiProperty({example: '2024-01-31T17:30:00+0300'})
  datetime: string;
}
