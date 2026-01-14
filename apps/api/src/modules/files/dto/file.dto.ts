import { IsIn, IsNotEmpty } from 'class-validator';

export class CreateFileDto {
  @IsNotEmpty()
  path: string;

  @IsIn(['image/jpeg', 'image/png', 'image/gif'], {
    message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
  })
  mime_type: string;
}
