import {PartialType} from '@nestjs/swagger';
import {MiniappCreateDto} from './miniapp-create.dto';

export class MiniappUpdateDto extends PartialType(MiniappCreateDto) {}
