import {ApiProperty, PickType} from '@nestjs/swagger';
import {MiniappYclientsIntegration} from '../../../../modules/miniapp/miniapp-yclients.entity';
import {Miniapp} from '../../../../modules/miniapp/miniapp.entity';

export class MiniappYclientsIntegrationPreviewDto extends PickType(
  MiniappYclientsIntegration,
  [
    'company_id',
    'website',
    'whatsapp',
    'telegram',
    'phone',
    'email',
    'lng',
    'lat',
    'address_text',
    'timezone',
    'timezone_name',
    'city',
    'country',
  ],
) {}

export class MiniappCompanyPreviewDto extends PickType(Miniapp, [
  'logo_url',
  'title',
  'public_title',
  'description',
  'short_descr',
]) {}

export class MiniappYclientsPreviewDto {
  @ApiProperty({type: MiniappYclientsIntegrationPreviewDto})
  integration: MiniappYclientsIntegrationPreviewDto;

  @ApiProperty({type: MiniappCompanyPreviewDto})
  company: MiniappCompanyPreviewDto;
}
