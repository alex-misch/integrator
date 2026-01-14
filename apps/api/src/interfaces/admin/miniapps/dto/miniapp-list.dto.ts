import {ApiProperty, PickType} from '@nestjs/swagger';
import {DBFile} from '../../../../modules/files/files.entity';
import {MiniappYclientsIntegration} from 'src/modules/miniapp/miniapp-yclients.entity';

export class MiniappListItemYclientsIntegrationDto extends PickType(
  MiniappYclientsIntegration,
  ['company_id', 'address_text'],
) {}

export class MiniappListItemDto {
  @ApiProperty({example: 1})
  id: number;

  @ApiProperty({example: 'ET.Lazer'})
  name: string;

  @ApiProperty({example: 'etlazer', nullable: true})
  slug: string | null;

  @ApiProperty({type: () => [DBFile]})
  photos: DBFile[];

  @ApiProperty({type: MiniappListItemYclientsIntegrationDto, isArray: true})
  integrations: MiniappListItemYclientsIntegrationDto[];
}
