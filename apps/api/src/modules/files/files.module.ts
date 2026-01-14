import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from './files.service';
import { DBFile } from './files.entity';
import { UploadService } from './upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([DBFile])],
  providers: [FileService, UploadService],
  exports: [FileService, UploadService],
})
export class FileModule {}
