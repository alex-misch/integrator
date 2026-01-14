import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {DBFile} from './files.entity';
import {parse} from 'file-type-mime';
import {UploadService} from './upload.service';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(DBFile)
    private readonly fileRepository: Repository<DBFile>,

    private readonly uploadService: UploadService,
  ) {}

  private allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

  async createFromBuffer(buffer: Buffer, folder?: string) {
    try {
      const fileMeta = await parse(buffer);
      if (!fileMeta) {
        throw new Error('Unrecognized file');
      }
      const {mime, ext} = fileMeta;
      const {url} = await this.uploadService.put(buffer, ext, folder);
      const size = Buffer.byteLength(buffer);
      return this.createImage({
        mimetype: mime.toLowerCase(),
        url: url,
        size: size,
      });
    } catch (error) {
      console.error('ERR S3', error);
      throw new BadRequestException({message: 'Fail to save file', error});
    }
  }

  private async createImage(
    fileInput?: {
      mimetype: string;
      url: string;
      size: number;
    } | null,
  ): Promise<DBFile> {
    if (!fileInput) throw new BadRequestException('file should not be empty');

    // Проверка типа файла
    if (!this.allowedTypes.includes(fileInput.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and GIF formats are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileInput.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const file = this.fileRepository.create({
      mime_type: fileInput.mimetype,
      url: fileInput.url,
    });
    return this.fileRepository.save(file);
  }

  async delete(id: number): Promise<void> {
    const file = await this.fileRepository.findOne({where: {id}});
    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.fileRepository.remove(file);
  }

  async findOne(id: number): Promise<DBFile> {
    const file = await this.fileRepository.findOne({where: {id}});
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async findAll(): Promise<DBFile[]> {
    return this.fileRepository.find();
  }

  async update(id: number, data: Partial<DBFile>) {
    return this.fileRepository.update(id, data);
  }
}
